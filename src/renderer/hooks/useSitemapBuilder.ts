import {useTheme} from '@/components/theme-provider.tsx';
import {ipc} from '@/gen/ipc';
import {createImportedDocument, type ImportPreviewPage} from '@/lib/import.ts';
import {
    createNodeId,
    createProjectDocument,
    documentToCsv,
    documentToHtml,
    documentToMarkdown,
    documentToXml,
    type LayoutDirection,
    normalizeDocument,
    type SitemapDocument,
    type SitemapNode,
    type SitemapProject,
    type ProjectTemplateId,
    starterDocument,
} from '@/lib/sitemap.ts';
import {
    type DragEvent,
    useCallback,
    useEffect,
    useState,
} from 'react';

type ConfirmationOptions = {
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    destructive?: boolean;
};

type ConfirmationRequest = ConfirmationOptions & {
    resolve: (confirmed: boolean) => void;
};

export function useSitemapBuilder() {
    const {theme, setTheme} = useTheme();
    const [document, setDocument] = useState<SitemapDocument>(
        () => normalizeDocument(starterDocument),
    );
    const [selectedId, setSelectedId] = useState('webdesign');
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [dropTargetId, setDropTargetId] = useState<string | null>(null);
    const [zoom, setZoom] = useState(1);
    const [layoutDirection, setLayoutDirection] = useState<LayoutDirection>(
        'horizontal',
    );
    const [currentPath, setCurrentPath] = useState('');
    const [dirty, setDirty] = useState(false);
    const [message, setMessage] = useState('Bereit');
    const [search, setSearch] = useState('');
    const [past, setPast] = useState<SitemapDocument[]>([]);
    const [future, setFuture] = useState<SitemapDocument[]>([]);
    const [confirmation, setConfirmation] = useState<ConfirmationRequest | null>(null);

    const requestConfirmation = useCallback((options: ConfirmationOptions) => (
        new Promise<boolean>((resolve) => setConfirmation({...options, resolve}))
    ), []);
    const answerConfirmation = useCallback((confirmed: boolean) => {
        setConfirmation(null);
        confirmation?.resolve(confirmed);
    }, [confirmation]);

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
        setDocument((current) => {
            setPast((items) => [...items.slice(-49), current]);
            setFuture([]);
            return {
                ...mutation(current),
                updatedAt: new Date().toISOString(),
            };
        });
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
            localStorage.removeItem('sitemap-builder-autosave');
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
        setPast([]);
        setFuture([]);
        setSelectedId(next.nodes[0]?.id ?? '');
        setCurrentPath(path);
        localStorage.removeItem('sitemap-builder-autosave');
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
            .then(async (result) => {
                if (!result.canceled) {
                    loadSitemap(result.path, result.payload);
                    return;
                }
                const autosave = localStorage.getItem('sitemap-builder-autosave');
                if (autosave && await requestConfirmation({
                    title: 'Sicherung wiederherstellen?',
                    description: 'Eine automatisch gespeicherte Sitemap wurde gefunden. Möchtest du mit diesem Stand weiterarbeiten?',
                    confirmLabel: 'Wiederherstellen',
                })) {
                    const recovered = JSON.parse(autosave) as {document: SitemapDocument; currentPath: string};
                    setDocument(normalizeDocument(recovered.document));
                    setSelectedId(recovered.document.nodes[0]?.id ?? '');
                    setCurrentPath(recovered.currentPath ?? '');
                    setDirty(true);
                    setMessage('Automatische Sicherung wiederhergestellt');
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
    }, [loadSitemap, requestConfirmation]);

    const undo = useCallback(() => {
        setPast((items) => {
            const previous = items.at(-1);
            if (!previous) return items;
            setDocument((current) => {
                setFuture((next) => [current, ...next].slice(0, 50));
                return previous;
            });
            setDirty(true);
            setMessage('Änderung rückgängig gemacht');
            return items.slice(0, -1);
        });
    }, []);

    const redo = useCallback(() => {
        setFuture((items) => {
            const next = items[0];
            if (!next) return items;
            setDocument((current) => {
                setPast((previous) => [...previous.slice(-49), current]);
                return next;
            });
            setDirty(true);
            setMessage('Änderung wiederholt');
            return items.slice(1);
        });
    }, []);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (!event.metaKey && !event.ctrlKey) return;
            const key = event.key.toLowerCase();
            if (key === 's') {
                event.preventDefault();
                void save(event.shiftKey);
            } else if (key === 'z') {
                event.preventDefault();
                if (event.shiftKey) redo(); else undo();
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [redo, save, undo]);

    useEffect(() => {
        if (!dirty) return;
        const timeout = window.setTimeout(() => {
            localStorage.setItem('sitemap-builder-autosave', JSON.stringify({document, currentPath}));
            setMessage('Automatisch gesichert');
        }, 800);
        return () => window.clearTimeout(timeout);
    }, [currentPath, dirty, document]);

    useEffect(() => {
        const warnBeforeClose = (event: BeforeUnloadEvent) => {
            if (!dirty) return;
            event.preventDefault();
            event.returnValue = '';
        };
        window.addEventListener('beforeunload', warnBeforeClose);
        return () => window.removeEventListener('beforeunload', warnBeforeClose);
    }, [dirty]);

    const updateProject = (project: SitemapProject) => {
        mutateDocument((current) => ({
            ...current,
            project,
        }));
    };

    const updateNodeById = <K extends keyof SitemapNode>(
        nodeId: string,
        key: K,
        value: SitemapNode[K],
    ) => {
        mutateDocument((current) => ({
            ...current,
            nodes: current.nodes.map((node) => (
                node.id === nodeId ? {...node, [key]: value} : node
            )),
        }));
    };

    const updateNode = <K extends keyof SitemapNode>(key: K, value: SitemapNode[K]) => {
        updateNodeById(selectedId, key, value);
    };

    const updateNodes = <K extends keyof SitemapNode>(
        nodeIds: string[],
        key: K,
        value: SitemapNode[K],
    ) => {
        const ids = new Set(nodeIds);
        mutateDocument((current) => ({
            ...current,
            nodes: current.nodes.map((node) => ids.has(node.id) ? {...node, [key]: value} : node),
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

    const deleteNode = async (nodeId = selectedId) => {
        const source = document.nodes.find((node) => node.id === nodeId);
        if (!source || source.parentId === null) return;

        const descendantCount = document.nodes.filter((node) => {
            let cursor = node;
            while (cursor.parentId) {
                if (cursor.parentId === source.id) return true;
                cursor = document.nodes.find((item) => item.id === cursor.parentId) ?? {...cursor, parentId: null};
            }
            return false;
        }).length;
        const confirmed = await requestConfirmation({
            title: `„${source.title}“ wirklich löschen?`,
            description: descendantCount
                ? `Dabei ${descendantCount === 1 ? 'wird auch eine Unterseite' : `werden auch ${descendantCount} Unterseiten`} gelöscht. Du kannst diese Änderung anschließend rückgängig machen.`
                : 'Die Seite wird aus der Sitemap entfernt. Du kannst diese Änderung anschließend rückgängig machen.',
            confirmLabel: 'Löschen',
            destructive: true,
        });
        if (!confirmed) return;

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

    const newProject = (
        templateId: ProjectTemplateId,
        project: SitemapProject,
    ) => {
        const nextDocument = createProjectDocument(templateId, project);

        setDocument(normalizeDocument(nextDocument));
        setPast([]);
        setFuture([]);
        setSelectedId(nextDocument.nodes[0]?.id ?? '');
        setCurrentPath('');
        setDirty(true);
        setMessage(`Neue Sitemap: ${project.name}`);
    };

    const importPages = async (
        pages: ImportPreviewPage[],
        projectName: string,
        baseUrl: string,
    ): Promise<boolean> => {
        if (dirty && !await requestConfirmation({
            title: 'Aktuelles Projekt ersetzen?',
            description: 'Der Import ersetzt die aktuelle Sitemap. Ungespeicherte Änderungen gehen verloren.',
            confirmLabel: 'Ersetzen und importieren',
            destructive: true,
        })) return false;

        const nextDocument = createImportedDocument(pages, projectName, baseUrl);
        setDocument(nextDocument);
        setPast([]);
        setFuture([]);
        setSelectedId(nextDocument.nodes[0]?.id ?? '');
        setCurrentPath('');
        setDirty(true);
        localStorage.removeItem('sitemap-builder-autosave');
        setMessage(`${nextDocument.nodes.length} Seiten aus XML importiert`);
        return true;
    };

    const suggestedExportName = () => document.project.name.toLowerCase().replace(/[^a-z0-9äöüß]+/gi, '-').replace(/^-|-$/g, '') || 'sitemap';

    const exportFile = async (format: 'xml' | 'csv' | 'md' | 'html') => {
        const content = {
            xml: documentToXml,
            csv: documentToCsv,
            md: documentToMarkdown,
            html: documentToHtml,
        }[format](document);
        const result = await ipc.app.ExportFile({content, format, suggestedName: suggestedExportName()});
        setMessage(result.canceled ? 'Export abgebrochen' : `Exportiert: ${result.path.split('/').pop()}`);
    };

    const exportPdf = async (base64: string) => {
        const result = await ipc.app.ExportFile({content: base64, format: 'pdf', suggestedName: suggestedExportName()});
        setMessage(result.canceled ? 'Export abgebrochen' : `Exportiert: ${result.path.split('/').pop()}`);
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
        confirmation,
        answerConfirmation,
        canUndo: past.length > 0,
        canRedo: future.length > 0,
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
        undo,
        redo,
        exportFile,
        exportPdf,
        open,
        updateProject,
        updateNode,
        updateNodeById,
        updateNodes,
        addChild,
        duplicateNode,
        moveSelectedSibling,
        moveNodeSibling,
        moveNodeUpLevel,
        deleteNode,
        canMoveTo,
        dropOn,
        newProject,
        importPages,
    };
}
