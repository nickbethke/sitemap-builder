import type {ImportedPage} from '../gen/app';
import {load} from 'cheerio';
import {assertSafeRemoteUrl, BROWSER_REQUEST_HEADERS} from './xml';

const MAX_HTML_SIZE = 2 * 1024 * 1024;
const PAGE_TIMEOUT = 10_000;
const MAX_REDIRECTS = 5;

export type InspectedPage = {
    page: ImportedPage;
    links: string[];
};

async function readHtml(response: Response): Promise<string> {
    const contentLength = Number(response.headers.get('content-length') ?? 0);
    if (contentLength > MAX_HTML_SIZE) throw new Error('HTML ist größer als 2 MB');
    if (!response.body) return '';

    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    try {
        while (true) {
            const {done, value} = await reader.read();
            if (done) break;
            total += value.byteLength;
            if (total > MAX_HTML_SIZE) throw new Error('HTML ist größer als 2 MB');
            chunks.push(value);
        }
    } finally {
        reader.releaseLock();
    }
    return Buffer.concat(chunks, total).toString('utf8');
}

function normalizeTitle(value: string): string {
    return value.replace(/\s+/g, ' ').trim();
}

function hasRobotsDirective(value: string, directive: 'noindex' | 'nofollow'): boolean {
    return new RegExp(`(?:^|[\\s,:])${directive}(?:$|[\\s,])`, 'i').test(value);
}

function result(page: ImportedPage, links: string[] = []): InspectedPage {
    return {page, links};
}

export async function inspectImportedPage(
    page: ImportedPage,
    signal: AbortSignal,
    collectLinks = false,
): Promise<InspectedPage> {
    const warnings = page.warnings.filter((warning) => warning !== 'Titel aus URL erzeugt');
    let url: URL;
    try {
        url = new URL(page.url);
    } catch {
        return result({...page, warnings: [...warnings, 'Ungültige Seiten-URL']});
    }

    try {
        for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
            await assertSafeRemoteUrl(url);
            const response = await fetch(url, {
                redirect: 'manual',
                signal: AbortSignal.any([signal, AbortSignal.timeout(PAGE_TIMEOUT)]),
                headers: {
                    accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.7',
                    ...BROWSER_REQUEST_HEADERS,
                },
            });

            if (response.status >= 300 && response.status < 400) {
                const location = response.headers.get('location');
                if (!location) {
                    return result({...page, httpStatus: response.status, finalUrl: url.href, warnings: [...warnings, `HTTP ${response.status} ohne Weiterleitungsziel`]});
                }
                const nextUrl = new URL(location, url);
                warnings.push(`Weiterleitung ${response.status}: ${url.href} → ${nextUrl.href}`);
                url = nextUrl;
                continue;
            }

            if (response.status >= 400) {
                warnings.push(`HTTP ${response.status}`);
                return result({...page, httpStatus: response.status, finalUrl: url.href, warnings});
            }

            const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
            if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
                warnings.push(`Kein HTML (${contentType || 'unbekannter Inhaltstyp'})`);
                return result({...page, httpStatus: response.status, finalUrl: url.href, warnings});
            }

            const $ = load(await readHtml(response));
            const seoTitle = normalizeTitle($('title').first().text());
            const heading = normalizeTitle($('h1').first().text());
            const seoDescription = normalizeTitle($('meta[name]').filter((_, element) => (
                ($(element).attr('name') ?? '').toLowerCase() === 'description'
            )).first().attr('content') ?? '');
            const robots = [
                ...$('meta[name]').filter((_, element) => (
                    ($(element).attr('name') ?? '').toLowerCase() === 'robots'
                )).map((_, element) => $(element).attr('content') ?? '').get(),
                response.headers.get('x-robots-tag') ?? '',
            ].join(',');
            const noIndex = hasRobotsDirective(robots, 'noindex');
            const noFollow = hasRobotsDirective(robots, 'nofollow');

            const canonicalHref = $('link[rel]').filter((_, element) => (
                ($(element).attr('rel') ?? '').toLowerCase().split(/\s+/).includes('canonical')
            )).first().attr('href')?.trim() ?? '';
            let canonicalUrl = '';
            if (canonicalHref) {
                try {
                    const canonical = new URL(canonicalHref, url);
                    canonical.hash = '';
                    canonicalUrl = canonical.href;
                } catch {
                    warnings.push(`Canonical ist ungültig: ${canonicalHref}`);
                }
            }

            if (!heading) warnings.push('H1 fehlt; Seitentitel aus URL erzeugt');
            if (!seoTitle) warnings.push('SEO-Titel fehlt');
            if (!seoDescription) warnings.push('SEO-Beschreibung fehlt');
            if (noIndex) warnings.push('Noindex');
            if (noFollow) warnings.push('Nofollow');
            if (canonicalUrl && canonicalUrl !== url.href) warnings.push(`Canonical weicht ab: ${canonicalUrl}`);

            const links = collectLinks
                ? $('a[href]').map((_, element) => $(element).attr('href') ?? '').get().filter(Boolean)
                : [];
            return result({
                ...page,
                title: heading || page.title,
                seoTitle,
                seoDescription,
                canonicalUrl,
                noIndex,
                noFollow,
                httpStatus: response.status,
                finalUrl: url.href,
                warnings,
            }, links);
        }
        return result({...page, finalUrl: url.href, warnings: [...warnings, `Mehr als ${MAX_REDIRECTS} Weiterleitungen`]});
    } catch (error) {
        if (signal.aborted) throw error;
        return result({
            ...page,
            finalUrl: url.href,
            warnings: [...warnings, error instanceof Error ? error.message : 'Seite konnte nicht geprüft werden'],
        });
    }
}

export async function enrichImportedPage(page: ImportedPage, signal: AbortSignal): Promise<ImportedPage> {
    return (await inspectImportedPage(page, signal)).page;
}
