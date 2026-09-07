import {lookup} from 'node:dns/promises';
import {readFile, stat} from 'node:fs/promises';
import {extname} from 'node:path';
import {gunzipSync} from 'node:zlib';
import {XMLParser} from 'fast-xml-parser';
import {SyntaxValidator} from 'fast-xml-validator';
import {Agent, fetch as undiciFetch} from 'undici';
import {createPinnedLookup, isUnsafeRemoteAddress} from '../../shared/network-policy.ts';
import {XmlImportBudget, XmlImportLimitError, XML_IMPORT_LIMITS} from './xml-budget.ts';

const MAX_COMPRESSED_SIZE = 5 * 1024 * 1024;
const MAX_XML_SIZE = 20 * 1024 * 1024;
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

    init.signal?.throwIfAborted();
    const hostname = url.hostname.replace(/^\[|\]$/g, '');
    const addresses = await withAbort(lookup(hostname, {all: true, verbatim: true}), init.signal);
    init.signal?.throwIfAborted();
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

async function withAbort<T>(promise: Promise<T>, signal?: AbortSignal | null): Promise<T> {
    if (!signal) return promise;
    signal.throwIfAborted();
    let onAbort: () => void = () => undefined;
    try {
        return await Promise.race([promise, new Promise<never>((_, reject) => {
            onAbort = () => reject(signal.reason);
            signal.addEventListener('abort', onAbort, {once: true});
        })]);
    } finally {
        signal.removeEventListener('abort', onAbort);
    }
}

async function readLimitedResponse(response: SafeResponse, budget: XmlImportBudget): Promise<Buffer> {
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
            budget.consumeBytes(value.byteLength);
            total += value.byteLength;
            if (total > MAX_XML_SIZE) throw new Error('XML-Sitemap ist größer als 20 MB.');
            chunks.push(value);
        }
    } finally {
        await reader.cancel();
        reader.releaseLock();
    }
    return Buffer.concat(chunks, total);
}

async function fetchXml(startUrl: URL, allowedOrigin: string, budget: XmlImportBudget): Promise<Buffer> {
    let url = startUrl;
    for (let redirects = 0; redirects <= 5; redirects += 1) {
        if (url.origin !== allowedOrigin) throw new Error(`Sitemap verweist auf fremde Domain: ${url.origin}`);

        budget.request();
        const {response, close} = await fetchSafeRemote(url, {
            redirect: 'manual',
            signal: AbortSignal.any([budget.signal, AbortSignal.timeout(FETCH_TIMEOUT)]),
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
            return await readLimitedResponse(response, budget);
        } finally {
            await response.body?.cancel();
            await close();
        }
    }
    throw new Error('Sitemap hat zu viele Weiterleitungen.');
}

function decodeXml(buffer: Buffer, source: string, budget: XmlImportBudget): string {
    const compressed = extname(new URL(source, 'file:///').pathname).toLowerCase() === '.gz'
        || (buffer[0] === 0x1f && buffer[1] === 0x8b);
    const decoded = compressed ? gunzipSync(buffer, {maxOutputLength: MAX_XML_SIZE}) : buffer;
    if (decoded.byteLength > MAX_XML_SIZE) throw new Error('XML-Sitemap ist größer als 20 MB.');
    budget.consumeBytes(decoded.byteLength);
    return decoded.toString('utf8');
}

function parseDocument(buffer: Buffer, source: string, budget: XmlImportBudget): SitemapDocument {
    try {
        const xml = decodeXml(buffer, source, budget);
        SyntaxValidator.validate(xml, {
            allowBooleanAttributes: false,
            docType: {maxEntityCount: 0, maxEntitySize: 0},
        });
        const parsed = xmlParser.parse(xml) as SitemapDocument;
        if (!parsed.urlset && !parsed.sitemapindex) throw new Error('XML enthält weder urlset noch sitemapindex.');
        return parsed;
    } catch (error) {
        budget.check();
        if (error instanceof XmlImportLimitError) throw error;
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

export type XmlImportOptions = {allowRemote?: boolean; signal?: AbortSignal};

/** Transport injection keeps traversal tests offline; IPC never accepts a transport. */
export async function parseXmlImport(
    source: string,
    initialBuffer: Buffer,
    options: XmlImportOptions = {},
    loadRemote = fetchXml,
    budget = new XmlImportBudget(options.signal),
): Promise<ParsedXmlImport> {
    const rawUrls: string[] = [];
    const warnings = budget.warnings;
    let allowedOrigin = /^https?:/.test(source) ? new URL(source).origin : '';
    let offlineIndex = false;

    const visit = async (currentSource: string, buffer: Buffer, depth: number): Promise<void> => {
        budget.check();
        const document = parseDocument(buffer, currentSource, budget);
        const entries = asArray(document.urlset?.url);
        if (entries.length > XML_IMPORT_LIMITS.urls - rawUrls.length) {
            throw new XmlImportLimitError('Sitemap enthält mehr als 10000 URLs.');
        }
        // Commit only after the whole URL batch fits. Limit failures are fatal.
        rawUrls.push(...entries.map(entry => locValue(entry.loc)).filter(Boolean));

        for (const entry of asArray(document.sitemapindex?.sitemap)) {
            budget.check();
            const loc = locValue(entry.loc);
            const childUrl = normalizePageUrl(loc);
            if (!childUrl) {
                budget.warn(`Ungültige Sitemap-URL übersprungen: ${loc || '(leer)'}`);
                continue;
            }
            if (!options.allowRemote) {
                offlineIndex = true;
                budget.warn(`Offline: verknüpfte Sitemap nicht geladen (${childUrl.origin}). Für Indexdateien Netzwerkzugriff aktivieren und Datei erneut auswählen.`);
                continue;
            }
            allowedOrigin ||= childUrl.origin;
            if (childUrl.origin !== allowedOrigin) {
                budget.warn(`Sitemap verweist auf fremde Domain: ${childUrl.origin}`);
                continue;
            }
            // Reserve before fetching, including failed files. Check duplicates first.
            if (!budget.reserveDocument(childUrl.href, depth + 1)) continue;
            try {
                await visit(childUrl.href, await loadRemote(childUrl, allowedOrigin, budget), depth + 1);
            } catch (error) {
                budget.check();
                if (error instanceof XmlImportLimitError) throw error;
                budget.warn(`${childUrl.href}: ${error instanceof Error ? error.message : 'Import fehlgeschlagen'}`);
            }
        }
    };

    budget.reserveDocument(source, 0);
    await visit(source, initialBuffer, 0);

    const pages: ImportedXmlPage[] = [];
    const seen = new Set<string>();
    let pageOrigin = '';
    for (const value of rawUrls) {
        budget.check();
        const url = normalizePageUrl(value);
        if (!url) {
            budget.warn(`Ungültige Seiten-URL übersprungen: ${value}`);
            continue;
        }
        pageOrigin ||= url.origin;
        if (url.origin !== pageOrigin) {
            budget.warn(`Fremde Domain übersprungen: ${url.href}`);
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

    if (!pages.length) throw new Error(offlineIndex
        ? `Offline-Import: ${warnings[0]}`
        : 'XML-Sitemap enthält keine importierbaren URLs.');
    pages.sort((left, right) => left.path.localeCompare(right.path, 'de'));
    const host = new URL(pageOrigin).hostname.replace(/^www\./, '');
    return {
        pages,
        baseUrl: pageOrigin,
        projectName: `Import ${host}`,
        warnings,
    };
}

export async function parseXmlSitemap(path: string, options: XmlImportOptions = {}): Promise<ParsedXmlImport> {
    const budget = new XmlImportBudget(options.signal);
    budget.check();
    const file = await stat(path);
    if (!file.isFile()) throw new Error('Pfad ist keine Datei.');
    if (file.size > MAX_COMPRESSED_SIZE) throw new Error('XML-Datei ist größer als 5 MB.');
    return parseXmlImport(path, await readFile(path, {signal: budget.signal}), options, fetchXml, budget);
}

export async function parseXmlSitemapUrl(value: string, signal?: AbortSignal): Promise<ParsedXmlImport> {
    const url = normalizePageUrl(value.trim());
    if (!url) throw new Error('Bitte eine gültige HTTP- oder HTTPS-URL eingeben.');
    const budget = new XmlImportBudget(signal);
    return parseXmlImport(url.href, await fetchXml(url, url.origin, budget), {allowRemote: true, signal}, fetchXml, budget);
}
