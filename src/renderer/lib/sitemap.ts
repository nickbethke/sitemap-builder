import {DEFAULT_LOCALE, type Locale, type TranslationKey, translations} from '@/lib/i18n/translations.ts';

export type PageType =
    | 'home'
    | 'landing'
    | 'service'
    | 'content'
    | 'contact'
    | 'legal'
    | 'archive'
    | 'external'
    | 'form'
    | 'product'
    | 'category'
    | 'account'
    | 'error'
    | 'search';

export type LayoutDirection = 'horizontal' | 'vertical';
export type SeoImportance = 'high' | 'medium' | 'low' | 'none';
export type PageStatus = 'planned' | 'in-progress' | 'review' | 'done';

export type SitemapNode = {
    id: string;
    parentId: string | null;
    title: string;
    description: string;
    slug: string;
    pageType: PageType;
    seoImportance: SeoImportance;
    status: PageStatus;
    owner: string;
    template: string;
    noIndex: boolean;
    seoTitle?: string;
    seoDescription?: string;
    notes: string;
    showInMainNavigation?: boolean;
    redirectFrom?: string;
};

export type ValidationIssue = {
    nodeId: string;
    level: 'error' | 'warning';
    messageKey: TranslationKey;
};

export type SitemapProject = {
    name: string;
    baseUrl: string;
    client: string;
};

export type SitemapDocument = {
    formatVersion: 1;
    project: SitemapProject;
    nodes: SitemapNode[];
    updatedAt: string;
};

export type ProjectTemplateId = 'empty' | 'company' | 'local-service' | 'shop';

export type ProjectTemplate = {
    id: ProjectTemplateId;
    titleKey: TranslationKey;
    descriptionKey: TranslationKey;
    pageCount: number;
};

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
    {
        id: 'empty',
        titleKey: 'template.empty.title',
        descriptionKey: 'template.empty.description',
        pageCount: 1,
    },
    {
        id: 'company',
        titleKey: 'template.company.title',
        descriptionKey: 'template.company.description',
        pageCount: 11,
    },
    {
        id: 'local-service',
        titleKey: 'template.local-service.title',
        descriptionKey: 'template.local-service.description',
        pageCount: 10,
    },
    {
        id: 'shop',
        titleKey: 'template.shop.title',
        descriptionKey: 'template.shop.description',
        pageCount: 12,
    },
];

export type Position = {
    x: number;
    y: number;
};

export type CardSize = {
    width: number;
    height: number;
};

export type SitemapLayout = {
    positions: Record<string, Position>;
    cardSizes: Record<string, CardSize>;
    width: number;
    height: number;
};

export type UpdateNode = <K extends keyof SitemapNode>(
    key: K,
    value: SitemapNode[K],
) => void;

export const CARD_WIDTH = 236;
export const DEFAULT_CARD_HEIGHT = 146;
const COLUMN_GAP = 200;
const ROW_GAP = 50;
const VERTICAL_LEVEL_GAP = 96;

export const PAGE_TYPES: PageType[] = [
    'home',
    'landing',
    'service',
    'content',
    'contact',
    'form',
    'product',
    'category',
    'archive',
    'account',
    'search',
    'error',
    'legal',
    'external',
];

export const PAGE_STATUSES: PageStatus[] = [
    'planned',
    'in-progress',
    'review',
    'done',
];

export const SEO_IMPORTANCE_LEVELS: SeoImportance[] = [
    'high',
    'medium',
    'low',
    'none',
];

export function isMainNavigationDefault(node: Pick<SitemapNode, 'parentId' | 'pageType'>) {
    return node.parentId !== null && !['legal', 'error', 'external'].includes(node.pageType);
}

export const starterDocument: SitemapDocument = {
    formatVersion: 1,
    project: {
        name: 'Relaunch 2025',
        baseUrl: 'https://beispiel.de',
        client: 'Musterkunde GmbH',
    },
    updatedAt: new Date().toISOString(),
    nodes: [
        {
            id: 'home',
            parentId: null,
            title: 'Startseite',
            description: 'Zentraler Einstieg in Marke und Angebot.',
            slug: '/',
            pageType: 'home',
            seoImportance: 'high',
            status: 'in-progress',
            owner: 'NB',
            template: 'Homepage',
            noIndex: false,
            notes: '',
        },
        {
            id: 'services',
            parentId: 'home',
            title: 'Leistungen',
            description: 'Übersicht aller Kernleistungen.',
            slug: '/leistungen',
            pageType: 'service',
            seoImportance: 'high',
            status: 'planned',
            owner: 'LS',
            template: 'Übersicht',
            noIndex: false,
            notes: '',
        },
        {
            id: 'about',
            parentId: 'home',
            title: 'Über uns',
            description: 'Agentur, Haltung und Team.',
            slug: '/ueber-uns',
            pageType: 'content',
            seoImportance: 'medium',
            status: 'review',
            owner: 'NB',
            template: 'Standard',
            noIndex: false,
            notes: '',
        },
        {
            id: 'contact',
            parentId: 'home',
            title: 'Kontakt',
            description: 'Anfrage und Kontaktdaten.',
            slug: '/kontakt',
            pageType: 'contact',
            seoImportance: 'medium',
            status: 'done',
            owner: 'LS',
            template: 'Kontakt',
            noIndex: false,
            notes: '',
        },
        {
            id: 'webdesign',
            parentId: 'services',
            title: 'Webdesign',
            description: 'Webdesign-Leistung und Prozess.',
            slug: '/leistungen/webdesign',
            pageType: 'landing',
            seoImportance: 'high',
            status: 'in-progress',
            owner: 'NB',
            template: 'Leistung',
            noIndex: false,
            notes: '',
        },
        {
            id: 'seo',
            parentId: 'services',
            title: 'SEO',
            description: 'Organische Sichtbarkeit steigern.',
            slug: '/leistungen/seo',
            pageType: 'landing',
            seoImportance: 'high',
            status: 'planned',
            owner: 'MK',
            template: 'Leistung',
            noIndex: false,
            notes: '',
        },
        {
            id: 'branding',
            parentId: 'services',
            title: 'Branding',
            description: 'Markenstrategie, Positionierung und visuelle Identität.',
            slug: '/leistungen/branding',
            pageType: 'landing',
            seoImportance: 'medium',
            status: 'planned',
            owner: 'LS',
            template: 'Leistung',
            noIndex: false,
            notes: 'Case Studies als vertrauensbildende Elemente einplanen.',
        },
        {
            id: 'content',
            parentId: 'services',
            title: 'Content Marketing',
            description: 'Inhalte, die Zielgruppen informieren und konvertieren.',
            slug: '/leistungen/content-marketing',
            pageType: 'landing',
            seoImportance: 'medium',
            status: 'in-progress',
            owner: 'MK',
            template: 'Leistung',
            noIndex: false,
            notes: '',
        },
        {
            id: 'process',
            parentId: 'webdesign',
            title: 'Unser Prozess',
            description: 'Von Strategie und Konzept bis zum Launch.',
            slug: '/leistungen/webdesign/prozess',
            pageType: 'content',
            seoImportance: 'medium',
            status: 'review',
            owner: 'NB',
            template: 'Standard',
            noIndex: false,
            notes: '',
        },
        {
            id: 'webdesign-faq',
            parentId: 'webdesign',
            title: 'Webdesign FAQ',
            description: 'Antworten auf häufige Fragen zu Projektablauf und Kosten.',
            slug: '/leistungen/webdesign/faq',
            pageType: 'content',
            seoImportance: 'low',
            status: 'planned',
            owner: 'NB',
            template: 'FAQ',
            noIndex: false,
            notes: '',
        },
        {
            id: 'seo-audit',
            parentId: 'seo',
            title: 'SEO Audit',
            description: 'Technische und inhaltliche Analyse der Website.',
            slug: '/leistungen/seo/audit',
            pageType: 'content',
            seoImportance: 'high',
            status: 'in-progress',
            owner: 'MK',
            template: 'Leistung',
            noIndex: false,
            notes: 'Lead-Magnet mit Audit-Checkliste prüfen.',
        },
        {
            id: 'seo-strategy',
            parentId: 'seo',
            title: 'SEO Strategie',
            description: 'Keyword- und Content-Strategie für nachhaltiges Wachstum.',
            slug: '/leistungen/seo/strategie',
            pageType: 'content',
            seoImportance: 'high',
            status: 'planned',
            owner: 'MK',
            template: 'Leistung',
            noIndex: false,
            notes: '',
        },
        {
            id: 'team',
            parentId: 'about',
            title: 'Team',
            description: 'Die Menschen hinter der Agentur.',
            slug: '/ueber-uns/team',
            pageType: 'content',
            seoImportance: 'medium',
            status: 'done',
            owner: 'LS',
            template: 'Team',
            noIndex: false,
            notes: '',
        },
        {
            id: 'values',
            parentId: 'about',
            title: 'Werte & Haltung',
            description: 'Wofür wir arbeiten und wie wir zusammenarbeiten.',
            slug: '/ueber-uns/werte',
            pageType: 'content',
            seoImportance: 'low',
            status: 'review',
            owner: 'NB',
            template: 'Standard',
            noIndex: false,
            notes: '',
        },
        {
            id: 'cases',
            parentId: 'home',
            title: 'Projekte',
            description: 'Ausgewählte Arbeiten und Erfolgsgeschichten.',
            slug: '/projekte',
            pageType: 'archive',
            seoImportance: 'high',
            status: 'in-progress',
            owner: 'LS',
            template: 'Übersicht',
            noIndex: false,
            notes: '',
        },
        {
            id: 'case-musterkunde',
            parentId: 'cases',
            title: 'Musterkunde GmbH',
            description: 'Relaunch mit klarer Positionierung und neuer Leadstrecke.',
            slug: '/projekte/musterkunde',
            pageType: 'content',
            seoImportance: 'medium',
            status: 'review',
            owner: 'NB',
            template: 'Case Study',
            noIndex: false,
            notes: '',
        },
        {
            id: 'insights',
            parentId: 'home',
            title: 'Wissen',
            description: 'Impulse zu Strategie, Design und digitalem Marketing.',
            slug: '/wissen',
            pageType: 'archive',
            seoImportance: 'medium',
            status: 'planned',
            owner: 'MK',
            template: 'Übersicht',
            noIndex: false,
            notes: '',
        },
        {
            id: 'article-relaunch',
            parentId: 'insights',
            title: 'Website-Relaunch planen',
            description: 'Die wichtigsten Schritte für einen erfolgreichen Relaunch.',
            slug: '/wissen/website-relaunch-planen',
            pageType: 'content',
            seoImportance: 'high',
            status: 'in-progress',
            owner: 'MK',
            template: 'Artikel',
            noIndex: false,
            notes: '',
        },
        {
            id: 'article-ia',
            parentId: 'insights',
            title: 'Informationsarchitektur',
            description: 'Wie eine klare Seitenstruktur Nutzerinnen und Nutzer führt.',
            slug: '/wissen/informationsarchitektur',
            pageType: 'content',
            seoImportance: 'medium',
            status: 'planned',
            owner: 'MK',
            template: 'Artikel',
            noIndex: false,
            notes: '',
        },
        {
            id: 'contact-briefing',
            parentId: 'contact',
            title: 'Projekt anfragen',
            description: 'Briefing-Formular für neue Projekte.',
            slug: '/kontakt/projekt-anfragen',
            pageType: 'landing',
            seoImportance: 'high',
            status: 'in-progress',
            owner: 'LS',
            template: 'Formular',
            noIndex: false,
            notes: 'Formularfelder mit Vertrieb abstimmen.',
        },
        {
            id: 'imprint',
            parentId: 'home',
            title: 'Impressum',
            description: 'Anbieterkennzeichnung.',
            slug: '/impressum',
            pageType: 'legal',
            seoImportance: 'low',
            status: 'done',
            owner: 'LS',
            template: 'Rechtliches',
            noIndex: false,
            notes: '',
            showInMainNavigation: false,
        },
        {
            id: 'privacy',
            parentId: 'home',
            title: 'Datenschutz',
            description: 'Informationen zur Verarbeitung personenbezogener Daten.',
            slug: '/datenschutz',
            pageType: 'legal',
            seoImportance: 'low',
            status: 'done',
            owner: 'LS',
            template: 'Rechtliches',
            noIndex: false,
            notes: '',
            showInMainNavigation: false,
        },
    ],
};

export function normalizeDocument(document: SitemapDocument): SitemapDocument {
    const nodes = document.nodes.map((node) => ({
        ...node,
        seoTitle: node.seoTitle ?? '',
        seoDescription: node.seoDescription ?? '',
        redirectFrom: node.redirectFrom ?? '',
        showInMainNavigation: node.showInMainNavigation ?? isMainNavigationDefault(node),
    }));
    return {...document, nodes};
}

export function createProjectDocument(
    templateId: ProjectTemplateId,
    project: SitemapProject,
): SitemapDocument {
    const node = (
        id: string,
        parentId: string | null,
        title: string,
        slug: string,
        pageType: PageType = 'content',
    ): SitemapNode => ({
        id,
        parentId,
        title,
        description: '',
        slug,
        pageType,
        seoImportance: parentId === null ? 'high' : 'medium',
        status: 'planned',
        owner: '',
        template: pageType === 'home' ? 'Homepage' : 'Standard',
        noIndex: false,
        seoTitle: '',
        seoDescription: '',
        notes: '',
        showInMainNavigation: isMainNavigationDefault({parentId, pageType}),
    });
    const root = node('home', null, 'Startseite', '/', 'home');
    let nodes: SitemapNode[] = [root];

    if (templateId === 'company') {
        nodes = [
            root,
            node('services', 'home', 'Leistungen', '/leistungen', 'service'),
            node('service-one', 'services', 'Beratung', '/leistungen/beratung', 'landing'),
            node('service-two', 'services', 'Umsetzung', '/leistungen/umsetzung', 'landing'),
            node('about', 'home', 'Über uns', '/ueber-uns'),
            node('team', 'about', 'Team', '/ueber-uns/team'),
            node('cases', 'home', 'Projekte', '/projekte', 'archive'),
            node('case-one', 'cases', 'Projektbeispiel', '/projekte/projektbeispiel'),
            node('insights', 'home', 'Wissen', '/wissen', 'archive'),
            node('contact', 'home', 'Kontakt', '/kontakt', 'contact'),
            node('privacy', 'home', 'Datenschutz', '/datenschutz', 'legal'),
        ];
    } else if (templateId === 'local-service') {
        nodes = [
            root,
            node('services', 'home', 'Leistungen', '/leistungen', 'service'),
            node('service-one', 'services', 'Hauptleistung', '/leistungen/hauptleistung', 'landing'),
            node('service-two', 'services', 'Weitere Leistung', '/leistungen/weitere-leistung', 'landing'),
            node('areas', 'home', 'Einzugsgebiet', '/einzugsgebiet', 'landing'),
            node('area-one', 'areas', 'Standort', '/einzugsgebiet/standort'),
            node('about', 'home', 'Über uns', '/ueber-uns'),
            node('reviews', 'home', 'Kundenstimmen', '/kundenstimmen'),
            node('contact', 'home', 'Kontakt', '/kontakt', 'contact'),
            node('imprint', 'home', 'Impressum', '/impressum', 'legal'),
        ];
    } else if (templateId === 'shop') {
        nodes = [
            root,
            node('catalog', 'home', 'Shop', '/shop', 'category'),
            node('category-one', 'catalog', 'Kategorie 1', '/shop/kategorie-1', 'category'),
            node('product-one', 'category-one', 'Produkt 1', '/shop/kategorie-1/produkt-1', 'product'),
            node('product-two', 'category-one', 'Produkt 2', '/shop/kategorie-1/produkt-2', 'product'),
            node('category-two', 'catalog', 'Kategorie 2', '/shop/kategorie-2', 'category'),
            node('about', 'home', 'Über uns', '/ueber-uns'),
            node('journal', 'home', 'Magazin', '/magazin', 'archive'),
            node('contact', 'home', 'Kontakt', '/kontakt', 'contact'),
            node('shipping', 'home', 'Versand & Zahlung', '/versand-zahlung', 'content'),
            node('returns', 'home', 'Widerruf', '/widerruf', 'legal'),
            node('privacy', 'home', 'Datenschutz', '/datenschutz', 'legal'),
        ];
    }

    return {
        formatVersion: 1,
        project,
        nodes,
        updatedAt: new Date().toISOString(),
    };
}

const MAX_SEO_DEPTH = 3;

export function validateDocument(document: SitemapDocument): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const slugCounts = new Map<string, number>();
    const seoTitleCounts = new Map<string, number>();
    const nodesById = new Map(document.nodes.map((node) => [node.id, node]));
    const normalizedSeoTitle = (node: SitemapNode) => node.seoTitle?.trim().toLocaleLowerCase() ?? '';

    const hierarchyDepth = (node: SitemapNode): number | null => {
        let depth = 0;
        let parentId = node.parentId;
        const visited = new Set([node.id]);
        while (parentId) {
            if (visited.has(parentId)) return null;
            visited.add(parentId);
            const parent = nodesById.get(parentId);
            if (!parent) return null;
            depth += 1;
            parentId = parent.parentId;
        }
        return depth;
    };

    document.nodes.forEach((node) => {
        slugCounts.set(node.slug, (slugCounts.get(node.slug) ?? 0) + 1);
        const seoTitle = normalizedSeoTitle(node);
        if (seoTitle && !node.noIndex) seoTitleCounts.set(seoTitle, (seoTitleCounts.get(seoTitle) ?? 0) + 1);
    });

    document.nodes.forEach((node) => {
        if (!node.title.trim()) issues.push({nodeId: node.id, level: 'error', messageKey: 'validation.titleMissing'});
        if (!node.slug.startsWith('/')) issues.push({nodeId: node.id, level: 'error', messageKey: 'validation.slugMustStartWithSlash'});
        if (/\s/.test(node.slug)) issues.push({nodeId: node.id, level: 'error', messageKey: 'validation.slugContainsSpaces'});
        if ((slugCounts.get(node.slug) ?? 0) > 1) issues.push({nodeId: node.id, level: 'error', messageKey: 'validation.slugDuplicate'});
        if (node.parentId && !nodesById.has(node.parentId)) issues.push({nodeId: node.id, level: 'error', messageKey: 'validation.parentMissing'});
        if (!node.seoTitle?.trim() && !node.noIndex) issues.push({nodeId: node.id, level: 'warning', messageKey: 'validation.seoTitleMissing'});
        if ((node.seoTitle?.length ?? 0) > 60) issues.push({nodeId: node.id, level: 'warning', messageKey: 'validation.seoTitleTooLong'});
        if (!node.noIndex && (seoTitleCounts.get(normalizedSeoTitle(node)) ?? 0) > 1) issues.push({nodeId: node.id, level: 'warning', messageKey: 'validation.seoTitleDuplicate'});
        if (!node.seoDescription?.trim() && !node.noIndex) issues.push({nodeId: node.id, level: 'warning', messageKey: 'validation.seoDescriptionMissing'});
        if ((node.seoDescription?.length ?? 0) > 160) issues.push({nodeId: node.id, level: 'warning', messageKey: 'validation.seoDescriptionTooLong'});
        if ((hierarchyDepth(node) ?? 0) > MAX_SEO_DEPTH) issues.push({nodeId: node.id, level: 'warning', messageKey: 'validation.hierarchyTooDeep'});
    });
    return issues;
}

export function documentToXml(document: SitemapDocument): string {
    const base = document.project.baseUrl.replace(/\/$/, '');
    const escape = (value: string) => value.replace(/[<>&'"]/g, (char) => ({
        '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;',
    })[char] ?? char);
    const urls = document.nodes.filter((node) => !node.noIndex).map((node) =>
        `  <url>\n    <loc>${escape(`${base}${node.slug === '/' ? '' : node.slug}`)}</loc>\n  </url>`,
    ).join('\n');
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function documentToCsv(document: SitemapDocument, locale: Locale = DEFAULT_LOCALE): string {
    const t = (key: TranslationKey) => translations[locale][key];
    const quote = (value: unknown) => {
        const text = String(value ?? '');
        const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
        return `"${safe.replaceAll('"', '""')}"`;
    };
    const header = [
        t('export.csv.title'), t('export.csv.url'), t('export.csv.pageType'), t('export.csv.status'),
        t('export.csv.seoImportance'), t('export.csv.owner'), t('export.csv.seoTitle'), t('export.csv.seoDescription'),
        t('export.csv.noIndex'), t('export.csv.redirectFrom'),
    ];
    const rows = document.nodes.map((node) => [
        node.title, node.slug, t(`pageType.${node.pageType}`), t(`pageStatus.${node.status}`), t(`seoImportance.${node.seoImportance}`),
        node.owner, node.seoTitle, node.seoDescription, node.noIndex ? t('export.csv.yes') : t('export.csv.no'), node.redirectFrom,
    ]);
    return [header, ...rows].map((row) => row.map(quote).join(';')).join('\n');
}

function groupByParent(nodes: SitemapNode[]): Map<string | null, SitemapNode[]> {
    const childrenByParent = new Map<string | null, SitemapNode[]>();
    nodes.forEach((node) => {
        childrenByParent.set(node.parentId, [...(childrenByParent.get(node.parentId) ?? []), node]);
    });
    return childrenByParent;
}

export function documentToMarkdown(document: SitemapDocument, locale: Locale = DEFAULT_LOCALE): string {
    const t = (key: TranslationKey) => translations[locale][key];
    const childrenByParent = groupByParent(document.nodes);
    const lines: string[] = [`# ${document.project.name}`, ''];
    if (document.project.client) lines.push(`${t('export.client')}: ${document.project.client}`);
    if (document.project.baseUrl) lines.push(`${t('export.baseUrl')}: ${document.project.baseUrl}`);
    lines.push('');

    const walk = (parentId: string | null, depth: number) => {
        for (const node of childrenByParent.get(parentId) ?? []) {
            const indent = '  '.repeat(depth);
            const details = [
                t(`pageType.${node.pageType}`),
                t(`pageStatus.${node.status}`),
                `${t('export.seoLabel')}: ${t(`seoImportance.${node.seoImportance}`)}`,
                node.noIndex ? t('export.noIndexLabel') : null,
            ]
                .filter(Boolean)
                .join(' · ');
            lines.push(`${indent}- [${node.title || t('export.untitled')}](${node.slug || '/'}) — ${details}`);
            walk(node.id, depth + 1);
        }
    };
    walk(null, 0);

    return `${lines.join('\n')}\n`;
}

export function documentToHtml(document: SitemapDocument, locale: Locale = DEFAULT_LOCALE): string {
    const t = (key: TranslationKey) => translations[locale][key];
    const childrenByParent = groupByParent(document.nodes);
    const escape = (value: string) => value.replace(/[<>&'\"]/g, (char) => ({
        '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&#39;', '"': '&quot;',
    })[char] ?? char);

    const renderList = (parentId: string | null): string => {
        const children = childrenByParent.get(parentId) ?? [];
        if (children.length === 0) return '';

        const items = children.map((node) => `
            <li>
                <div class="node">
                    <strong>${escape(node.title || t('export.untitled'))}</strong>
                    <code>${escape(node.slug || '/')}</code>
                    <span class="badge badge-${escape(node.status)}">${escape(t(`pageStatus.${node.status}`))}</span>
                    <span class="badge">${escape(t(`pageType.${node.pageType}`))}</span>
                    <span class="badge badge-seo-${escape(node.seoImportance)}">${escape(t(`seoImportance.${node.seoImportance}`))}</span>
                    ${node.noIndex ? `<span class="badge badge-noindex">${escape(t('export.noIndexLabel'))}</span>` : ''}
                </div>
                ${renderList(node.id)}
            </li>`).join('');
        return `<ul>${items}</ul>`;
    };

    const metaParts = [document.project.client, document.project.baseUrl].filter(Boolean).map(escape);

    return `<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:">
<title>${escape(document.project.name)}${t('export.htmlTitleSuffix')}</title>
<style>
  :root { color-scheme: light; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 0; padding: 40px; background: #f4f6fb; color: #1a2b4a; }
  h1 { margin: 0 0 4px; font-size: 22px; }
  .meta { color: #6b7a99; font-size: 13px; margin-bottom: 28px; }
  ul { list-style: none; margin: 0; padding-left: 22px; border-left: 1px solid #dde3ef; }
  body > ul { padding-left: 0; border-left: none; }
  li { margin: 10px 0; }
  .node { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; background: #fff; border: 1px solid #e2e7f2; border-radius: 8px; padding: 8px 12px; }
  .node strong { font-size: 14px; }
  .node code { font-size: 11px; color: #2368ff; background: #eef2ff; padding: 2px 6px; border-radius: 4px; }
  .badge { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: .03em; padding: 2px 8px; border-radius: 999px; background: #eef1f8; color: #55618a; }
  .badge-done { background: #dcfce7; color: #15803d; }
  .badge-in-progress { background: #fef3c7; color: #b45309; }
  .badge-review { background: #dbeafe; color: #1d4ed8; }
  .badge-planned { background: #f1f2f6; color: #55618a; }
  .badge-seo-high { background: #dbeafe; color: #1d4ed8; }
  .badge-seo-medium { background: #fef3c7; color: #b45309; }
  .badge-seo-low { background: #dcfce7; color: #15803d; }
  .badge-seo-none { background: #f1f2f6; color: #8a8f9c; }
  .badge-noindex { background: #fee2e2; color: #b91c1c; }
</style>
</head>
<body>
  <h1>${escape(document.project.name)}</h1>
  <p class="meta">${metaParts.join(' · ')}</p>
  ${renderList(null)}
</body>
</html>
`;
}

export function slugify(value: string) {
    return value
        .trim()
        .toLocaleLowerCase()
        .replaceAll('ä', 'ae')
        .replaceAll('ö', 'oe')
        .replaceAll('ü', 'ue')
        .replaceAll('ß', 'ss')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export function createChildSlug(parentSlug: string, title: string) {
    const parent = parentSlug === '/' ? '' : parentSlug.replace(/\/+$/, '');
    const segment = slugify(title);
    return segment ? `${parent}/${segment}` : parent || '/';
}

export function createNodeId() {
    return `page-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function layoutNodes(
    nodes: SitemapNode[],
    direction: LayoutDirection,
    measuredSizes: Record<string, CardSize> = {},
): SitemapLayout {
    const cardSizes = Object.fromEntries(nodes.map((node) => [node.id, {
        width: CARD_WIDTH,
        height: measuredSizes[node.id]?.height ?? DEFAULT_CARD_HEIGHT,
    }]));
    const positions: Record<string, Position> = {};
    const children = new Map<string | null, SitemapNode[]>();
    nodes.forEach((node) => children.set(node.parentId, [...(children.get(node.parentId) ?? []), node]));

    if (direction === 'horizontal') {
        const subtreeHeight = new Map<string, number>();
        const measure = (node: SitemapNode): number => {
            const childNodes = children.get(node.id) ?? [];
            const childrenHeight = childNodes.reduce((total, child) => total + measure(child), 0) + Math.max(0, childNodes.length - 1) * ROW_GAP;
            const height = Math.max(cardSizes[node.id].height, childrenHeight);
            subtreeHeight.set(node.id, height);
            return height;
        };
        const place = (node: SitemapNode, depth: number, top: number) => {
            const childNodes = children.get(node.id) ?? [];
            const childrenHeight = childNodes.reduce((total, child) => total + (subtreeHeight.get(child.id) ?? 0), 0) + Math.max(0, childNodes.length - 1) * ROW_GAP;
            positions[node.id] = {
                x: 48 + depth * (CARD_WIDTH + COLUMN_GAP),
                y: top + ((subtreeHeight.get(node.id) ?? 0) - cardSizes[node.id].height) / 2,
            };
            let childTop = top + ((subtreeHeight.get(node.id) ?? 0) - childrenHeight) / 2;
            childNodes.forEach((child) => {
                place(child, depth + 1, childTop);
                childTop += (subtreeHeight.get(child.id) ?? 0) + ROW_GAP;
            });
        };
        let top = 42;
        (children.get(null) ?? []).forEach((root) => {
            const height = measure(root);
            place(root, 0, top);
            top += height + ROW_GAP;
        });
    } else {
        const depthById = new Map<string, number>();
        const setDepth = (node: SitemapNode, depth: number) => {
            depthById.set(node.id, depth);
            (children.get(node.id) ?? []).forEach((child) => setDepth(child, depth + 1));
        };
        (children.get(null) ?? []).forEach((root) => setDepth(root, 0));
        const levelHeights = new Map<number, number>();
        nodes.forEach((node) => {
            const depth = depthById.get(node.id) ?? 0;
            levelHeights.set(depth, Math.max(levelHeights.get(depth) ?? 0, cardSizes[node.id].height));
        });
        const levelY = new Map<number, number>();
        let y = 42;
        [...levelHeights.keys()].sort((a, b) => a - b).forEach((depth) => {
            levelY.set(depth, y);
            y += (levelHeights.get(depth) ?? 0) + VERTICAL_LEVEL_GAP;
        });
        const subtreeWidth = new Map<string, number>();
        const measure = (node: SitemapNode): number => {
            const childNodes = children.get(node.id) ?? [];
            const childrenWidth = childNodes.reduce((total, child) => total + measure(child), 0) + Math.max(0, childNodes.length - 1) * ROW_GAP;
            const width = Math.max(CARD_WIDTH, childrenWidth);
            subtreeWidth.set(node.id, width);
            return width;
        };
        const place = (node: SitemapNode, left: number) => {
            const childNodes = children.get(node.id) ?? [];
            const childrenWidth = childNodes.reduce((total, child) => total + (subtreeWidth.get(child.id) ?? 0), 0) + Math.max(0, childNodes.length - 1) * ROW_GAP;
            positions[node.id] = {
                x: left + ((subtreeWidth.get(node.id) ?? 0) - CARD_WIDTH) / 2,
                y: levelY.get(depthById.get(node.id) ?? 0) ?? 42,
            };
            let childLeft = left + ((subtreeWidth.get(node.id) ?? 0) - childrenWidth) / 2;
            childNodes.forEach((child) => {
                place(child, childLeft);
                childLeft += (subtreeWidth.get(child.id) ?? 0) + ROW_GAP;
            });
        };
        let left = 48;
        (children.get(null) ?? []).forEach((root) => {
            measure(root);
            place(root, left);
            left += (subtreeWidth.get(root.id) ?? 0) + ROW_GAP;
        });
    }

    const positionedNodes = nodes.filter((node) => positions[node.id]);
    const width = Math.max(0, ...positionedNodes.map((node) => positions[node.id].x + cardSizes[node.id].width)) + 80;
    const height = Math.max(0, ...positionedNodes.map((node) => positions[node.id].y + cardSizes[node.id].height)) + 80;
    return {positions, cardSizes, width, height};
}
