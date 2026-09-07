export const XML_IMPORT_LIMITS = {
    files: 50,
    depth: 5,
    urls: 10_000,
    requests: 100,
    bytes: 100 * 1024 * 1024,
    warnings: 100,
    durationMs: 60_000,
} as const;

export class XmlImportLimitError extends Error {}

/** One budget for the entire import, including redirects, failed files and decoded bytes. */
export class XmlImportBudget {
    readonly signal: AbortSignal;
    readonly warnings: string[] = [];
    private readonly documents = new Set<string>();
    private requests = 0;
    private bytes = 0;
    private readonly deadline = Date.now() + XML_IMPORT_LIMITS.durationMs;

    constructor(signal?: AbortSignal) {
        const timeout = AbortSignal.timeout(XML_IMPORT_LIMITS.durationMs);
        this.signal = signal ? AbortSignal.any([signal, timeout]) : timeout;
    }

    check(): void {
        this.signal.throwIfAborted();
        // Also covers synchronous parsing, while the timeout callback cannot run.
        if (Date.now() >= this.deadline) throw new XmlImportLimitError('XML-Import dauert länger als 60 Sekunden.');
    }

    reserveDocument(source: string, depth: number): boolean {
        this.check();
        if (this.documents.has(source)) {
            this.warn(`Sitemap-Schleife übersprungen: ${source}`);
            return false;
        }
        if (depth > XML_IMPORT_LIMITS.depth) throw new XmlImportLimitError('Sitemap-Index ist tiefer als 5 Ebenen.');
        if (this.documents.size >= XML_IMPORT_LIMITS.files) throw new XmlImportLimitError('Sitemap-Index enthält mehr als 50 Dateien.');
        this.documents.add(source);
        return true;
    }

    request(): void {
        this.check();
        if (this.requests >= XML_IMPORT_LIMITS.requests) throw new XmlImportLimitError('XML-Import benötigt mehr als 100 HTTP-Anfragen.');
        this.requests += 1;
    }

    consumeBytes(bytes: number): void {
        this.check();
        if (this.bytes + bytes > XML_IMPORT_LIMITS.bytes) throw new XmlImportLimitError('XML-Import überschreitet das Gesamtbudget von 100 MB.');
        this.bytes += bytes;
    }

    warn(message: string): void {
        if (this.warnings.length < XML_IMPORT_LIMITS.warnings) this.warnings.push(message.slice(0, 2_000));
    }
}
