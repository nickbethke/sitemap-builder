import {MiniMap, type MiniMapViewport} from '@/components/sitemap/MiniMap.tsx';
import {connectionPath, SitemapCard} from '@/components/sitemap/SitemapCard.tsx';
import {Button} from '@/components/ui/button.tsx';
import {Checkbox} from '@/components/ui/checkbox.tsx';
import {Input} from '@/components/ui/input.tsx';
import {Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select.tsx';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table.tsx';
import {captureCanvasAsPdfBase64} from '@/lib/canvasExport.ts';
import {useTranslation} from '@/lib/i18n/context.tsx';
import {
    layoutNodes,
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
    Columns3,
    Minus,
    Plus,
    Rows3,
    Search,
    Table2,
    Network,
    Trash2,
    X,
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
    onExportPdf: (base64: string) => void;
};

export type WorkspaceHandle = {
    exportPdf: () => Promise<void>;
};

const toolbarSelectClass = 'h-8 w-auto max-w-24 rounded-md border border-border bg-background px-2 text-[10px] text-foreground outline-none';
const layoutControlsClass = 'flex h-8 overflow-hidden rounded-md border border-border bg-[hsl(var(--panel))]';
const layoutButtonClass = 'grid h-full w-8 place-items-center rounded-none border-0 text-muted-foreground hover:bg-muted';
const tableFieldClass = 'h-7 w-full min-w-20 rounded-md border border-transparent bg-transparent px-1.5 text-[10px] text-foreground outline-none hover:border-input hover:bg-background focus:border-input focus:bg-background';
const tableHeaderClass = 'sticky top-0 min-w-24 cursor-pointer overflow-hidden border-b border-border bg-muted px-3 py-2.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground [resize:horizontal]';
const tableCellClass = 'border-b border-border px-2 py-1.5 text-muted-foreground';

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
}: WorkspaceProps, ref) {
    const {locale, t} = useTranslation();
    const [view, setView] = useState<'canvas' | 'table'>('canvas');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [ownerFilter, setOwnerFilter] = useState('all');
    const [importanceFilter, setImportanceFilter] = useState('all');
    const [showIssues, setShowIssues] = useState(false);
    const [issuesHeight, setIssuesHeight] = useState(() => Number(localStorage.getItem('issues-panel-height')) || 220);
    const [selectedRows, setSelectedRows] = useState<string[]>([]);
    const [bulkActionKey, setBulkActionKey] = useState(0);
    const [sort, setSort] = useState<{key: keyof SitemapNode; direction: 1 | -1}>({key: 'title', direction: 1});
    const canvasRef = useRef<HTMLDivElement>(null);
    const canvasContentRef = useRef<HTMLDivElement>(null);
    const [viewport, setViewport] = useState<MiniMapViewport>({scrollLeft: 0, scrollTop: 0, clientWidth: 0, clientHeight: 0});
    const issues = useMemo(() => validateDocument(document), [document]);
    const layout = useMemo(
        () => layoutNodes(document.nodes, layoutDirection),
        [document.nodes, layoutDirection],
    );

    useImperativeHandle(ref, () => ({
        exportPdf: async () => {
            const node = canvasContentRef.current;
            if (!node) return;

            const base64 = await captureCanvasAsPdfBase64(node, layout.width, layout.height);
            onExportPdf(base64);
        },
    }), [layout.height, layout.width, onExportPdf]);
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
    const visibleNodes = useMemo(() => document.nodes
        .filter((node) => visibleNodeIds.has(node.id))
        .sort((a, b) => String(a[sort.key] ?? '').localeCompare(String(b[sort.key] ?? ''), locale) * sort.direction),
    [document.nodes, locale, sort, visibleNodeIds]);
    const owners = useMemo(() => [...new Set(document.nodes.map((node) => node.owner).filter(Boolean))].sort(), [document.nodes]);

    useEffect(() => {
        localStorage.setItem('issues-panel-height', String(Math.round(issuesHeight)));
    }, [issuesHeight]);

    useEffect(() => {
        const nodeIds = new Set(document.nodes.map((node) => node.id));
        setSelectedRows((current) => current.filter((id) => nodeIds.has(id)));
    }, [document.nodes]);

    const syncViewport = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        setViewport({
            scrollLeft: canvas.scrollLeft,
            scrollTop: canvas.scrollTop,
            clientWidth: canvas.clientWidth,
            clientHeight: canvas.clientHeight,
        });
    };

    useEffect(() => {
        if (view !== 'canvas') return;

        syncViewport();
        const canvas = canvasRef.current;
        if (!canvas) return;

        const observer = new ResizeObserver(syncViewport);
        observer.observe(canvas);
        return () => observer.disconnect();
    }, [view, showIssues, issuesHeight]);

    const navigateFromMiniMap = (x: number, y: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.scrollTo({
            left: x * zoom - canvas.clientWidth / 2,
            top: y * zoom - canvas.clientHeight / 2,
        });
    };

    const toggleSort = (key: keyof SitemapNode) => setSort((current) => ({
        key,
        direction: current.key === key ? (current.direction === 1 ? -1 : 1) : 1,
    }));
    const clearFilters = () => {
        setStatusFilter('all');
        setTypeFilter('all');
        setOwnerFilter('all');
        setImportanceFilter('all');
    };
    const activeFilterCount = [statusFilter, typeFilter, ownerFilter, importanceFilter].filter((value) => value !== 'all').length;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const handleWheel = (event: globalThis.WheelEvent) => {
            if (!event.metaKey && !event.ctrlKey) return;

            event.preventDefault();
            const nextZoom = zoom + (event.deltaY < 0 ? 0.1 : -0.1);
            onZoomChange(Math.max(0.1, Math.min(2, nextZoom)));
        };

        canvas.addEventListener('wheel', handleWheel, {passive: false});
        return () => canvas.removeEventListener('wheel', handleWheel);
    }, [zoom, onZoomChange]);

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
            className="relative col-start-1 grid min-h-0 min-w-0 grid-rows-[50px_minmax(0,1fr)_29px] bg-[hsl(var(--canvas))]"
            style={showIssues ? {gridTemplateRows: `50px minmax(180px, 1fr) ${issuesHeight}px 29px`} : undefined}
        >
            <div className="z-4 flex items-center justify-between border-b border-border bg-[hsl(var(--panel)/.82)] px-3.5 backdrop-blur-md">
                <div className="flex h-8 w-52 items-center gap-2 rounded-md border border-border bg-background px-2 text-muted-foreground">
                    <Search size={15}/>
                    <Input
                        className="h-auto w-full border-0 bg-transparent p-0 text-xs text-foreground shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                        value={search}
                        placeholder={t('workspace.searchPlaceholder')}
                        onChange={(event) => onSearchChange(event.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2.5 [&>button]:h-8 [&>button]:gap-1.5 [&>button]:text-xs">
                    <span className="text-[10px] text-muted-foreground">{t('workspace.pageCount', {count: document.nodes.length})}</span>
                    {view === 'table' && (
                        <>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className={toolbarSelectClass} aria-label={t('workspace.filterByStatus')}>
                                    <SelectValue/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                    <SelectItem value="all">{t('workspace.filter.statusLabel')}</SelectItem>
                                    {PAGE_STATUSES.map((status) => <SelectItem key={status} value={status}>{t(`pageStatus.${status}`)}</SelectItem>)}
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
                                    {PAGE_TYPES.map((type) => <SelectItem key={type} value={type}>{t(`pageType.${type}`)}</SelectItem>)}
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
                                    {owners.map((owner) => <SelectItem key={owner} value={owner}>{owner}</SelectItem>)}
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
                                    {SEO_IMPORTANCE_LEVELS.map((level) => <SelectItem key={level} value={level}>{t(`seoImportance.${level}`)}</SelectItem>)}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            {activeFilterCount > 0 && (
                                <Button variant="ghost" className="border border-primary/30 bg-accent px-2 text-primary" onClick={clearFilters}>
                                    {t('workspace.clearFilters', {count: activeFilterCount})}
                                </Button>
                            )}
                        </>
                    )}
                    <Button
                        variant="ghost"
                        className={cn('gap-1 border border-border bg-background px-2 text-muted-foreground', issues.length > 0 && 'border-amber-500/40 bg-amber-500/10 text-amber-600')}
                        onClick={() => setShowIssues(!showIssues)}
                        title={t('workspace.qualityCheck')}
                    >
                        <AlertTriangle size={14}/>{issues.length}
                    </Button>
                    <div className={layoutControlsClass} aria-label={t('workspace.viewLabel')}>
                        <Button variant="ghost" className={cn(layoutButtonClass, view === 'canvas' && 'bg-accent text-primary')} aria-label={t('workspace.canvasView')} onClick={() => setView('canvas')}>
                            <Network size={15}/>
                        </Button>
                        <Button variant="ghost" className={cn(layoutButtonClass, view === 'table' && 'bg-accent text-primary')} aria-label={t('workspace.tableView')} onClick={() => setView('table')}>
                            <Table2 size={15}/>
                        </Button>
                    </div>
                    {view === 'canvas' && (
                        <>
                            <div className={layoutControlsClass} aria-label={t('workspace.layoutLabel')}>
                                <Button
                                    variant="ghost"
                                    className={cn(layoutButtonClass, layoutDirection === 'horizontal' && 'bg-accent text-primary')}
                                    aria-label={t('workspace.layoutHorizontal')}
                                    title={t('workspace.layoutHorizontal')}
                                    onClick={() => onLayoutDirectionChange('horizontal')}
                                >
                                    <Rows3 size={15}/>
                                </Button>
                                <Button
                                    variant="ghost"
                                    className={cn(layoutButtonClass, layoutDirection === 'vertical' && 'bg-accent text-primary')}
                                    aria-label={t('workspace.layoutVertical')}
                                    title={t('workspace.layoutVertical')}
                                    onClick={() => onLayoutDirectionChange('vertical')}
                                >
                                    <Columns3 size={15}/>
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
                            <div className="flex h-8 items-stretch overflow-hidden rounded-md border border-border bg-[hsl(var(--panel))] [&_button]:grid [&_button]:h-full [&_button]:w-8 [&_button]:place-items-center [&_button]:rounded-none [&_button]:border-0 [&_button:hover]:bg-muted">
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
            </div>

            {view === 'table' ? (
                <div className="overflow-auto p-4">
                    {selectedRows.length > 0 && (
                        <div className="sticky left-0 top-0 z-10 mb-2 flex h-10 items-center gap-3 rounded-lg border border-primary/25 bg-accent px-3 text-[10px] [&_button]:h-7 [&_button]:rounded-md [&_button]:border [&_button]:border-border [&_button]:bg-background [&_button]:px-2 [&_button]:text-[9px]">
                            <strong className="text-primary">{t('workspace.rowsSelected', {count: selectedRows.length})}</strong>
                            <Select
                                key={bulkActionKey}
                                onValueChange={(value) => {
                                    onUpdateNodes(selectedRows, 'status', value as SitemapNode['status']);
                                    setBulkActionKey((current) => current + 1);
                                }}
                            >
                                <SelectTrigger className="w-auto">
                                    <SelectValue placeholder={t('workspace.setStatusPlaceholder')}/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                    {PAGE_STATUSES.map((status) => <SelectItem key={status} value={status}>{t(`pageStatus.${status}`)}</SelectItem>)}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            <Button
                                variant="ghost"
                                className="!gap-1.5 !border-destructive/30 !bg-destructive/10 !text-destructive hover:!bg-destructive/20"
                                onClick={() => void onDeleteNodes(selectedRows).then((deleted) => {
                                    if (deleted) setSelectedRows([]);
                                })}
                            >
                                <Trash2 size={12}/>
                                {t('common.delete')}
                            </Button>
                            <Button variant="ghost" onClick={() => setSelectedRows([])}>{t('workspace.clearSelection')}</Button>
                        </div>
                    )}
                    <Table className="border-separate border-spacing-0 overflow-hidden rounded-xl border border-border bg-card text-left text-[10px]">
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead className={`${tableHeaderClass} w-10 min-w-10 cursor-default resize-none`}>
                                    <Checkbox
                                        aria-label={t('workspace.selectAllVisible')}
                                        checked={visibleNodes.length > 0 && visibleNodes.every((node) => selectedRows.includes(node.id))}
                                        onCheckedChange={(checked) => setSelectedRows(checked === true ? visibleNodes.map((node) => node.id) : [])}
                                    />
                                </TableHead>
                                {([['title', t('workspace.col.page')], ['slug', t('workspace.col.url')], ['pageType', t('workspace.col.type')], ['status', t('workspace.col.status')], ['owner', t('workspace.col.owner')]] as [keyof SitemapNode, string][]).map(([key, label]) => (
                                    <TableHead className={tableHeaderClass} key={key} onClick={() => toggleSort(key)}>
                                        {label}{sort.key === key ? (sort.direction === 1 ? ' ↑' : ' ↓') : ''}
                                    </TableHead>
                                ))}
                                <TableHead className={tableHeaderClass}>{t('workspace.col.check')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>{visibleNodes.map((node) => (
                            <TableRow
                                key={node.id}
                                className={cn('cursor-pointer hover:bg-accent/60', selectedId === node.id && 'bg-accent/60')}
                                onClick={() => onSelectNode(node.id)}
                            >
                                <TableCell className={tableCellClass} onClick={(event) => event.stopPropagation()}>
                                    <Checkbox
                                        checked={selectedRows.includes(node.id)}
                                        onCheckedChange={(checked) => setSelectedRows((current) => checked === true ? [...current, node.id] : current.filter((id) => id !== node.id))}
                                    />
                                </TableCell>
                                <TableCell className={tableCellClass}>
                                    <Input
                                        className={tableFieldClass}
                                        value={node.title}
                                        aria-label={t('workspace.titleOfAria', {title: node.title})}
                                        onClick={(event) => event.stopPropagation()}
                                        onChange={(event) => onUpdateNode(node.id, 'title', event.target.value)}
                                    />
                                </TableCell>
                                <TableCell className={tableCellClass}>
                                    <Input
                                        className={tableFieldClass}
                                        value={node.slug}
                                        aria-label={t('workspace.urlOfAria', {title: node.title})}
                                        onClick={(event) => event.stopPropagation()}
                                        onChange={(event) => onUpdateNode(node.id, 'slug', event.target.value)}
                                    />
                                </TableCell>
                                <TableCell className={tableCellClass} onClick={(event) => event.stopPropagation()}>
                                    <Select value={node.pageType} onValueChange={(value) => onUpdateNode(node.id, 'pageType', value as SitemapNode['pageType'])}>
                                        <SelectTrigger className={tableFieldClass}>
                                            <SelectValue/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                            {PAGE_TYPES.map((type) => <SelectItem key={type} value={type}>{t(`pageType.${type}`)}</SelectItem>)}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                                <TableCell className={tableCellClass} onClick={(event) => event.stopPropagation()}>
                                    <Select value={node.status} onValueChange={(value) => onUpdateNode(node.id, 'status', value as SitemapNode['status'])}>
                                        <SelectTrigger className={tableFieldClass}>
                                            <SelectValue/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                            {PAGE_STATUSES.map((status) => <SelectItem key={status} value={status}>{t(`pageStatus.${status}`)}</SelectItem>)}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                                <TableCell className={tableCellClass}>
                                    <Input
                                        className={tableFieldClass}
                                        value={node.owner}
                                        aria-label={t('workspace.ownerOfAria', {title: node.title})}
                                        onClick={(event) => event.stopPropagation()}
                                        onChange={(event) => onUpdateNode(node.id, 'owner', event.target.value)}
                                    />
                                </TableCell>
                                <TableCell className={tableCellClass}>{issues.filter((issue) => issue.nodeId === node.id).length || '✓'}</TableCell>
                            </TableRow>
                        ))}</TableBody>
                    </Table>
                </div>
            ) : <div className="relative min-h-0">
                <div
                    ref={canvasRef}
                    className="blueprint-canvas absolute inset-0 overflow-auto"
                    onScroll={syncViewport}
                    onClick={() => onSelectNode('')}
                >
                    <div style={{width: layout.width * zoom, height: layout.height * zoom}}>
                        <div
                            ref={canvasContentRef}
                            className="relative origin-top-left transition-transform"
                            style={{
                                width: layout.width,
                                height: layout.height,
                                transform: `scale(${zoom})`,
                            }}
                        >
                            <svg
                                className="pointer-events-none absolute inset-0 overflow-visible [&_path]:fill-none [&_path]:stroke-[hsl(var(--line))] [&_path]:stroke-[1.5]"
                                width={layout.width}
                                height={layout.height}
                                aria-hidden="true"
                            >
                                {document.nodes.map((node) => {
                                    const path = connectionPath(
                                        node,
                                        layout,
                                        layoutDirection,
                                    );
                                    return path
                                        ? <path key={node.id} d={path}/>
                                        : null;
                                })}
                            </svg>

                            {document.nodes.map((node) => (
                                <SitemapCard
                                    key={node.id}
                                    node={node}
                                    document={document}
                                    layout={layout}
                                    layoutDirection={layoutDirection}
                                    selected={selectedId === node.id}
                                    draggedId={draggedId}
                                    dropTarget={dropTargetId === node.id}
                                    dimmed={Boolean(
                                        search && !visibleNodeIds.has(node.id),
                                    )}
                                    onSelect={() => onSelectNode(node.id)}
                                    onAddChild={() => onAddChild(node.id)}
                                    onDuplicate={() => onDuplicateNode(node.id)}
                                    onDelete={() => onDeleteNode(node.id)}
                                    onMoveUp={() => onMoveNodeSibling(node.id, -1)}
                                    onMoveDown={() => onMoveNodeSibling(node.id, 1)}
                                    onMoveUpLevel={() => onMoveNodeUpLevel(node.id)}
                                    onDraggedNodeChange={onDraggedNodeChange}
                                    onDropTargetChange={onDropTargetChange}
                                    canMoveTo={canMoveTo}
                                    onDropNode={onDropNode}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {document.nodes.length > 0 && (
                    <MiniMap
                        layout={layout}
                        nodes={document.nodes}
                        selectedId={selectedId}
                        zoom={zoom}
                        viewport={viewport}
                        onNavigate={navigateFromMiniMap}
                    />
                )}
            </div>}

            {showIssues && (
                <section className="relative flex min-h-0 flex-col border-t border-border bg-[hsl(var(--panel))] shadow-[0_-3px_12px_rgb(7_20_46_/_0.05)]" aria-label={t('workspace.qualityCheck')}>
                    <div
                        className="absolute inset-x-0 -top-1 z-10 h-2 cursor-ns-resize touch-none after:absolute after:inset-x-0 after:top-0.75 after:h-px after:bg-transparent hover:after:bg-primary active:after:bg-primary"
                        role="separator"
                        aria-label={t('workspace.issuesPanelResizeAria')}
                        aria-orientation="horizontal"
                        onPointerDown={startIssuesResize}
                    />
                    <header className="flex h-9 shrink-0 items-center justify-between border-b border-border bg-muted/50 px-3">
                        <div className="flex items-center gap-2 text-primary">
                            <AlertTriangle size={14}/>
                            <strong className="text-[10px] text-foreground">{t('workspace.qualityCheck')}</strong>
                            <span className="text-[9px] text-muted-foreground">{t('workspace.issuesCount', {count: issues.length})}</span>
                        </div>
                        <Button variant="ghost" size="icon" className="size-6 text-muted-foreground" aria-label={t('workspace.closeIssuesAria')} onClick={() => setShowIssues(false)}>
                            <X size={14}/>
                        </Button>
                    </header>
                    <div className="min-h-0 overflow-auto">
                        {issues.length === 0 ? <p className="m-0 px-4 py-5 text-[10px] text-muted-foreground">{t('workspace.noIssuesFound')}</p> : issues.map((issue, index) => {
                            const node = document.nodes.find((item) => item.id === issue.nodeId);
                            return (
                                <Button
                                    variant="ghost"
                                    className="grid h-auto min-h-8 w-full grid-cols-[8px_150px_1fr_60px] items-center justify-start gap-2 rounded-none border-b border-border px-3 text-left text-[9px] font-normal text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                                    key={`${issue.nodeId}-${index}`}
                                    onClick={() => onSelectNode(issue.nodeId)}
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

            <div className="flex items-center gap-2 border-t border-border bg-[hsl(var(--panel))] px-3 text-[9px] text-muted-foreground">
                <span className="size-1.5 rounded-full bg-[hsl(var(--success))] shadow-[0_0_0_3px_hsl(var(--success)/.12)]"/>
                {message}
                <span className="ml-auto max-w-[45%] truncate">
                    {currentPath || t('workspace.noFileYet')}
                </span>
            </div>
        </main>
    );
});
