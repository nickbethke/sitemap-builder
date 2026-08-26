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
    ],
};

export function normalizeDocument(document: SitemapDocument): SitemapDocument {
    return {
        ...document,
        nodes: document.nodes.map((node) => ({
            ...node,
            seoTitle: node.seoTitle ?? '',
            seoDescription: node.seoDescription ?? '',
        })),
    };
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
