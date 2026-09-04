import {lookup} from 'node:dns/promises';
import {readFile, stat} from 'node:fs/promises';
import {extname} from 'node:path';
import {gunzipSync} from 'node:zlib';
import {XMLParser} from 'fast-xml-parser';
import {SyntaxValidator} from 'fast-xml-validator';
import {Agent, fetch as undiciFetch} from 'undici';
import {createPinnedLookup, isUnsafeRemoteAddress} from '../../shared/network-policy';

const MAX_COMPRESSED_SIZE = 5 * 1024 * 1024;
const MAX_XML_SIZE = 20 * 1024 * 1024;
const MAX_SITEMAPS = 50;
const MAX_DEPTH = 5;
const MAX_URLS = 10_000;
const FETCH_TIMEOUT = 10_000;

export const BROWSER_REQUEST_HEADERS = {
    'accept-language': 'de-DE,de;q=0.9,en;q=0.7',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
};

export type ImportedXmlPage = {
    url: string;
    path: string;
    title: string;
    warnings: string[];
    httpStatus: number;
    finalUrl: string;
    seoTitle: string;
    seoDescription: string;
    canonicalUrl: string;
    noIndex: boolean;
    noFollow: boolean;
};

export type ParsedXmlImport = {
    pages: ImportedXmlPage[];
    baseUrl: string;
    projectName: string;
    warnings: string[];
};

type SitemapDocument = {
    urlset?: {url?: ArrayOrSingle<{loc?: unknown}>};
    sitemapindex?: {sitemap?: ArrayOrSingle<{loc?: unknown}>};
};

type ArrayOrSingle<T> = T | T[];

const xmlParser = new XMLParser({
    ignoreAttributes: false,
    removeNSPrefix: true,
    processEntities: false,
    parseTagValue: false,
    trimValues: true,
});

function asArray<T>(value: ArrayOrSingle<T> | undefined): T[] {
    if (value === undefined) return [];
    return Array.isArray(value) ? value : [value];
}

function decodePredefinedEntities(value: string): string {
    return value.replace(/&(amp|lt|gt|quot|apos);/g, (_, entity: string) => ({
        amp: '&', lt: '<', gt: '>', quot: '"', apos: "'",
    })[entity] ?? `&${entity};`);
}

function locValue(value: unknown): string {
    if (typeof value === 'string') return decodePredefinedEntities(value.trim());
    if (value && typeof value === 'object' && '#text' in value) {
        const text = (value as {'#text'?: unknown})['#text'];
        return typeof text === 'string' ? decodePredefinedEntities(text.trim()) : '';
    }
    return '';
}

export type SafeResponse = Awaited<ReturnType<typeof undiciFetch>>;

export async function fetchSafeRemote(
    url: URL,
    init: NonNullable<Parameters<typeof undiciFetch>[1]>,
): Promise<{response: SafeResponse; close: () => Promise<void>}> {
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error(`Nicht unterstützte Sitemap-URL: ${url.href}`);
    if (url.username || url.password) throw new Error(`Sitemap-URL enthält Zugangsdaten: ${url.href}`);
    if (url.hostname.toLowerCase() === 'localhost') throw new Error('Lokale Netzwerkadressen werden nicht importiert.');

    const addresses = await lookup(url.hostname, {all: true, verbatim: true});
    if (!addresses.length || addresses.some(({address}) => isUnsafeRemoteAddress(address))) {
        throw new Error(`Private Netzwerkadresse wird nicht importiert: ${url.hostname}`);
    }

    const agent = new Agent({connect: {lookup: createPinnedLookup(addresses)}});
    try {
        const response = await undiciFetch(url, {...init, dispatcher: agent});
        return {response, close: () => agent.close()};
    } catch (error) {
        await agent.close();
        throw error;
    }
}

async function readLimitedResponse(response: SafeResponse): Promise<Buffer> {
    const contentLength = Number(response.headers.get('content-length') ?? 0);
    if (contentLength > MAX_XML_SIZE) throw new Error('XML-Sitemap ist größer als 20 MB.');
    if (!response.body) return Buffer.alloc(0);

    const chunks: Uint8Array[] = [];
    let total = 0;
    const reader = response.body.getReader();
    try {
        while (true) {
            const {done, value} = await reader.read();
            if (done) break;
            total += value.byteLength;
            if (total > MAX_XML_SIZE) throw new Error('XML-Sitemap ist größer als 20 MB.');
            chunks.push(value);
        }
    } finally {
        if (total > MAX_XML_SIZE) await reader.cancel();
        reader.releaseLock();
    }
    return Buffer.concat(chunks, total);
}

async function fetchXml(startUrl: URL, allowedOrigin: string, signal?: AbortSignal): Promise<Buffer> {
    let url = startUrl;
    for (let redirects = 0; redirects <= 5; redirects += 1) {
        if (url.origin !== allowedOrigin) throw new Error(`Sitemap verweist auf fremde Domain: ${url.origin}`);

        const {response, close} = await fetchSafeRemote(url, {
            redirect: 'manual',
            signal: signal
                ? AbortSignal.any([signal, AbortSignal.timeout(FETCH_TIMEOUT)])
                : AbortSignal.timeout(FETCH_TIMEOUT),
            headers: {
                accept: 'application/xml,text/xml,application/xhtml+xml,text/html;q=0.9,*/*;q=0.8',
                ...BROWSER_REQUEST_HEADERS,
            },
        });
        try {
            if (response.status >= 300 && response.status < 400) {
                const location = response.headers.get('location');
                if (!location) throw new Error(`Ungültige Weiterleitung von ${url.href}`);
                url = new URL(location, url);
                continue;
            }
            if (!response.ok) throw new Error(`Sitemap konnte nicht geladen werden: HTTP ${response.status}`);
            return await readLimitedResponse(response);
        } finally {
            await response.body?.cancel();
            await close();
        }
    }
    throw new Error('Sitemap hat zu viele Weiterleitungen.');
}

function decodeXml(buffer: Buffer, source: string): string {
    const compressed = extname(new URL(source, 'file:///').pathname).toLowerCase() === '.gz'
        || (buffer[0] === 0x1f && buffer[1] === 0x8b);
    const decoded = compressed ? gunzipSync(buffer, {maxOutputLength: MAX_XML_SIZE}) : buffer;
    if (decoded.byteLength > MAX_XML_SIZE) throw new Error('XML-Sitemap ist größer als 20 MB.');
    return decoded.toString('utf8');
}

function parseDocument(buffer: Buffer, source: string): SitemapDocument {
    try {
        const xml = decodeXml(buffer, source);
        SyntaxValidator.validate(xml, {
            allowBooleanAttributes: false,
            docType: {maxEntityCount: 0, maxEntitySize: 0},
        });
        const parsed = xmlParser.parse(xml) as SitemapDocument;
        if (!parsed.urlset && !parsed.sitemapindex) throw new Error('XML enthält weder urlset noch sitemapindex.');
        return parsed;
    } catch (error) {
        if (error instanceof Error && error.message.includes('XML enthält')) throw error;
        throw new Error(`XML-Sitemap ist beschädigt oder ungültig: ${error instanceof Error ? error.message : 'Parserfehler'}`);
    }
}

function normalizePageUrl(value: string): URL | null {
    try {
        const url = new URL(value);
        if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null;
        url.hash = '';
        for (const key of [...url.searchParams.keys()]) {
            if (key.toLowerCase().startsWith('utm_') || ['gclid', 'fbclid'].includes(key.toLowerCase())) {
                url.searchParams.delete(key);
            }
        }
        return url;
    } catch {
        return null;
    }
}

function titleFromPath(pathname: string): string {
    if (pathname === '/') return 'Startseite';
    const segment = pathname.split('/').filter(Boolean).at(-1) ?? 'Seite';
    let decoded = segment;
    try {
        decoded = decodeURIComponent(segment);
    } catch {
        // Keep undecodable URL segment.
    }
    return decoded
        .replace(/[-_]+/g, ' ')
        .replace(/\b\p{L}/gu, (character) => character.toUpperCase());
}

async function parseXmlImport(
    source: string,
    initialBuffer: Buffer,
    initialAllowedOrigin = '',
    signal?: AbortSignal,
): Promise<ParsedXmlImport> {
    const documents = new Set<string>();
    const rawUrls: string[] = [];
    const warnings: string[] = [];
    let allowedOrigin = initialAllowedOrigin;

    const visit = async (currentSource: string, buffer: Buffer, depth: number): Promise<void> => {
        signal?.throwIfAborted();
        if (depth > MAX_DEPTH) throw new Error(`Sitemap-Index ist tiefer als ${MAX_DEPTH} Ebenen.`);
        if (documents.size >= MAX_SITEMAPS) throw new Error(`Sitemap-Index enthält mehr als ${MAX_SITEMAPS} Dateien.`);
        if (documents.has(currentSource)) {
            warnings.push(`Sitemap-Schleife übersprungen: ${currentSource}`);
            return;
        }
        documents.add(currentSource);

        const document = parseDocument(buffer, currentSource);
        for (const entry of asArray(document.urlset?.url)) {
            const loc = locValue(entry.loc);
            if (loc) rawUrls.push(loc);
            if (rawUrls.length > MAX_URLS) throw new Error(`Sitemap enthält mehr als ${MAX_URLS} URLs.`);
        }

        for (const entry of asArray(document.sitemapindex?.sitemap)) {
            const loc = locValue(entry.loc);
            const childUrl = normalizePageUrl(loc);
            if (!childUrl) {
                warnings.push(`Ungültige Sitemap-URL übersprungen: ${loc || '(leer)'}`);
                continue;
            }
            allowedOrigin ||= childUrl.origin;
            try {
                await visit(childUrl.href, await fetchXml(childUrl, allowedOrigin, signal), depth + 1);
            } catch (error) {
                if (signal?.aborted) throw error;
                warnings.push(`${childUrl.href}: ${error instanceof Error ? error.message : 'Import fehlgeschlagen'}`);
            }
        }
    };

    await visit(source, initialBuffer, 0);

    const pages: ImportedXmlPage[] = [];
    const seen = new Set<string>();
    let pageOrigin = '';
    for (const value of rawUrls) {
        const url = normalizePageUrl(value);
        if (!url) {
            warnings.push(`Ungültige Seiten-URL übersprungen: ${value}`);
            continue;
        }
        pageOrigin ||= url.origin;
        if (url.origin !== pageOrigin) {
            warnings.push(`Fremde Domain übersprungen: ${url.href}`);
            continue;
        }
        if (seen.has(url.href)) continue;
        seen.add(url.href);
        pages.push({
            url: url.href,
            path: `${url.pathname}${url.search}`,
            title: titleFromPath(url.pathname),
            warnings: ['Titel aus URL erzeugt'],
            httpStatus: 0,
            finalUrl: '',
            seoTitle: '',
            seoDescription: '',
            canonicalUrl: '',
            noIndex: false,
            noFollow: false,
        });
    }

    if (!pages.length) throw new Error('XML-Sitemap enthält keine importierbaren URLs.');
    pages.sort((left, right) => left.path.localeCompare(right.path, 'de'));
    const host = new URL(pageOrigin).hostname.replace(/^www\./, '');
    return {
        pages,
        baseUrl: pageOrigin,
        projectName: `Import ${host}`,
        warnings,
    };
}

export async function parseXmlSitemap(path: string): Promise<ParsedXmlImport> {
    const file = await stat(path);
    if (!file.isFile()) throw new Error('Pfad ist keine Datei.');
    if (file.size > MAX_COMPRESSED_SIZE) throw new Error('XML-Datei ist größer als 5 MB.');
    return parseXmlImport(path, await readFile(path));
}

export async function parseXmlSitemapUrl(value: string, signal?: AbortSignal): Promise<ParsedXmlImport> {
    const url = normalizePageUrl(value.trim());
    if (!url) throw new Error('Bitte eine gültige HTTP- oder HTTPS-URL eingeben.');
    return parseXmlImport(url.href, await fetchXml(url, url.origin, signal), url.origin, signal);
}
