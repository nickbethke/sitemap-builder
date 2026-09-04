import {CanvasView, type CanvasViewHandle} from '@/components/sitemap/CanvasView.tsx';
import {TableView} from '@/components/sitemap/TableView.tsx';
import {KanbanView} from '@/components/sitemap/KanbanView.tsx';
import {MenuPreviewView, type MenuType} from '@/components/sitemap/MenuPreviewView.tsx';
import {TreeView} from '@/components/sitemap/TreeView.tsx';
import {Button} from '@/components/ui/button.tsx';
import {Input} from '@/components/ui/input.tsx';
import {Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select.tsx';
import {useTranslation} from '@/lib/i18n/context.tsx';
import {
    PAGE_STATUSES,
    PAGE_TYPES,
    SEO_IMPORTANCE_LEVELS,
    type LayoutDirection,
    type SitemapDocument,
    type SitemapNode,
    validateDocument,
} from '@/lib/sitemap.ts';
import {cn} from '@/lib/utils.ts';
import {
    AlertTriangle,
    MoveHorizontal,
    MoveVertical,
    Minus,
    Plus,
    Search,
    Table2,
    Network,
    X,
    MonitorPlay,
    Columns3,
    GitFork,

} from 'lucide-react';
import {
    type DragEvent,
    forwardRef,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
    type PointerEvent as ReactPointerEvent,
} from 'react';

type WorkspaceProps = {
    document: SitemapDocument;
    selectedId: string;
    draggedId: string | null;
    dropTargetId: string | null;
    search: string;
    zoom: number;
    layoutDirection: LayoutDirection;
    message: string;
    currentPath: string;
    onSearchChange: (search: string) => void;
    onZoomChange: (zoom: number) => void;
    onLayoutDirectionChange: (direction: LayoutDirection) => void;
    onAddChild: (parentId?: string | null) => void;
    onDuplicateNode: (nodeId: string) => void;
    onDeleteNode: (nodeId: string) => void;
    onDeleteNodes: (nodeIds: string[]) => Promise<boolean>;
    onMoveNodeSibling: (nodeId: string, direction: -1 | 1) => void;
    onMoveNodeUpLevel: (nodeId: string) => void;
    onSelectNode: (id: string) => void;
    onDraggedNodeChange: (id: string | null) => void;
    onDropTargetChange: (id: string | null) => void;
    canMoveTo: (nodeId: string, parentId: string) => boolean;
    onDropNode: (event: DragEvent<HTMLElement>, parentId: string) => void;
    onUpdateNode: <K extends keyof SitemapNode>(nodeId: string, key: K, value: SitemapNode[K]) => void;
    onUpdateNodes: <K extends keyof SitemapNode>(nodeIds: string[], key: K, value: SitemapNode[K]) => void;
    onExportPdf: (base64: string) => Promise<void>;
    presentationMode: boolean;
    onPresentationModeChange: (enabled: boolean) => void;
    workspaceMode: 'sitemap' | 'menu';
};

export type WorkspaceHandle = {
    exportPdf: () => Promise<void>;
};

const toolbarSelectClass = 'h-8 w-auto max-w-24 rounded-md border border-border bg-background px-2 text-[10px] text-foreground outline-none';
const layoutControlsClass = 'flex h-8 overflow-hidden rounded-md border border-border bg-[hsl(var(--panel))]';
const layoutButtonClass = 'grid h-full w-8 place-items-center rounded-none border-0 text-muted-foreground hover:bg-muted';

export const Workspace = forwardRef<WorkspaceHandle, WorkspaceProps>(function Workspace({
                                                                                            document,
                                                                                            selectedId,
                                                                                            draggedId,
                                                                                            dropTargetId,
                                                                                            search,
                                                                                            zoom,
                                                                                            layoutDirection,
                                                                                            message,
                                                                                            currentPath,
                                                                                            onSearchChange,
                                                                                            onZoomChange,
                                                                                            onLayoutDirectionChange,
                                                                                            onAddChild,
                                                                                            onDuplicateNode,
                                                                                            onDeleteNode,
                                                                                            onDeleteNodes,
                                                                                            onMoveNodeSibling,
                                                                                            onMoveNodeUpLevel,
                                                                                            onSelectNode,
                                                                                            onDraggedNodeChange,
                                                                                            onDropTargetChange,
                                                                                            canMoveTo,
                                                                                            onDropNode,
                                                                                            onUpdateNode,
                                                                                            onUpdateNodes,
                                                                                            onExportPdf,
                                                                                            presentationMode,
                                                                                            onPresentationModeChange,
                                                                                            workspaceMode,
                                                                                        }: WorkspaceProps, ref) {
    const {t} = useTranslation();
    const [view, setView] = useState<'canvas' | 'table' | 'tree' | 'kanban' | 'menu'>('canvas');
    const [menuDepth, setMenuDepth] = useState(2);
    const [menuType, setMenuType] = useState<MenuType>('dropdown');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [ownerFilter, setOwnerFilter] = useState('all');
    const [importanceFilter, setImportanceFilter] = useState('all');
    const [showIssues, setShowIssues] = useState(false);
    const [issuesHeight, setIssuesHeight] = useState(() => Number(localStorage.getItem('issues-panel-height')) || 220);
    const canvasViewRef = useRef<CanvasViewHandle>(null);
    const issues = useMemo(() => validateDocument(document), [document]);
    useImperativeHandle(ref, () => ({
        exportPdf: async () => {
            if (!canvasViewRef.current) {
                setView('canvas');
                await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
            }
            if (!canvasViewRef.current) throw new Error('Canvas ist für PDF-Export nicht verfügbar.');
            await canvasViewRef.current.exportPdf();
        },
    }), []);
    const visibleNodeIds = useMemo(() => new Set(
        document.nodes
            .filter((node) => `${node.title} ${node.slug} ${node.description} ${node.owner} ${node.notes}`
                    .toLowerCase()
                    .includes(search.toLowerCase())
                && (view !== 'table' || (
                    (statusFilter === 'all' || node.status === statusFilter)
                    && (typeFilter === 'all' || node.pageType === typeFilter)
                    && (ownerFilter === 'all' || node.owner === ownerFilter)
                    && (importanceFilter === 'all' || node.seoImportance === importanceFilter)
                )))
            .map((node) => node.id),
    ), [document.nodes, importanceFilter, ownerFilter, search, statusFilter, typeFilter, view]);
    const visibleNodes = useMemo(() => document.nodes.filter((node) => visibleNodeIds.has(node.id)), [document.nodes, visibleNodeIds]);
    const owners = useMemo(() => [...new Set(document.nodes.map((node) => node.owner).filter(Boolean))].sort(), [document.nodes]);

    useEffect(() => {
        localStorage.setItem('issues-panel-height', String(Math.round(issuesHeight)));
    }, [issuesHeight]);


    const clearFilters = () => {
        setStatusFilter('all');
        setTypeFilter('all');
        setOwnerFilter('all');
        setImportanceFilter('all');
    };
    const activeFilterCount = [statusFilter, typeFilter, ownerFilter, importanceFilter].filter((value) => value !== 'all').length;

    const focusIssueNode = (nodeId: string) => {
        onSelectNode(nodeId);
        setView('canvas');
        requestAnimationFrame(() => requestAnimationFrame(() => canvasViewRef.current?.focusNode(nodeId)));
    };

    const startIssuesResize = (event: ReactPointerEvent<HTMLDivElement>) => {
        event.preventDefault();
        const handle = event.currentTarget;
        const startY = event.clientY;
        const startHeight = issuesHeight;
        handle.setPointerCapture(event.pointerId);

        handle.onpointermove = (moveEvent) => {
            const maximum = Math.max(180, window.innerHeight * 0.6);
            setIssuesHeight(Math.max(120, Math.min(maximum, startHeight + startY - moveEvent.clientY)));
        };
        handle.onpointerup = () => {
            handle.onpointermove = null;
            handle.onpointerup = null;
        };
    };

    return (
        <main
            className={cn(
                'relative col-start-1 grid min-h-0 min-w-0 grid-rows-[50px_minmax(0,1fr)_29px] bg-[hsl(var(--canvas))]',
                presentationMode && 'col-span-full row-span-full grid-rows-[minmax(0,1fr)]',
            )}
            style={!presentationMode && showIssues ? {gridTemplateRows: `50px minmax(180px, 1fr) ${issuesHeight}px 29px`} : undefined}
        >
            {!presentationMode && <div
                className="z-4 flex items-center justify-between border-b border-border bg-[hsl(var(--panel)/.82)] px-3.5 backdrop-blur-md">
                <div
                    className={cn('flex h-8 w-52 items-center gap-2 rounded-md border border-border bg-background px-2 text-muted-foreground', workspaceMode === 'menu' && 'invisible')}>
                    <Search size={15}/>
                    <Input
                        className="h-auto w-full border-0 bg-transparent p-0 text-xs text-foreground shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                        value={search}
                        placeholder={t('workspace.searchPlaceholder')}
                        onChange={(event) => onSearchChange(event.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2.5 [&>button]:h-8 [&>button]:gap-1.5 [&>button]:text-xs">
                    <span
                        className={cn('text-[10px] text-muted-foreground', workspaceMode === 'menu' && 'hidden')}>{t('workspace.pageCount', {count: document.nodes.length})}</span>
                    {view === 'table' && (
                        <>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className={toolbarSelectClass}
                                               aria-label={t('workspace.filterByStatus')}>
                                    <SelectValue/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectItem value="all">{t('workspace.filter.statusLabel')}</SelectItem>
                                        {PAGE_STATUSES.map((status) => <SelectItem key={status}
                                                                                   value={status}>{t(`pageStatus.${status}`)}</SelectItem>)}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger className={toolbarSelectClass} aria-label={t('workspace.filterByType')}>
                                    <SelectValue/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectItem value="all">{t('workspace.filter.typeLabel')}</SelectItem>
                                        {PAGE_TYPES.map((type) => <SelectItem key={type}
                                                                              value={type}>{t(`pageType.${type}`)}</SelectItem>)}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            <Select value={ownerFilter} onValueChange={setOwnerFilter}>
                                <SelectTrigger className={toolbarSelectClass} aria-label={t('workspace.filterByOwner')}>
                                    <SelectValue/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectItem value="all">{t('workspace.filter.ownerLabel')}</SelectItem>
                                        {owners.map((owner) => <SelectItem key={owner}
                                                                           value={owner}>{owner}</SelectItem>)}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            <Select value={importanceFilter} onValueChange={setImportanceFilter}>
                                <SelectTrigger className={toolbarSelectClass} aria-label={t('workspace.filterBySeo')}>
                                    <SelectValue/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectItem value="all">{t('workspace.filter.seoLabel')}</SelectItem>
                                        {SEO_IMPORTANCE_LEVELS.map((level) => <SelectItem key={level}
                                                                                          value={level}>{t(`seoImportance.${level}`)}</SelectItem>)}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            {activeFilterCount > 0 && (
                                <Button variant="ghost" className="border border-primary/30 bg-accent px-2 text-primary"
                                        onClick={clearFilters}>
                                    {t('workspace.clearFilters', {count: activeFilterCount})}
                                </Button>
                            )}
                        </>
                    )}
                    <Button
                        variant="ghost"
                        className={cn('gap-1 border border-border bg-background px-2 text-muted-foreground', workspaceMode === 'menu' && 'hidden', issues.length > 0 && 'border-amber-500/40 bg-amber-500/10 text-amber-600')}
                        onClick={() => setShowIssues(!showIssues)}
                        title={t('workspace.qualityCheck')}
                    >
                        <AlertTriangle size={14}/>{issues.length}
                    </Button>
                    <Button
                        variant="ghost"
                        className="gap-1 border border-border bg-background px-2 text-muted-foreground"
                        onClick={() => onPresentationModeChange(true)}
                        title={t('workspace.presentationMode')}
                    >
                        <MonitorPlay size={15}/>{t('workspace.presentationMode')}
                    </Button>
                    {workspaceMode === 'sitemap' && <div className="ml-auto order-last flex items-center gap-2">
                        <span className="h-5 w-px bg-border" aria-hidden="true"/>
                        <div className={layoutControlsClass} aria-label={t('workspace.viewLabel')}>
                        <Button variant="ghost"
                                className={cn(layoutButtonClass, view === 'canvas' && 'bg-accent text-primary')}
                                aria-label={t('workspace.canvasView')} onClick={() => setView('canvas')}>
                            <Network size={15}/>
                        </Button>
                        <Button variant="ghost"
                                className={cn(layoutButtonClass, view === 'table' && 'bg-accent text-primary')}
                                aria-label={t('workspace.tableView')} onClick={() => setView('table')}>
                            <Table2 size={15}/>
                        </Button>
                        <Button variant="ghost" className={cn(layoutButtonClass, view === 'tree' && 'bg-accent text-primary')} aria-label={t('workspace.treeView')} title={t('workspace.treeView')} onClick={() => setView('tree')}>
                            <GitFork size={15}/>
                        </Button>
                        <Button variant="ghost" className={cn(layoutButtonClass, view === 'kanban' && 'bg-accent text-primary')} aria-label={t('workspace.kanbanView')} title={t('workspace.kanbanView')} onClick={() => setView('kanban')}>
                            <Columns3 size={15}/>
                        </Button>
                        </div>
                    </div>}
                    {workspaceMode === 'sitemap' && view === 'canvas' && (
                        <>
                            <div className={layoutControlsClass} aria-label={t('workspace.layoutLabel')}>
                                <Button
                                    variant="ghost"
                                    className={cn(layoutButtonClass, layoutDirection === 'horizontal' && 'bg-accent text-primary')}
                                    aria-label={t('workspace.layoutHorizontal')}
                                    title={t('workspace.layoutHorizontal')}
                                    onClick={() => onLayoutDirectionChange('horizontal')}
                                >
                                    <MoveHorizontal size={15}/>
                                </Button>
                                <Button
                                    variant="ghost"
                                    className={cn(layoutButtonClass, layoutDirection === 'vertical' && 'bg-accent text-primary')}
                                    aria-label={t('workspace.layoutVertical')}
                                    title={t('workspace.layoutVertical')}
                                    onClick={() => onLayoutDirectionChange('vertical')}
                                >
                                    <MoveVertical size={15}/>
                                </Button>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onAddChild()}
                            >
                                <Plus size={15}/>
                                {t('workspace.addPage')}
                            </Button>
                            <div
                                className="flex h-8 items-stretch overflow-hidden rounded-md border border-border bg-[hsl(var(--panel))] [&_button]:grid [&_button]:h-full [&_button]:w-8 [&_button]:place-items-center [&_button]:rounded-none [&_button]:border-0 [&_button:hover]:bg-muted">
                                <Button
                                    variant="ghost"
                                    aria-label={t('workspace.zoomOut')}
                                    onClick={() => onZoomChange(Math.max(0.1, zoom - 0.1))}
                                >
                                    <Minus size={14}/>
                                </Button>
                                <span
                                    className="flex w-11 select-none items-center justify-center border-x border-border font-mono text-[10px] leading-none tabular-nums text-muted-foreground"
                                    title={t('workspace.zoomResetTitle')}
                                    onDoubleClick={() => onZoomChange(1)}
                                >
                                    {Math.round(zoom * 100)}%
                                </span>
                                <Button
                                    variant="ghost"
                                    aria-label={t('workspace.zoomIn')}
                                    onClick={() => onZoomChange(Math.min(2, zoom + 0.1))}
                                >
                                    <Plus size={14}/>
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </div>}

            {workspaceMode === 'menu' || view === 'menu' ? (
                <MenuPreviewView document={document} depth={menuDepth} menuType={menuType} onDepthChange={setMenuDepth} onMenuTypeChange={setMenuType}/>
            ) : !presentationMode && view === 'tree' ? (
                <TreeView document={document} selectedId={selectedId} draggedId={draggedId} dropTargetId={dropTargetId} onSelectNode={onSelectNode} onMoveNode={onDropNode} canMoveTo={canMoveTo} onDraggedNodeChange={onDraggedNodeChange} onDropTargetChange={onDropTargetChange}/>
            ) : !presentationMode && view === 'kanban' ? (
                <KanbanView nodes={document.nodes.filter((node) => visibleNodeIds.has(node.id))} selectedId={selectedId} onSelectNode={onSelectNode} onUpdateStatus={(nodeId, status) => onUpdateNode(nodeId, 'status', status)}/>
            ) : !presentationMode && view === 'table' ? (
                <TableView nodes={visibleNodes} selectedId={selectedId} issues={issues} onSelectNode={onSelectNode} onUpdateNode={onUpdateNode} onUpdateNodes={onUpdateNodes} onDeleteNodes={onDeleteNodes}/>
            ) : <CanvasView
                ref={canvasViewRef}
                document={document}
                selectedId={selectedId}
                draggedId={draggedId}
                dropTargetId={dropTargetId}
                search={search}
                zoom={zoom}
                layoutDirection={layoutDirection}
                presentationMode={presentationMode}
                onZoomChange={onZoomChange}
                onSelectNode={onSelectNode}
                onAddChild={onAddChild}
                onDuplicateNode={onDuplicateNode}
                onDeleteNode={onDeleteNode}
                onMoveNodeSibling={onMoveNodeSibling}
                onMoveNodeUpLevel={onMoveNodeUpLevel}
                onDraggedNodeChange={onDraggedNodeChange}
                onDropTargetChange={onDropTargetChange}
                canMoveTo={canMoveTo}
                onDropNode={onDropNode}
                onExportPdf={onExportPdf}
            />}

            {!presentationMode && showIssues && (
                <section
                    className="relative flex min-h-0 flex-col border-t border-border bg-[hsl(var(--panel))] shadow-[0_-3px_12px_rgb(7_20_46_/_0.05)]"
                    aria-label={t('workspace.qualityCheck')}>
                    <div
                        className="absolute inset-x-0 -top-1 z-10 h-2 cursor-ns-resize touch-none after:absolute after:inset-x-0 after:top-0.75 after:h-px after:bg-transparent hover:after:bg-primary active:after:bg-primary"
                        role="separator"
                        aria-label={t('workspace.issuesPanelResizeAria')}
                        aria-orientation="horizontal"
                        onPointerDown={startIssuesResize}
                    />
                    <header
                        className="flex h-9 shrink-0 items-center justify-between border-b border-border bg-muted/50 px-3">
                        <div className="flex items-center gap-2 text-primary">
                            <AlertTriangle size={14}/>
                            <strong className="text-[10px] text-foreground">{t('workspace.qualityCheck')}</strong>
                            <span
                                className="text-[9px] text-muted-foreground">{t('workspace.issuesCount', {count: issues.length})}</span>
                        </div>
                        <Button variant="ghost" size="icon" className="size-6 text-muted-foreground"
                                aria-label={t('workspace.closeIssuesAria')} onClick={() => setShowIssues(false)}>
                            <X size={14}/>
                        </Button>
                    </header>
                    <div className="min-h-0 overflow-auto">
                        {issues.length === 0 ?
                            <p className="m-0 px-4 py-5 text-[10px] text-muted-foreground">{t('workspace.noIssuesFound')}</p> : issues.map((issue, index) => {
                                const node = document.nodes.find((item) => item.id === issue.nodeId);
                                return (
                                    <Button
                                        variant="ghost"
                                        className="grid h-auto min-h-8 w-full grid-cols-[8px_150px_1fr_60px] items-center justify-start gap-2 rounded-none border-b border-border px-3 text-left text-[9px] font-normal text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                                        key={`${issue.nodeId}-${index}`}
                                        onClick={() => focusIssueNode(issue.nodeId)}
                                    >
                                        <i className={cn('size-1.5 rounded-full bg-amber-500', issue.level === 'error' && 'bg-destructive')}/>
                                        <b className="truncate text-foreground">{node?.title}</b>
                                        <span>{t(issue.messageKey)}</span>
                                        <em className="text-right text-[8px] not-italic uppercase tracking-wide">{issue.level === 'error' ? t('workspace.levelError') : t('workspace.levelWarning')}</em>
                                    </Button>
                                );
                            })}
                    </div>
                </section>
            )}

            {presentationMode ? (
                <div className="absolute right-5 top-5 z-10 flex overflow-hidden rounded-md border border-border bg-[hsl(var(--panel)/.88)] shadow-md backdrop-blur [&>button]:rounded-none">
                    {workspaceMode === 'sitemap' && <>
                        <Button variant="secondary" size="icon" className={cn(layoutDirection === 'horizontal' && '!bg-primary !text-primary-foreground')} aria-label={t('workspace.layoutHorizontal')} title={t('workspace.layoutHorizontal')} onClick={() => onLayoutDirectionChange('horizontal')}>
                            <MoveHorizontal size={15}/>
                        </Button>
                        <Button variant="secondary" size="icon" className={cn(layoutDirection === 'vertical' && '!bg-primary !text-primary-foreground')} aria-label={t('workspace.layoutVertical')} title={t('workspace.layoutVertical')} onClick={() => onLayoutDirectionChange('vertical')}>
                            <MoveVertical size={15}/>
                        </Button>
                    </>}
                    <Button variant="secondary" size="sm" className="border-l border-border" onClick={() => onPresentationModeChange(false)}>
                        <X size={15}/>{t('workspace.exitPresentationMode')}
                    </Button>
                </div>
            ) : (
                <div
                    className="flex items-center gap-2 border-t border-border bg-[hsl(var(--panel))] px-3 text-[9px] text-muted-foreground">
                    <span
                        className="size-1.5 rounded-full bg-[hsl(var(--success))] shadow-[0_0_0_3px_hsl(var(--success)/.12)]"/>
                    {message}
                    <span className="ml-auto max-w-[45%] truncate">
                        {currentPath || t('workspace.noFileYet')}
                    </span>
                </div>
            )}
        </main>
    );
});
