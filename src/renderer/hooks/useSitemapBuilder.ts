import {useTheme} from '@/components/theme-provider.tsx';
import {useSynchronousState} from './useSynchronousState.ts';
import {canDuplicateNode, canPromoteNode, prepareDocumentMutation} from '@/lib/documentOperations.ts';
import {ipc} from '@/gen/ipc';
import {useTranslation} from '@/lib/i18n/context.tsx';
import {createImportedDocument, type ImportPreviewPage} from '@/lib/import.ts';
import {validateSitemapDocument} from '../../shared/sitemap-schema.ts';
import {clearAutosave, loadAutosave, saveAutosave} from '@/lib/autosave.ts';
import {applyDocumentChange, createDocumentChange, type DocumentChange} from '@/lib/documentHistory.ts';
import {
    createChildSlug,
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
    useRef,
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
    const [document, setDocument, documentRef] = useSynchronousState<SitemapDocument>(
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
    const dirtyRef = useRef(false);
    const revisionRef = useRef(0);
    const savingRef = useRef(false);
    const startupCheckedRef = useRef(false);
    const autosaveQueueRef = useRef<Promise<void>>(Promise.resolve());
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
    const [past, setPast] = useSynchronousState<DocumentChange[]>([]);
    const [future, setFuture] = useSynchronousState<DocumentChange[]>([]);
    const [confirmation, setConfirmation] = useState<ConfirmationRequest | null>(null);

    const requestConfirmation = useCallback((options: ConfirmationOptions) => (
        new Promise<boolean>((resolve) => setConfirmation({...options, resolve}))
    ), []);
    const answerConfirmation = useCallback((confirmed: boolean) => {
        setConfirmation(null);
        confirmation?.resolve(confirmed);
    }, [confirmation]);
    const confirmReplacement = useCallback(async () => (
        !dirtyRef.current || requestConfirmation({
            title: t('confirm.replaceProject.title'),
            description: t('confirm.replaceProject.description'),
            confirmLabel: t('confirm.replaceProject.confirm'),
            destructive: true,
        })
    ), [requestConfirmation, t]);
    const enqueueAutosave = useCallback((operation: () => Promise<void>) => {
        const result = autosaveQueueRef.current.then(operation, operation);
        autosaveQueueRef.current = result.catch(() => undefined);
        return result;
    }, []);

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
        try {
            const current = documentRef.current;
            const next = prepareDocumentMutation(current, mutation);
            setPast((items) => [...items.slice(-49), createDocumentChange(current, next)]);
            setFuture([]);
            setDocument(next);
            revisionRef.current += 1;
            dirtyRef.current = true;
            setDirty(true);
            return true;
        } catch (error) {
            setMessage(`${t('status.changeFailed')}: ${error instanceof Error ? error.message : String(error)}`);
            return false;
        }
    }, [documentRef, setDocument, setFuture, setMessage, setPast, t]);

    const toggleTheme = async () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        await ipc.app.SetTheme({theme: newTheme});
        setTheme(newTheme);
    };

    const save = useCallback(async (saveAs = false) => {
        if (savingRef.current) return;
        savingRef.current = true;
        const savedRevision = revisionRef.current;
        try {
            setMessage(t('status.saving'));
            const result = await ipc.app.SaveSitemap({
                payload: JSON.stringify(document),
                saveAs: saveAs || !currentPath,
            });

            if (result.canceled) {
                setMessage(t('status.saveCancelled'));
                return;
            }

            setCurrentPath(result.path);
            if (revisionRef.current === savedRevision) {
                await enqueueAutosave(clearAutosave);
                if (revisionRef.current === savedRevision) {
                    dirtyRef.current = false;
                    setDirty(false);
                }
            }
            setMessage(t('status.saved', {name: result.path.split(/[\\/]/).pop() ?? ''}));
        } catch (error) {
            setMessage(`${t('status.saveFailed')}: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            savingRef.current = false;
        }
    }, [currentPath, document, enqueueAutosave, setMessage, t]);

    const loadSitemap = useCallback((path: string, payload: string) => {
        const next = JSON.parse(payload) as SitemapDocument;
        validateSitemapDocument(next);

        setDocument(normalizeDocument(next));
        setPast([]);
        setFuture([]);
        setSelectedId(next.nodes[0]?.id ?? '');
        setCurrentPath(path);
        void enqueueAutosave(clearAutosave);
        revisionRef.current += 1;
        dirtyRef.current = false;
        setDirty(false);
        setMessage(t('status.opened', {name: path.split(/[\\/]/).pop() ?? ''}));
    }, [enqueueAutosave, setDocument, setFuture, setMessage, setPast, t]);

    const open = async () => {
        try {
            if (!await confirmReplacement()) return;
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
                void (async () => {
                    const accepted = await confirmReplacement();
                    await ipc.app.ResolveOpenedSitemap({path, accepted});
                    if (accepted) loadSitemap(path, payload);
                })().catch(() => setMessage(t('status.openFailed')));
            },
            error: () => setMessage(t('status.fileOpenFailed')),
        });
        return () => subscription.unsubscribe();
    }, [confirmReplacement, loadSitemap, setMessage, t]);

    useEffect(() => {
        if (startupCheckedRef.current) return;
        startupCheckedRef.current = true;
        void ipc.app.GetStartupSitemap({})
            .then(async (result) => {
                if (!result.canceled) {
                    loadSitemap(result.path, result.payload);
                    return;
                }
                const autosave = await loadAutosave();
                if (autosave && await requestConfirmation({
                    title: t('confirm.restoreBackup.title'),
                    description: t('confirm.restoreBackup.description'),
                    confirmLabel: t('confirm.restoreBackup.confirm'),
                })) {
                    validateSitemapDocument(autosave.document);
                    setDocument(normalizeDocument(autosave.document));
                    setSelectedId(autosave.document.nodes[0]?.id ?? '');
                    // Main process intentionally does not trust a renderer-persisted path.
                    setCurrentPath('');
                    revisionRef.current += 1;
                    dirtyRef.current = true;
                    setDirty(true);
                    setMessage(t('status.backupRestored'));
                }
            })
            .catch(() => setMessage(t('status.openFailed')));
    }, [loadSitemap, requestConfirmation, setDocument, setMessage, t]);

    const undo = useCallback(() => {
        setPast((items) => {
            const change = items.at(-1);
            if (!change) return items;
            setDocument((current) => applyDocumentChange(current, change, 'undo'));
            setFuture((next) => [change, ...next].slice(0, 50));
            revisionRef.current += 1;
            dirtyRef.current = true;
            setDirty(true);
            setMessage(t('status.undone'));
            return items.slice(0, -1);
        });
    }, [setDocument, setFuture, setMessage, setPast, t]);

    const redo = useCallback(() => {
        setFuture((items) => {
            const change = items[0];
            if (!change) return items;
            setDocument((current) => applyDocumentChange(current, change, 'redo'));
            setPast((previous) => [...previous.slice(-49), change]);
            revisionRef.current += 1;
            dirtyRef.current = true;
            setDirty(true);
            setMessage(t('status.redone'));
            return items.slice(1);
        });
    }, [setDocument, setFuture, setMessage, setPast, t]);

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
        const revision = revisionRef.current;
        const timeout = window.setTimeout(() => {
            void enqueueAutosave(() => saveAutosave(document))
                .then(() => {
                    if (dirtyRef.current && revisionRef.current === revision) setMessage(t('status.autosaved'));
                })
                .catch(() => setMessage(t('status.autosaveFailed')));
        }, 800);
        return () => window.clearTimeout(timeout);
    }, [dirty, document, enqueueAutosave, setMessage, t]);

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

    const addChild = (title: string, parentId: string | null = selectedId || null) => {
        const parent = document.nodes.find((node) => node.id === parentId);
        const node: SitemapNode = {
            id: createNodeId(),
            parentId,
            title,
            description: '',
            slug: createChildSlug(parent?.slug ?? '/', title),
            pageType: 'content',
            seoImportance: 'medium',
            status: 'planned',
            owner: '',
            template: 'Standard',
            noIndex: false,
            seoTitle: '',
            seoDescription: '',
            notes: '',
            showInMainNavigation: true,
        };

        if (mutateDocument((current) => ({
            ...current,
            nodes: [...current.nodes, node],
        }))) setSelectedId(node.id);
    };

    const duplicateNode = (nodeId = selectedId) => {
        const source = document.nodes.find((node) => node.id === nodeId);
        if (!source || !canDuplicateNode(source)) return;

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

        if (mutateDocument((current) => ({
            ...current,
            nodes: [
                ...current.nodes.slice(0, sourceIndex + 1),
                duplicate,
                ...current.nodes.slice(sourceIndex + 1),
            ],
        }))) setSelectedId(id);
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
        if (!source || !parent || !canPromoteNode(document, source)) return;

        if (!mutateDocument((current) => ({
            ...current,
            nodes: current.nodes.map((node) => (
                node.id === source.id
                    ? {...node, parentId: parent.parentId}
                    : node
            )),
        }))) return;
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
        const source = document.nodes.find(node => node.id === nodeId);
        if (!source || source.parentId === null || nodeId === parentId) return false;

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
            if (mutateDocument((current) => ({
                ...current,
                nodes: current.nodes.map((node) => (
                    node.id === draggedId
                        ? {...node, parentId}
                        : node
                )),
            }))) {
                setSelectedId(draggedId);
                setMessage(t('status.relinked'));
            }
        }

        setDraggedId(null);
        setDropTargetId(null);
    };

    const newProject = async (
        templateId: ProjectTemplateId,
        project: SitemapProject,
    ): Promise<boolean> => {
        const nextDocument = createProjectDocument(templateId, project, locale);
        validateSitemapDocument(nextDocument);
        if (!await confirmReplacement()) return false;

        setDocument(normalizeDocument(nextDocument));
        setPast([]);
        setFuture([]);
        setSelectedId(nextDocument.nodes[0]?.id ?? '');
        setCurrentPath('');
        revisionRef.current += 1;
        dirtyRef.current = true;
        setDirty(true);
        setMessage(t('status.newSitemap', {name: project.name}));
        return true;
    };

    const importPages = async (
        pages: ImportPreviewPage[],
        projectName: string,
        baseUrl: string,
    ): Promise<boolean> => {
        const nextDocument = createImportedDocument(pages, projectName, baseUrl, locale);
        validateSitemapDocument(nextDocument);
        if (!await confirmReplacement()) return false;
        setDocument(normalizeDocument(nextDocument));
        setPast([]);
        setFuture([]);
        setSelectedId(nextDocument.nodes[0]?.id ?? '');
        setCurrentPath('');
        revisionRef.current += 1;
        dirtyRef.current = true;
        setDirty(true);
        void enqueueAutosave(clearAutosave);
        setMessage(t('status.importedPages', {count: nextDocument.nodes.length}));
        return true;
    };

    const suggestedExportName = () => document.project.name.toLowerCase().replace(/[^a-z0-9äöüß]+/gi, '-').replace(/^-|-$/g, '') || 'sitemap';

    const exportFile = async (format: 'xml' | 'csv' | 'md' | 'html') => {
        try {
            const content = {
                xml: () => documentToXml(document),
                csv: () => documentToCsv(document, locale),
                md: () => documentToMarkdown(document, locale),
                html: () => documentToHtml(document, locale),
            }[format]();
            const result = await ipc.app.ExportFile({content, format, suggestedName: suggestedExportName()});
            setMessage(result.canceled ? t('status.exportCancelled') : t('status.exported', {name: result.path.split(/[\\/]/).pop() ?? ''}));
        } catch (error) {
            setMessage(`${t('status.exportFailed')}: ${error instanceof Error ? error.message : String(error)}`);
        }
    };

    const exportPdf = async (base64: string) => {
        try {
            const result = await ipc.app.ExportFile({content: base64, format: 'pdf', suggestedName: suggestedExportName()});
            setMessage(result.canceled ? t('status.exportCancelled') : t('status.exported', {name: result.path.split(/[\\/]/).pop() ?? ''}));
        } catch {
            setMessage(t('status.exportFailed'));
        }
    };
    const reportExportError = useCallback(() => setMessage(t('status.exportFailed')), [setMessage, t]);

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
        reportExportError,
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
