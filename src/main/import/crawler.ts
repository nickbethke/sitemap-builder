import type {CrawlProgress, CrawlRequest, ImportedPage} from '../gen/app';
import {inspectImportedPage} from './page-parser';

const CONCURRENCY = 6;
const ASSET_EXTENSION = /\.(?:avif|bmp|css|csv|docx?|eot|gif|ico|jpe?g|js|json|map|mp3|mp4|mov|pdf|png|pptx?|rar|rss|svg|tar|tiff?|txt|webm|webp|woff2?|xlsx?|xml|zip)$/i;
const TRACKING_PARAMETERS = new Set(['fbclid', 'gclid', 'msclkid']);

type QueueItem = {url: URL; depth: number};
type PendingResult = {index: number; item: QueueItem; page: ImportedPage; links: string[]};

function normalizeUrl(
    value: string,
    baseUrl: URL,
    origin: string,
    ignoreQueryParameters: boolean,
): URL | null {
    try {
        const url = new URL(value, baseUrl);
        if (!['http:', 'https:'].includes(url.protocol) || url.origin !== origin || url.username || url.password) return null;
        if (ASSET_EXTENSION.test(url.pathname)) return null;
        url.hash = '';
        if (ignoreQueryParameters) {
            url.search = '';
        } else {
            for (const key of [...url.searchParams.keys()]) {
                if (key.toLowerCase().startsWith('utm_') || TRACKING_PARAMETERS.has(key.toLowerCase())) {
                    url.searchParams.delete(key);
                }
            }
            url.searchParams.sort();
        }
        return url;
    } catch {
        return null;
    }
}

function titleFromUrl(url: URL): string {
    if (url.pathname === '/') return 'Startseite';
    const segment = url.pathname.split('/').filter(Boolean).at(-1) ?? 'Seite';
    let decoded = segment;
    try {
        decoded = decodeURIComponent(segment);
    } catch {
        // Keep undecodable URL segment.
    }
    return decoded.replace(/[-_]+/g, ' ').replace(/\b\p{L}/gu, (character) => character.toUpperCase());
}

function pageFromUrl(url: URL): ImportedPage {
    return {
        url: url.href,
        path: `${url.pathname}${url.search}`,
        title: titleFromUrl(url),
        warnings: ['Titel aus URL erzeugt'],
        httpStatus: 0,
        finalUrl: '',
        seoTitle: '',
        seoDescription: '',
        canonicalUrl: '',
        noIndex: false,
        noFollow: false,
    };
}

export async function* crawlWebsite(request: CrawlRequest, signal: AbortSignal): AsyncGenerator<CrawlProgress> {
    let suppliedUrl: URL;
    try {
        suppliedUrl = new URL(request.startUrl.trim());
    } catch {
        throw new Error('Bitte eine gültige HTTP- oder HTTPS-Start-URL eingeben.');
    }
    if (!['http:', 'https:'].includes(suppliedUrl.protocol) || suppliedUrl.username || suppliedUrl.password) {
        throw new Error('Bitte eine gültige HTTP- oder HTTPS-Start-URL eingeben.');
    }

    const maxPages = Math.min(Math.max(request.maxPages || 500, 1), 2_000);
    const maxDepth = Math.min(request.maxDepth || 10, 30);
    let crawlOrigin = suppliedUrl.origin;
    const startUrl = normalizeUrl(suppliedUrl.href, suppliedUrl, crawlOrigin, request.ignoreQueryParameters);
    if (!startUrl) throw new Error('Start-URL kann nicht gecrawlt werden.');

    const queue: QueueItem[] = [{url: startUrl, depth: 0}];
    const seen = new Set([startUrl.href]);
    const pending = new Map<number, Promise<PendingResult>>();
    let queueIndex = 0;
    let taskIndex = 0;
    let completed = 0;

    const fillQueue = () => {
        while (pending.size < CONCURRENCY && queueIndex < queue.length) {
            const item = queue[queueIndex];
            queueIndex += 1;
            const index = taskIndex;
            taskIndex += 1;
            pending.set(index, inspectImportedPage(pageFromUrl(item.url), signal, true).then((inspection) => ({
                index,
                item,
                ...inspection,
            })));
        }
    };

    fillQueue();
    while (pending.size > 0) {
        const result = await Promise.race(pending.values());
        pending.delete(result.index);
        completed += 1;

        if (result.item.depth === 0 && result.page.finalUrl) {
            crawlOrigin = new URL(result.page.finalUrl).origin;
        }

        if (result.item.depth < maxDepth && seen.size < maxPages) {
            const linkBase = result.page.finalUrl ? new URL(result.page.finalUrl) : result.item.url;
            for (const href of result.links) {
                const url = normalizeUrl(href, linkBase, crawlOrigin, request.ignoreQueryParameters);
                if (!url || seen.has(url.href)) continue;
                seen.add(url.href);
                queue.push({url, depth: result.item.depth + 1});
                if (seen.size >= maxPages) break;
            }
        }

        yield {completed, discovered: seen.size, page: result.page};
        fillQueue();
    }
}
