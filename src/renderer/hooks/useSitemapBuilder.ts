import {useTheme} from '@/components/theme-provider.tsx';
import {ipc} from '@/gen/ipc';
import {useTranslation} from '@/lib/i18n/context.tsx';
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
    const {locale, t} = useTranslation();
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
    const [message, setMessageRaw] = useState(() => t('status.ready'));
    const [messageIsDefault, setMessageIsDefault] = useState(true);
    const setMessage = useCallback((text: string) => {
        setMessageRaw(text);
        setMessageIsDefault(false);
    }, []);
    useEffect(() => {
        if (messageIsDefault) setMessageRaw(t('status.ready'));
    }, [locale, messageIsDefault, t]);
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
            setMessage(t('status.saving'));
            const result = await ipc.app.SaveSitemap({
                payload: JSON.stringify(document),
                currentPath: saveAs ? '' : currentPath,
            });

            if (result.canceled) {
                setMessage(t('status.saveCancelled'));
                return;
            }

            setCurrentPath(result.path);
            localStorage.removeItem('sitemap-builder-autosave');
            setDirty(false);
            setMessage(t('status.saved', {name: result.path.split('/').pop() ?? ''}));
        } catch {
            setMessage(t('status.saveFailed'));
        }
    }, [currentPath, document, t]);

    const loadSitemap = useCallback((path: string, payload: string) => {
        const next = JSON.parse(payload) as SitemapDocument;
        if (next.formatVersion !== 1 || !Array.isArray(next.nodes)) {
            throw new Error('Invalid sitemap structure');
        }

        setDocument(normalizeDocument(next));
        setPast([]);
        setFuture([]);
        setSelectedId(next.nodes[0]?.id ?? '');
        setCurrentPath(path);
        localStorage.removeItem('sitemap-builder-autosave');
        setDirty(false);
        setMessage(t('status.opened', {name: path.split('/').pop() ?? ''}));
    }, [t]);

    const open = async () => {
        try {
            setMessage(t('status.opening'));
            const result = await ipc.app.OpenSitemap({});
            if (result.canceled) {
                setMessage(t('status.openCancelled'));
                return;
            }

            loadSitemap(result.path, result.payload);
        } catch {
            setMessage(t('status.openFailed'));
        }
    };

    useEffect(() => {
        const subscription = ipc.openFile.WatchOpenedSitemaps({}).subscribe({
            next: ({path, payload}) => {
                try {
                    loadSitemap(path, payload);
                } catch {
                    setMessage(t('status.openFailed'));
                }
            },
            error: () => setMessage(t('status.fileOpenFailed')),
        });

        void ipc.app.GetStartupSitemap({})
            .then(async (result) => {
                if (!result.canceled) {
                    loadSitemap(result.path, result.payload);
                    return;
                }
                const autosave = localStorage.getItem('sitemap-builder-autosave');
                if (autosave && await requestConfirmation({
                    title: t('confirm.restoreBackup.title'),
                    description: t('confirm.restoreBackup.description'),
                    confirmLabel: t('confirm.restoreBackup.confirm'),
                })) {
                    const recovered = JSON.parse(autosave) as {document: SitemapDocument; currentPath: string};
                    setDocument(normalizeDocument(recovered.document));
                    setSelectedId(recovered.document.nodes[0]?.id ?? '');
                    setCurrentPath(recovered.currentPath ?? '');
                    setDirty(true);
                    setMessage(t('status.backupRestored'));
                }
            })
            .catch(() => {
                setMessage(t('status.openFailed'));
            });

        return () => subscription.unsubscribe();
    }, [loadSitemap, requestConfirmation, t]);

    const undo = useCallback(() => {
        setPast((items) => {
            const previous = items.at(-1);
            if (!previous) return items;
            setDocument((current) => {
                setFuture((next) => [current, ...next].slice(0, 50));
                return previous;
            });
            setDirty(true);
            setMessage(t('status.undone'));
            return items.slice(0, -1);
        });
    }, [t]);

    const redo = useCallback(() => {
        setFuture((items) => {
            const next = items[0];
            if (!next) return items;
            setDocument((current) => {
                setPast((previous) => [...previous.slice(-49), current]);
                return next;
            });
            setDirty(true);
            setMessage(t('status.redone'));
            return items.slice(1);
        });
    }, [t]);

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
            setMessage(t('status.autosaved'));
        }, 800);
        return () => window.clearTimeout(timeout);
    }, [currentPath, dirty, document, t]);

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
            title: t('node.defaultTitle'),
            description: '',
            slug: `${slugBase}/${t('node.defaultSlug')}`,
            pageType: 'content',
            seoImportance: 'medium',
            status: 'planned',
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
            title: `${source.title}${t('node.copyTitleSuffix')}`,
            slug: `${source.slug}${t('node.copySlugSuffix')}`,
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
                ? t('status.movedUp')
                : t('status.movedDown'),
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
        setMessage(t('status.movedUpLevel'));
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
            title: t('confirm.deleteNode.title', {title: source.title}),
            description: descendantCount
                ? t(
                    descendantCount === 1
                        ? 'confirm.deleteNode.descriptionWithChildOne'
                        : 'confirm.deleteNode.descriptionWithChildMany',
                    {count: descendantCount},
                )
                : t('confirm.deleteNode.descriptionSimple'),
            confirmLabel: t('common.delete'),
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

    const deleteNodes = async (nodeIds: string[]) => {
        const selectedIds = new Set(nodeIds);
        const roots = document.nodes.filter((node) => selectedIds.has(node.id) && node.parentId === null);
        const seedIds = new Set(document.nodes
            .filter((node) => selectedIds.has(node.id) && node.parentId !== null)
            .map((node) => node.id));
        if (seedIds.size === 0) {
            setMessage(roots.length ? t('status.homeCannotBeDeleted') : t('status.noPagesSelected'));
            return false;
        }

        const ids = new Set(seedIds);
        let changed = true;
        while (changed) {
            changed = false;
            document.nodes.forEach((node) => {
                if (node.parentId && ids.has(node.parentId) && !ids.has(node.id)) {
                    ids.add(node.id);
                    changed = true;
                }
            });
        }

        const selectedCount = seedIds.size;
        const descendantCount = ids.size - selectedCount;
        const ignoredRoots = roots.length
            ? t(roots.length === 1 ? 'confirm.deleteNodes.homeKeptOne' : 'confirm.deleteNodes.homeKeptMany')
            : '';
        const selectedPart = t(
            selectedCount === 1 ? 'confirm.deleteNodes.selectedOne' : 'confirm.deleteNodes.selectedMany',
            {count: selectedCount},
        );
        const childrenPart = descendantCount
            ? t(
                descendantCount === 1 ? 'confirm.deleteNodes.childrenOne' : 'confirm.deleteNodes.childrenMany',
                {count: descendantCount},
            )
            : '';
        const confirmed = await requestConfirmation({
            title: t(ids.size === 1 ? 'confirm.deleteNodes.titleOne' : 'confirm.deleteNodes.titleMany', {count: ids.size}),
            description: `${selectedPart}${childrenPart}${t('confirm.deleteNodes.footer')}${ignoredRoots}`,
            confirmLabel: t(ids.size === 1 ? 'confirm.deleteNodes.confirmOne' : 'confirm.deleteNodes.confirmMany', {count: ids.size}),
            destructive: true,
        });
        if (!confirmed) return false;

        mutateDocument((current) => ({
            ...current,
            nodes: current.nodes.filter((node) => !ids.has(node.id)),
        }));
        if (ids.has(selectedId)) setSelectedId(document.nodes.find((node) => node.parentId === null)?.id ?? '');
        setMessage(t(ids.size === 1 ? 'status.pageDeletedOne' : 'status.pageDeletedMany', {count: ids.size}));
        return true;
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
            setMessage(t('status.relinked'));
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
        setMessage(t('status.newSitemap', {name: project.name}));
    };

    const importPages = async (
        pages: ImportPreviewPage[],
        projectName: string,
        baseUrl: string,
    ): Promise<boolean> => {
        if (dirty && !await requestConfirmation({
            title: t('confirm.replaceProject.title'),
            description: t('confirm.replaceProject.description'),
            confirmLabel: t('confirm.replaceProject.confirm'),
            destructive: true,
        })) return false;

        const nextDocument = createImportedDocument(pages, projectName, baseUrl, locale);
        setDocument(nextDocument);
        setPast([]);
        setFuture([]);
        setSelectedId(nextDocument.nodes[0]?.id ?? '');
        setCurrentPath('');
        setDirty(true);
        localStorage.removeItem('sitemap-builder-autosave');
        setMessage(t('status.importedPages', {count: nextDocument.nodes.length}));
        return true;
    };

    const suggestedExportName = () => document.project.name.toLowerCase().replace(/[^a-z0-9äöüß]+/gi, '-').replace(/^-|-$/g, '') || 'sitemap';

    const exportFile = async (format: 'xml' | 'csv' | 'md' | 'html') => {
        const content = {
            xml: () => documentToXml(document),
            csv: () => documentToCsv(document, locale),
            md: () => documentToMarkdown(document, locale),
            html: () => documentToHtml(document, locale),
        }[format]();
        const result = await ipc.app.ExportFile({content, format, suggestedName: suggestedExportName()});
        setMessage(result.canceled ? t('status.exportCancelled') : t('status.exported', {name: result.path.split('/').pop() ?? ''}));
    };

    const exportPdf = async (base64: string) => {
        const result = await ipc.app.ExportFile({content: base64, format: 'pdf', suggestedName: suggestedExportName()});
        setMessage(result.canceled ? t('status.exportCancelled') : t('status.exported', {name: result.path.split('/').pop() ?? ''}));
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
        deleteNodes,
        canMoveTo,
        dropOn,
        newProject,
        importPages,
    };
}
