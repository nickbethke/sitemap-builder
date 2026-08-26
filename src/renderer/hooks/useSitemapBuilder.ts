import {useTheme} from '@/components/theme-provider.tsx';
import {ipc} from '@/gen/ipc';
import {
    createNodeId,
    type LayoutDirection,
    normalizeDocument,
    type SitemapDocument,
    type SitemapNode,
    type SitemapProject,
    starterDocument,
} from '@/lib/sitemap.ts';
import {
    type DragEvent,
    useCallback,
    useEffect,
    useState,
} from 'react';

export function useSitemapBuilder() {
    const {theme, setTheme} = useTheme();
    const [document, setDocument] = useState<SitemapDocument>(
        () => normalizeDocument(starterDocument),
    );
    const [selectedId, setSelectedId] = useState('webdesign');
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [dropTargetId, setDropTargetId] = useState<string | null>(null);
    const [zoom, setZoom] = useState(0.82);
    const [layoutDirection, setLayoutDirection] = useState<LayoutDirection>(
        'horizontal',
    );
    const [currentPath, setCurrentPath] = useState('');
    const [dirty, setDirty] = useState(false);
    const [message, setMessage] = useState('Bereit');
    const [search, setSearch] = useState('');

    const selectedNode = document.nodes.find(
        (node) => node.id === selectedId,
    ) ?? null;
    const selectedSiblings = selectedNode
        ? document.nodes.filter(
            (node) => node.parentId === selectedNode.parentId,
        )
        : [];
    const selectedSiblingIndex = selectedNode
        ? selectedSiblings.findIndex((node) => node.id === selectedNode.id)
        : -1;

    const mutateDocument = useCallback((
        mutation: (current: SitemapDocument) => SitemapDocument,
    ) => {
        setDocument((current) => ({
            ...mutation(current),
            updatedAt: new Date().toISOString(),
        }));
        setDirty(true);
    }, []);

    const toggleTheme = async () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        await ipc.app.SetTheme({theme: newTheme});
        setTheme(newTheme);
    };

    const save = useCallback(async (saveAs = false) => {
        try {
            setMessage('Speichere …');
            const result = await ipc.app.SaveSitemap({
                payload: JSON.stringify(document),
                currentPath: saveAs ? '' : currentPath,
            });

            if (result.canceled) {
                setMessage('Speichern abgebrochen');
                return;
            }

            setCurrentPath(result.path);
            setDirty(false);
            setMessage(`Gespeichert: ${result.path.split('/').pop()}`);
        } catch (error) {
            setMessage(
                error instanceof Error
                    ? error.message
                    : 'Speichern fehlgeschlagen',
            );
        }
    }, [currentPath, document]);

    const loadSitemap = useCallback((path: string, payload: string) => {
        const next = JSON.parse(payload) as SitemapDocument;
        if (next.formatVersion !== 1 || !Array.isArray(next.nodes)) {
            throw new Error('Ungültige Sitemap-Struktur.');
        }

        setDocument(normalizeDocument(next));
        setSelectedId(next.nodes[0]?.id ?? '');
        setCurrentPath(path);
        setDirty(false);
        setMessage(`Geöffnet: ${path.split('/').pop()}`);
    }, []);

    const open = async () => {
        try {
            setMessage('Öffne …');
            const result = await ipc.app.OpenSitemap({});
            if (result.canceled) {
                setMessage('Öffnen abgebrochen');
                return;
            }

            loadSitemap(result.path, result.payload);
        } catch (error) {
            setMessage(
                error instanceof Error
                    ? error.message
                    : 'Öffnen fehlgeschlagen',
            );
        }
    };

    useEffect(() => {
        const subscription = ipc.openFile.WatchOpenedSitemaps({}).subscribe({
            next: ({path, payload}) => {
                try {
                    loadSitemap(path, payload);
                } catch (error) {
                    setMessage(
                        error instanceof Error
                            ? error.message
                            : 'Öffnen fehlgeschlagen',
                    );
                }
            },
            error: () => setMessage('Datei-Öffnung fehlgeschlagen'),
        });

        void ipc.app.GetStartupSitemap({})
            .then((result) => {
                if (!result.canceled) {
                    loadSitemap(result.path, result.payload);
                }
            })
            .catch((error: unknown) => {
                setMessage(
                    error instanceof Error
                        ? error.message
                        : 'Öffnen fehlgeschlagen',
                );
            });

        return () => subscription.unsubscribe();
    }, [loadSitemap]);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (
                (event.metaKey || event.ctrlKey)
                && event.key.toLowerCase() === 's'
            ) {
                event.preventDefault();
                void save(event.shiftKey);
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [save]);

    const updateProject = (project: SitemapProject) => {
        mutateDocument((current) => ({
            ...current,
            project,
        }));
    };

    const updateNode = <K extends keyof SitemapNode>(
        key: K,
        value: SitemapNode[K],
    ) => {
        mutateDocument((current) => ({
            ...current,
            nodes: current.nodes.map((node) => (
                node.id === selectedId
                    ? {...node, [key]: value}
                    : node
            )),
        }));
    };

    const addChild = (parentId: string | null = selectedId || null) => {
        const id = createNodeId();
        const parent = document.nodes.find((node) => node.id === parentId);
        const slugBase = parent?.slug === '/'
            ? ''
            : (parent?.slug ?? '');
        const node: SitemapNode = {
            id,
            parentId,
            title: 'Neue Seite',
            description: '',
            slug: `${slugBase}/neue-seite`,
            pageType: 'Inhaltsseite',
            seoImportance: 'Mittel',
            status: 'Geplant',
            owner: '',
            template: 'Standard',
            noIndex: false,
            seoTitle: '',
            seoDescription: '',
            notes: '',
        };

        mutateDocument((current) => ({
            ...current,
            nodes: [...current.nodes, node],
        }));
        setSelectedId(id);
    };

    const duplicateNode = (nodeId = selectedId) => {
        const source = document.nodes.find((node) => node.id === nodeId);
        if (!source) return;

        const id = createNodeId();
        const duplicate: SitemapNode = {
            ...source,
            id,
            title: `${source.title} Kopie`,
            slug: `${source.slug}-kopie`,
        };
        const sourceIndex = document.nodes.findIndex(
            (node) => node.id === source.id,
        );

        mutateDocument((current) => ({
            ...current,
            nodes: [
                ...current.nodes.slice(0, sourceIndex + 1),
                duplicate,
                ...current.nodes.slice(sourceIndex + 1),
            ],
        }));
        setSelectedId(id);
    };

    const moveNodeSibling = (nodeId: string, direction: -1 | 1) => {
        const source = document.nodes.find((node) => node.id === nodeId);
        if (!source) return;

        const siblings = document.nodes.filter(
            (node) => node.parentId === source.parentId,
        );
        const sourceSiblingIndex = siblings.findIndex(
            (node) => node.id === source.id,
        );
        const target = siblings[sourceSiblingIndex + direction];
        if (!target) return;

        const sourceIndex = document.nodes.findIndex(
            (node) => node.id === source.id,
        );
        const targetIndex = document.nodes.findIndex(
            (node) => node.id === target.id,
        );

        mutateDocument((current) => {
            const nodes = [...current.nodes];
            [nodes[sourceIndex], nodes[targetIndex]] = [
                nodes[targetIndex],
                nodes[sourceIndex],
            ];
            return {...current, nodes};
        });
        setSelectedId(source.id);
        setMessage(
            direction === -1
                ? 'Seite nach oben sortiert'
                : 'Seite nach unten sortiert',
        );
    };

    const moveSelectedSibling = (direction: -1 | 1) => {
        if (selectedNode) moveNodeSibling(selectedNode.id, direction);
    };

    const moveNodeUpLevel = (nodeId: string) => {
        const source = document.nodes.find((node) => node.id === nodeId);
        const parent = document.nodes.find(
            (node) => node.id === source?.parentId,
        );
        if (!source || !parent) return;

        mutateDocument((current) => ({
            ...current,
            nodes: current.nodes.map((node) => (
                node.id === source.id
                    ? {...node, parentId: parent.parentId}
                    : node
            )),
        }));
        setSelectedId(source.id);
        setMessage('Seite eine Ebene hoch verschoben');
    };

    const deleteNode = (nodeId = selectedId) => {
        const source = document.nodes.find((node) => node.id === nodeId);
        if (!source || source.parentId === null) return;

        const ids = new Set([source.id]);
        let changed = true;
        while (changed) {
            changed = false;
            document.nodes.forEach((node) => {
                if (
                    node.parentId
                    && ids.has(node.parentId)
                    && !ids.has(node.id)
                ) {
                    ids.add(node.id);
                    changed = true;
                }
            });
        }

        mutateDocument((current) => ({
            ...current,
            nodes: current.nodes.filter((node) => !ids.has(node.id)),
        }));
        setSelectedId(
            source.parentId ?? document.nodes[0]?.id ?? '',
        );
    };

    const canMoveTo = (nodeId: string, parentId: string) => {
        if (nodeId === parentId) return false;

        let cursor = document.nodes.find((node) => node.id === parentId);
        while (cursor) {
            if (cursor.parentId === nodeId) return false;
            cursor = document.nodes.find(
                (node) => node.id === cursor?.parentId,
            );
        }

        return true;
    };

    const dropOn = (
        event: DragEvent<HTMLElement>,
        parentId: string,
    ) => {
        event.preventDefault();

        if (draggedId && canMoveTo(draggedId, parentId)) {
            mutateDocument((current) => ({
                ...current,
                nodes: current.nodes.map((node) => (
                    node.id === draggedId
                        ? {...node, parentId}
                        : node
                )),
            }));
            setSelectedId(draggedId);
            setMessage('Seite neu verknüpft');
        }

        setDraggedId(null);
        setDropTargetId(null);
    };

    const newProject = () => {
        const root: SitemapNode = {
            ...starterDocument.nodes[0],
            id: createNodeId(),
            title: 'Startseite',
            parentId: null,
        };
        const nextDocument: SitemapDocument = {
            ...starterDocument,
            project: {
                name: 'Neue Sitemap',
                baseUrl: 'https://',
                client: '',
            },
            nodes: [root],
        };

        setDocument(normalizeDocument(nextDocument));
        setSelectedId(root.id);
        setCurrentPath('');
        setDirty(true);
        setMessage('Neue Sitemap');
    };

    return {
        theme,
        document,
        selectedId,
        selectedNode,
        draggedId,
        dropTargetId,
        zoom,
        layoutDirection,
        currentPath,
        dirty,
        message,
        search,
        canMoveUp: selectedSiblingIndex > 0,
        canMoveDown: selectedSiblingIndex >= 0
            && selectedSiblingIndex < selectedSiblings.length - 1,
        setSelectedId,
        setDraggedId,
        setDropTargetId,
        setZoom,
        setLayoutDirection,
        setSearch,
        toggleTheme,
        save,
        open,
        updateProject,
        updateNode,
        addChild,
        duplicateNode,
        moveSelectedSibling,
        moveNodeSibling,
        moveNodeUpLevel,
        deleteNode,
        canMoveTo,
        dropOn,
        newProject,
    };
}
