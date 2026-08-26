export type PageType =
    | 'Startseite'
    | 'Landingpage'
    | 'Leistungsseite'
    | 'Inhaltsseite'
    | 'Kontakt'
    | 'Rechtliches'
    | 'Archiv'
    | 'Extern';

export type LayoutDirection = 'horizontal' | 'vertical';
export type SeoImportance = 'Hoch' | 'Mittel' | 'Niedrig';
export type PageStatus = 'Geplant' | 'In Arbeit' | 'Freigabe' | 'Fertig';

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
    redirectFrom?: string;
};

export type ValidationIssue = {
    nodeId: string;
    level: 'error' | 'warning';
    message: string;
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
    title: string;
    description: string;
    pageCount: number;
};

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
    {
        id: 'empty',
        title: 'Leere Sitemap',
        description: 'Mit einer Startseite beginnen und alles selbst strukturieren.',
        pageCount: 1,
    },
    {
        id: 'company',
        title: 'Unternehmenswebsite',
        description: 'Für Agenturen, B2B-Unternehmen und Dienstleister mit Portfolio.',
        pageCount: 11,
    },
    {
        id: 'local-service',
        title: 'Lokaler Dienstleister',
        description: 'Für regionale Angebote, Leistungen, Team und Kontaktanfragen.',
        pageCount: 10,
    },
    {
        id: 'shop',
        title: 'Onlineshop',
        description: 'Mit Kategorien, Produktseiten sowie den wichtigsten Service-Seiten.',
        pageCount: 12,
    },
];

export type Position = {
    x: number;
    y: number;
};

export type SitemapLayout = {
    positions: Record<string, Position>;
    width: number;
    height: number;
};

export type UpdateNode = <K extends keyof SitemapNode>(
    key: K,
    value: SitemapNode[K],
) => void;

export const CARD_WIDTH = 236;
export const CARD_HEIGHT = 146;
const COLUMN_GAP = 104;
const ROW_GAP = 34;
const VERTICAL_LEVEL_GAP = 96;

export const PAGE_TYPES: PageType[] = [
    'Startseite',
    'Landingpage',
    'Leistungsseite',
    'Inhaltsseite',
    'Kontakt',
    'Rechtliches',
    'Archiv',
    'Extern',
];

export const PAGE_STATUSES: PageStatus[] = [
    'Geplant',
    'In Arbeit',
    'Freigabe',
    'Fertig',
];

export const SEO_IMPORTANCE_LEVELS: SeoImportance[] = [
    'Hoch',
    'Mittel',
    'Niedrig',
];

export const importanceClass: Record<SeoImportance, string> = {
    Hoch: 'badge badge-high',
    Mittel: 'badge badge-medium',
    Niedrig: 'badge badge-low',
};

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
            pageType: 'Startseite',
            seoImportance: 'Hoch',
            status: 'In Arbeit',
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
            pageType: 'Leistungsseite',
            seoImportance: 'Hoch',
            status: 'Geplant',
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
            pageType: 'Inhaltsseite',
            seoImportance: 'Mittel',
            status: 'Freigabe',
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
            pageType: 'Kontakt',
            seoImportance: 'Mittel',
            status: 'Fertig',
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
            pageType: 'Landingpage',
            seoImportance: 'Hoch',
            status: 'In Arbeit',
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
            pageType: 'Landingpage',
            seoImportance: 'Hoch',
            status: 'Geplant',
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
            pageType: 'Landingpage',
            seoImportance: 'Mittel',
            status: 'Geplant',
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
            pageType: 'Landingpage',
            seoImportance: 'Mittel',
            status: 'In Arbeit',
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
            pageType: 'Inhaltsseite',
            seoImportance: 'Mittel',
            status: 'Freigabe',
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
            pageType: 'Inhaltsseite',
            seoImportance: 'Niedrig',
            status: 'Geplant',
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
            pageType: 'Inhaltsseite',
            seoImportance: 'Hoch',
            status: 'In Arbeit',
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
            pageType: 'Inhaltsseite',
            seoImportance: 'Hoch',
            status: 'Geplant',
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
            pageType: 'Inhaltsseite',
            seoImportance: 'Mittel',
            status: 'Fertig',
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
            pageType: 'Inhaltsseite',
            seoImportance: 'Niedrig',
            status: 'Freigabe',
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
            pageType: 'Archiv',
            seoImportance: 'Hoch',
            status: 'In Arbeit',
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
            pageType: 'Inhaltsseite',
            seoImportance: 'Mittel',
            status: 'Freigabe',
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
            pageType: 'Archiv',
            seoImportance: 'Mittel',
            status: 'Geplant',
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
            pageType: 'Inhaltsseite',
            seoImportance: 'Hoch',
            status: 'In Arbeit',
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
            pageType: 'Inhaltsseite',
            seoImportance: 'Mittel',
            status: 'Geplant',
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
            pageType: 'Landingpage',
            seoImportance: 'Hoch',
            status: 'In Arbeit',
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
            pageType: 'Rechtliches',
            seoImportance: 'Niedrig',
            status: 'Fertig',
            owner: 'LS',
            template: 'Rechtliches',
            noIndex: false,
            notes: '',
        },
        {
            id: 'privacy',
            parentId: 'home',
            title: 'Datenschutz',
            description: 'Informationen zur Verarbeitung personenbezogener Daten.',
            slug: '/datenschutz',
            pageType: 'Rechtliches',
            seoImportance: 'Niedrig',
            status: 'Fertig',
            owner: 'LS',
            template: 'Rechtliches',
            noIndex: false,
            notes: '',
        },
    ],
};

export function normalizeDocument(document: SitemapDocument): SitemapDocument {
    return {
        ...document,
        nodes: document.nodes.map((node) => ({
            ...node,
            seoTitle: node.seoTitle ?? '',
            seoDescription: node.seoDescription ?? '',
            redirectFrom: node.redirectFrom ?? '',
        })),
    };
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
        pageType: PageType = 'Inhaltsseite',
    ): SitemapNode => ({
        id,
        parentId,
        title,
        description: '',
        slug,
        pageType,
        seoImportance: parentId === null ? 'Hoch' : 'Mittel',
        status: 'Geplant',
        owner: '',
        template: pageType === 'Startseite' ? 'Homepage' : 'Standard',
        noIndex: false,
        seoTitle: '',
        seoDescription: '',
        notes: '',
    });
    const root = node('home', null, 'Startseite', '/', 'Startseite');
    let nodes: SitemapNode[] = [root];

    if (templateId === 'company') {
        nodes = [
            root,
            node('services', 'home', 'Leistungen', '/leistungen', 'Leistungsseite'),
            node('service-one', 'services', 'Beratung', '/leistungen/beratung', 'Landingpage'),
            node('service-two', 'services', 'Umsetzung', '/leistungen/umsetzung', 'Landingpage'),
            node('about', 'home', 'Über uns', '/ueber-uns'),
            node('team', 'about', 'Team', '/ueber-uns/team'),
            node('cases', 'home', 'Projekte', '/projekte', 'Archiv'),
            node('case-one', 'cases', 'Projektbeispiel', '/projekte/projektbeispiel'),
            node('insights', 'home', 'Wissen', '/wissen', 'Archiv'),
            node('contact', 'home', 'Kontakt', '/kontakt', 'Kontakt'),
            node('privacy', 'home', 'Datenschutz', '/datenschutz', 'Rechtliches'),
        ];
    } else if (templateId === 'local-service') {
        nodes = [
            root,
            node('services', 'home', 'Leistungen', '/leistungen', 'Leistungsseite'),
            node('service-one', 'services', 'Hauptleistung', '/leistungen/hauptleistung', 'Landingpage'),
            node('service-two', 'services', 'Weitere Leistung', '/leistungen/weitere-leistung', 'Landingpage'),
            node('areas', 'home', 'Einzugsgebiet', '/einzugsgebiet', 'Landingpage'),
            node('area-one', 'areas', 'Standort', '/einzugsgebiet/standort'),
            node('about', 'home', 'Über uns', '/ueber-uns'),
            node('reviews', 'home', 'Kundenstimmen', '/kundenstimmen'),
            node('contact', 'home', 'Kontakt', '/kontakt', 'Kontakt'),
            node('imprint', 'home', 'Impressum', '/impressum', 'Rechtliches'),
        ];
    } else if (templateId === 'shop') {
        nodes = [
            root,
            node('catalog', 'home', 'Shop', '/shop', 'Archiv'),
            node('category-one', 'catalog', 'Kategorie 1', '/shop/kategorie-1', 'Archiv'),
            node('product-one', 'category-one', 'Produkt 1', '/shop/kategorie-1/produkt-1', 'Landingpage'),
            node('product-two', 'category-one', 'Produkt 2', '/shop/kategorie-1/produkt-2', 'Landingpage'),
            node('category-two', 'catalog', 'Kategorie 2', '/shop/kategorie-2', 'Archiv'),
            node('about', 'home', 'Über uns', '/ueber-uns'),
            node('journal', 'home', 'Magazin', '/magazin', 'Archiv'),
            node('contact', 'home', 'Kontakt', '/kontakt', 'Kontakt'),
            node('shipping', 'home', 'Versand & Zahlung', '/versand-zahlung', 'Inhaltsseite'),
            node('returns', 'home', 'Widerruf', '/widerruf', 'Rechtliches'),
            node('privacy', 'home', 'Datenschutz', '/datenschutz', 'Rechtliches'),
        ];
    }

    return {
        formatVersion: 1,
        project,
        nodes,
        updatedAt: new Date().toISOString(),
    };
}

export function validateDocument(document: SitemapDocument): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const slugCounts = new Map<string, number>();
    document.nodes.forEach((node) => slugCounts.set(node.slug, (slugCounts.get(node.slug) ?? 0) + 1));

    document.nodes.forEach((node) => {
        if (!node.title.trim()) issues.push({nodeId: node.id, level: 'error', message: 'Seitentitel fehlt'});
        if (!node.slug.startsWith('/')) issues.push({nodeId: node.id, level: 'error', message: 'Slug muss mit / beginnen'});
        if (/\s/.test(node.slug)) issues.push({nodeId: node.id, level: 'error', message: 'Slug enthält Leerzeichen'});
        if ((slugCounts.get(node.slug) ?? 0) > 1) issues.push({nodeId: node.id, level: 'error', message: 'Slug ist doppelt'});
        if (node.parentId && !document.nodes.some((item) => item.id === node.parentId)) {
            issues.push({nodeId: node.id, level: 'error', message: 'Übergeordnete Seite fehlt'});
        }
        if (!node.seoTitle?.trim() && !node.noIndex) issues.push({nodeId: node.id, level: 'warning', message: 'SEO-Titel fehlt'});
        if ((node.seoTitle?.length ?? 0) > 60) issues.push({nodeId: node.id, level: 'warning', message: 'SEO-Titel ist länger als 60 Zeichen'});
        if (!node.seoDescription?.trim() && !node.noIndex) issues.push({nodeId: node.id, level: 'warning', message: 'SEO-Beschreibung fehlt'});
        if ((node.seoDescription?.length ?? 0) > 160) issues.push({nodeId: node.id, level: 'warning', message: 'SEO-Beschreibung ist länger als 160 Zeichen'});
    });
    return issues;
}

export function documentToXml(document: SitemapDocument): string {
    const base = document.project.baseUrl.replace(/\/$/, '');
    const escape = (value: string) => value.replace(/[<>&'\"]/g, (char) => ({
        '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;',
    })[char] ?? char);
    const urls = document.nodes.filter((node) => !node.noIndex).map((node) =>
        `  <url>\n    <loc>${escape(`${base}${node.slug === '/' ? '' : node.slug}`)}</loc>\n  </url>`,
    ).join('\n');
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function documentToCsv(document: SitemapDocument): string {
    const quote = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;
    const header = ['Titel', 'URL', 'Seitentyp', 'Status', 'SEO-Relevanz', 'Verantwortlich', 'SEO-Titel', 'SEO-Beschreibung', 'Noindex', 'Redirect von'];
    const rows = document.nodes.map((node) => [node.title, node.slug, node.pageType, node.status, node.seoImportance, node.owner, node.seoTitle, node.seoDescription, node.noIndex ? 'Ja' : 'Nein', node.redirectFrom]);
    return [header, ...rows].map((row) => row.map(quote).join(';')).join('\n');
}

export function createNodeId() {
    return `page-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function layoutNodes(
    nodes: SitemapNode[],
    direction: LayoutDirection,
): SitemapLayout {
    const positions: Record<string, Position> = {};
    const children = new Map<string | null, SitemapNode[]>();

    nodes.forEach((node) => {
        children.set(node.parentId, [
            ...(children.get(node.parentId) ?? []),
            node,
        ]);
    });

    let nextRow = 0;

    const visit = (node: SitemapNode, depth: number): number => {
        const childNodes = children.get(node.id) ?? [];
        const childRows = childNodes.map((child) => visit(child, depth + 1));
        const row = childRows.length
            ? (childRows[0] + childRows[childRows.length - 1]) / 2
            : nextRow++;

        positions[node.id] = direction === 'horizontal'
            ? {
                x: 48 + depth * (CARD_WIDTH + COLUMN_GAP),
                y: 42 + row * (CARD_HEIGHT + ROW_GAP),
            }
            : {
                x: 48 + row * (CARD_WIDTH + ROW_GAP),
                y: 42 + depth * (CARD_HEIGHT + VERTICAL_LEVEL_GAP),
            };

        return row;
    };

    (children.get(null) ?? []).forEach((root) => visit(root, 0));

    const maxX = Math.max(
        0,
        ...Object.values(positions).map((position) => position.x),
    );
    const maxY = Math.max(
        0,
        ...Object.values(positions).map((position) => position.y),
    );

    return {
        positions,
        width: maxX + CARD_WIDTH + 80,
        height: maxY + CARD_HEIGHT + 80,
    };
}
