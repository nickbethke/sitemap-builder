const PAGE_TYPES = new Set([
    'home', 'landing', 'service', 'content', 'contact', 'legal', 'archive',
    'external', 'form', 'product', 'category', 'account', 'error', 'search',
]);
const SEO_IMPORTANCE = new Set(['high', 'medium', 'low', 'none']);
const PAGE_STATUSES = new Set(['planned', 'in-progress', 'review', 'done']);
const MAX_NODES = 10_000;
const MAX_HIERARCHY_DEPTH = 100;
const MAX_SHORT_TEXT = 10_000;
const MAX_LONG_TEXT = 100_000;

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireString(record: UnknownRecord, key: string, maximum = MAX_SHORT_TEXT): string {
    const value = record[key];
    if (typeof value !== 'string' || value.length > maximum) {
        throw new Error(`Ungültiges oder zu langes Feld: ${key}`);
    }
    return value;
}

function optionalString(record: UnknownRecord, key: string, maximum = MAX_SHORT_TEXT): void {
    const value = record[key];
    if (value !== undefined && (typeof value !== 'string' || value.length > maximum)) {
        throw new Error(`Ungültiges oder zu langes Feld: ${key}`);
    }
}

function optionalBoolean(record: UnknownRecord, key: string): void {
    const value = record[key];
    if (value !== undefined && typeof value !== 'boolean') throw new Error(`Ungültiges Feld: ${key}`);
}

/** Validates untrusted .smap/autosave data before renderer or recursive graph code sees it. */
export function validateSitemapDocument(value: unknown): void {
    if (!isRecord(value) || value.formatVersion !== 1 || !isRecord(value.project) || !Array.isArray(value.nodes)) {
        throw new Error('Ungültige Sitemap-Struktur.');
    }
    if (value.nodes.length === 0 || value.nodes.length > MAX_NODES) {
        throw new Error(`Sitemap muss 1 bis ${MAX_NODES} Seiten enthalten.`);
    }

    requireString(value.project, 'name');
    requireString(value.project, 'baseUrl');
    requireString(value.project, 'client');
    requireString(value, 'updatedAt');

    const ids = new Set<string>();
    const parents = new Map<string, string | null>();
    let rootCount = 0;

    for (const rawNode of value.nodes) {
        if (!isRecord(rawNode)) throw new Error('Ungültiger Seiteneintrag.');
        const id = requireString(rawNode, 'id', 256);
        if (!id || ids.has(id)) throw new Error(`Doppelte oder leere Seiten-ID: ${id || '(leer)'}`);
        ids.add(id);

        const parentId = rawNode.parentId;
        if (parentId !== null && (typeof parentId !== 'string' || !parentId || parentId.length > 256)) {
            throw new Error(`Ungültige Parent-ID bei Seite ${id}.`);
        }
        if (parentId === null) rootCount += 1;
        parents.set(id, parentId);

        requireString(rawNode, 'title');
        requireString(rawNode, 'description', MAX_LONG_TEXT);
        requireString(rawNode, 'slug');
        requireString(rawNode, 'owner');
        requireString(rawNode, 'template');
        requireString(rawNode, 'notes', MAX_LONG_TEXT);
        optionalString(rawNode, 'seoTitle');
        optionalString(rawNode, 'seoDescription', MAX_LONG_TEXT);
        optionalString(rawNode, 'redirectFrom');
        optionalBoolean(rawNode, 'showInMainNavigation');
        if (typeof rawNode.noIndex !== 'boolean') throw new Error(`Ungültiges noIndex bei Seite ${id}.`);
        if (typeof rawNode.pageType !== 'string' || !PAGE_TYPES.has(rawNode.pageType)) throw new Error(`Ungültiger Seitentyp bei Seite ${id}.`);
        if (typeof rawNode.seoImportance !== 'string' || !SEO_IMPORTANCE.has(rawNode.seoImportance)) throw new Error(`Ungültige SEO-Relevanz bei Seite ${id}.`);
        if (typeof rawNode.status !== 'string' || !PAGE_STATUSES.has(rawNode.status)) throw new Error(`Ungültiger Status bei Seite ${id}.`);
    }

    if (rootCount !== 1) throw new Error('Sitemap muss genau eine Startseite besitzen.');
    for (const [id, parentId] of parents) {
        if (parentId !== null && !ids.has(parentId)) throw new Error(`Parent von Seite ${id} fehlt.`);
        const visited = new Set([id]);
        let cursor = parentId;
        let depth = 0;
        while (cursor !== null) {
            if (visited.has(cursor)) throw new Error(`Zyklische Seitenhierarchie bei Seite ${id}.`);
            visited.add(cursor);
            depth += 1;
            if (depth > MAX_HIERARCHY_DEPTH) throw new Error(`Seitenhierarchie ist tiefer als ${MAX_HIERARCHY_DEPTH} Ebenen.`);
            cursor = parents.get(cursor) ?? null;
        }
    }
}
