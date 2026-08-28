import type {ImportedPage} from '@/gen/app.ts';
import {DEFAULT_LOCALE, type Locale, type TranslationKey, translations} from '@/lib/i18n/translations.ts';
import {
    normalizeDocument,
    type PageType,
    type SitemapDocument,
    type SitemapNode,
} from '@/lib/sitemap.ts';

export type ImportPreviewPage = ImportedPage & {
    selected: boolean;
    parentPath: string | null;
    pageType: PageType;
};

function pathnameOf(path: string): string {
    let pathname: string;
    try {
        pathname = new URL(path, 'https://import.invalid').pathname;
    } catch {
        pathname = path.split('?')[0] || '/';
    }
    return pathname === '/' ? pathname : pathname.replace(/\/+$/, '');
}

function inferPageType(path: string): PageType {
    const normalized = pathnameOf(path).toLowerCase();
    if (normalized === '/') return 'home';
    if (/(^|\/)(kontakt|contact)\/?$/.test(normalized)) return 'contact';
    if (/(^|\/)(impressum|datenschutz|privacy|agb|widerruf)\/?$/.test(normalized)) return 'legal';
    if (/(^|\/)(blog|magazin|news|category|kategorie|shop)\/?$/.test(normalized)) return 'archive';
    return 'content';
}

function inferParentPath(path: string, availablePaths: Set<string>): string | null {
    const pathname = pathnameOf(path);
    if (pathname === '/') return null;
    const segments = pathname.split('/').filter(Boolean);
    while (segments.length > 0) {
        segments.pop();
        const candidate = segments.length ? `/${segments.join('/')}` : '/';
        if (availablePaths.has(candidate)) return candidate;
    }
    return null;
}

export function prepareImportPages(pages: ImportedPage[]): ImportPreviewPage[] {
    const availablePaths = new Set(pages.map(({path}) => pathnameOf(path)));
    return pages.map((page) => ({
        ...page,
        selected: true,
        parentPath: inferParentPath(page.path, availablePaths),
        pageType: inferPageType(page.path),
    }));
}

function idFromPath(path: string, usedIds: Set<string>): string {
    const base = pathnameOf(path) === '/'
        ? 'home'
        : pathnameOf(path)
            .replace(/^\/+|\/+$/g, '')
            .replace(/[^a-z0-9äöüß]+/gi, '-')
            .replace(/^-|-$/g, '')
            .toLowerCase() || 'page';
    let id = base;
    let suffix = 2;
    while (usedIds.has(id)) {
        id = `${base}-${suffix}`;
        suffix += 1;
    }
    usedIds.add(id);
    return id;
}

export function createImportedDocument(
    pages: ImportPreviewPage[],
    projectName: string,
    baseUrl: string,
    locale: Locale = DEFAULT_LOCALE,
): SitemapDocument {
    const t = (key: TranslationKey) => translations[locale][key];
    const selected = pages.filter(({selected}) => selected);
    const usedIds = new Set<string>();
    const idByPath = new Map<string, string>();
    const nodes: SitemapNode[] = [];

    const rootPage = selected.find(({path}) => pathnameOf(path) === '/');
    if (!rootPage) {
        usedIds.add('home');
        idByPath.set('/', 'home');
        nodes.push({
            id: 'home',
            parentId: null,
            title: t('import.autoHomeTitle'),
            description: '',
            slug: '/',
            pageType: 'home',
            seoImportance: 'high',
            status: 'done',
            owner: '',
            template: 'Homepage',
            noIndex: false,
            seoTitle: '',
            seoDescription: '',
            notes: t('import.autoHomeNote'),
            redirectFrom: '',
        });
    }

    for (const page of selected) {
        const pathname = pathnameOf(page.path);
        const id = idFromPath(page.path, usedIds);
        if (!idByPath.has(pathname)) idByPath.set(pathname, id);
        nodes.push({
            id,
            parentId: null,
            title: page.title.trim() || t('export.untitled'),
            description: '',
            slug: page.path || '/',
            pageType: pathname === '/' ? 'home' : page.pageType,
            seoImportance: pathname === '/' ? 'high' : 'medium',
            status: 'done',
            owner: '',
            template: pathname === '/' ? 'Homepage' : 'Standard',
            noIndex: page.noIndex,
            seoTitle: page.seoTitle,
            seoDescription: page.seoDescription,
            notes: page.warnings.join('\n'),
            redirectFrom: '',
        });
    }

    const rootId = idByPath.get('/') ?? nodes[0]?.id ?? null;
    const selectedPathnames = new Set(selected.map(({path}) => pathnameOf(path)));
    for (const node of nodes) {
        if (node.id === rootId) continue;
        let parentPath = inferParentPath(node.slug, selectedPathnames);
        while (parentPath && !idByPath.has(parentPath)) {
            parentPath = inferParentPath(parentPath, selectedPathnames);
        }
        node.parentId = (parentPath && idByPath.get(parentPath)) || rootId;
    }

    return normalizeDocument({
        formatVersion: 1,
        project: {name: projectName.trim() || t('import.defaultProjectName'), baseUrl, client: ''},
        nodes,
        updatedAt: new Date().toISOString(),
    });
}
