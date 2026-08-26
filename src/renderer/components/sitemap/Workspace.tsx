import {CardContextMenu} from '@/components/sitemap/CardContextMenu.tsx';
import {Button} from '@/components/ui/button.tsx';
import {
    CARD_HEIGHT,
    CARD_WIDTH,
    layoutNodes,
    PAGE_STATUSES,
    PAGE_TYPES,
    SEO_IMPORTANCE_LEVELS,
    type LayoutDirection,
    type SitemapDocument,
    type SitemapLayout,
    type SitemapNode,
    validateDocument,
} from '@/lib/sitemap.ts';
import {cn} from '@/lib/utils.ts';
import {
    AlertTriangle,
    ChevronDown,
    Columns3,
    Link2,
    Minus,
    Plus,
    Rows3,
    Search,
    Table2,
    Network,
    X,
} from 'lucide-react';
import {type DragEvent, useEffect, useMemo, useState, type WheelEvent, type PointerEvent as ReactPointerEvent} from 'react';

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
    onMoveNodeSibling: (nodeId: string, direction: -1 | 1) => void;
    onMoveNodeUpLevel: (nodeId: string) => void;
    onSelectNode: (id: string) => void;
    onDraggedNodeChange: (id: string | null) => void;
    onDropTargetChange: (id: string | null) => void;
    canMoveTo: (nodeId: string, parentId: string) => boolean;
    onDropNode: (event: DragEvent<HTMLElement>, parentId: string) => void;
    onUpdateNode: <K extends keyof SitemapNode>(nodeId: string, key: K, value: SitemapNode[K]) => void;
    onUpdateNodes: <K extends keyof SitemapNode>(nodeIds: string[], key: K, value: SitemapNode[K]) => void;
};

const badgeClass = 'inline-flex h-5 items-center rounded-full px-2 text-[8px] font-bold uppercase tracking-wide';
const importanceClasses = {
    Hoch: 'bg-blue-600/10 text-blue-600 dark:text-cyan-300',
    Mittel: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
    Niedrig: 'bg-emerald-600/15 text-emerald-700 dark:text-emerald-300',
} satisfies Record<SitemapNode['seoImportance'], string>;
const toolbarSelectClass = 'h-8 max-w-24 rounded-md border border-border bg-background px-2 text-[10px] text-foreground outline-none';
const layoutControlsClass = 'flex h-8 overflow-hidden rounded-md border border-border bg-[hsl(var(--panel))]';
const layoutButtonClass = 'grid h-full w-8 place-items-center rounded-none border-0 text-muted-foreground hover:bg-muted';
const tableFieldClass = 'h-7 w-full min-w-20 rounded-md border border-transparent bg-transparent px-1.5 text-[10px] text-foreground outline-none hover:border-input hover:bg-background focus:border-input focus:bg-background';
const tableHeaderClass = 'sticky top-0 min-w-24 cursor-pointer overflow-hidden border-b border-border bg-muted px-3 py-2.5 text-[9px] uppercase tracking-wider text-muted-foreground [resize:horizontal]';
const tableCellClass = 'border-b border-border px-2 py-1.5 text-muted-foreground';

type SitemapCardProps = {
    node: SitemapNode;
    document: SitemapDocument;
    layout: SitemapLayout;
    layoutDirection: LayoutDirection;
    selected: boolean;
    draggedId: string | null;
    dropTarget: boolean;
    dimmed: boolean;
    onSelect: () => void;
    onAddChild: () => void;
    onDuplicate: () => void;
    onDelete: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
    onMoveUpLevel: () => void;
    onDraggedNodeChange: (id: string | null) => void;
    onDropTargetChange: (id: string | null) => void;
    canMoveTo: (nodeId: string, parentId: string) => boolean;
    onDropNode: (event: DragEvent<HTMLElement>, parentId: string) => void;
};

function connectionPath(
    node: SitemapNode,
    layout: SitemapLayout,
    direction: LayoutDirection,
) {
    if (!node.parentId) return null;

    const from = layout.positions[node.parentId];
    const to = layout.positions[node.id];
    if (!from || !to) return null;

    if (direction === 'horizontal') {
        const x1 = from.x + CARD_WIDTH;
        const y1 = from.y + CARD_HEIGHT / 2;
        const x2 = to.x;
        const y2 = to.y + CARD_HEIGHT / 2;

        return `M ${x1} ${y1} C ${x1 + 52} ${y1}, ${x2 - 52} ${y2}, ${x2} ${y2}`;
    }

    const x1 = from.x + CARD_WIDTH / 2;
    const y1 = from.y + CARD_HEIGHT;
    const x2 = to.x + CARD_WIDTH / 2;
    const y2 = to.y;

    return `M ${x1} ${y1} C ${x1} ${y1 + 64}, ${x2} ${y2 - 64}, ${x2} ${y2}`;
}

function SitemapCard({
    node,
    document,
    layout,
    layoutDirection,
    selected,
    draggedId,
    dropTarget,
    dimmed,
    onSelect,
    onAddChild,
    onDuplicate,
    onDelete,
    onMoveUp,
    onMoveDown,
    onMoveUpLevel,
    onDraggedNodeChange,
    onDropTargetChange,
    canMoveTo,
    onDropNode,
}: SitemapCardProps) {
    const position = layout.positions[node.id];
    if (!position) return null;

    const childCount = document.nodes.filter(
        (candidate) => candidate.parentId === node.id,
    ).length;
    const siblings = document.nodes.filter(
        (candidate) => candidate.parentId === node.parentId,
    );
    const siblingIndex = siblings.findIndex(
        (candidate) => candidate.id === node.id,
    );
    const className = cn(
        'absolute flex h-36.5 w-59 cursor-grab select-none flex-col rounded-xl border border-border bg-card px-3.5 pb-3 pt-3 shadow-sm transition-all hover:border-primary/50 hover:shadow-lg active:cursor-grabbing',
        selected && 'border-primary ring-2 ring-primary/15 shadow-lg shadow-primary/10',
        dropTarget && 'scale-[1.035] border-[#16e2be] ring-3 ring-[#16e2be]/15',
        dimmed && 'opacity-20',
    );

    return (
        <article
            className={className}
            style={{left: position.x, top: position.y}}
            draggable={node.parentId !== null}
            onDragStart={(event) => {
                onDraggedNodeChange(node.id);
                event.dataTransfer.effectAllowed = 'move';
            }}
            onDragEnd={() => {
                onDraggedNodeChange(null);
                onDropTargetChange(null);
            }}
            onDragOver={(event) => {
                if (draggedId && canMoveTo(draggedId, node.id)) {
                    event.preventDefault();
                    onDropTargetChange(node.id);
                }
            }}
            onDragLeave={() => onDropTargetChange(null)}
            onDrop={(event) => onDropNode(event, node.id)}
            onClick={(event) => {
                event.stopPropagation();
                onSelect();
            }}
        >
            <div className="flex h-5 items-start justify-between">
                <div className="flex min-w-0 items-center gap-1">
                    <span className={cn(badgeClass, importanceClasses[node.seoImportance])}>
                        {node.seoImportance}
                    </span>
                    {node.noIndex && (
                        <span className={cn(badgeClass, 'bg-red-500/10 text-red-600')}>Noindex</span>
                    )}
                </div>
                <CardContextMenu
                    canDelete={node.parentId !== null}
                    canMoveUp={siblingIndex > 0}
                    canMoveDown={siblingIndex < siblings.length - 1}
                    canMoveUpLevel={node.parentId !== null}
                    onAddChild={onAddChild}
                    onDuplicate={onDuplicate}
                    onDelete={onDelete}
                    onMoveUp={onMoveUp}
                    onMoveDown={onMoveDown}
                    onMoveUpLevel={onMoveUpLevel}
                />
            </div>

            <h3 className="mb-0.5 mt-1 text-sm leading-tight tracking-tight">{node.title || 'Ohne Titel'}</h3>
            <div className="flex items-center gap-1 text-[9px] text-primary">
                <Link2 size={13}/>
                {node.slug || '/'}
            </div>
            {node.description && <p className="mb-1 mt-2 flex-1 overflow-hidden text-[9px] leading-snug text-muted-foreground">{node.description}</p>}
            <footer className="mt-auto flex items-center justify-between border-t border-border pt-2 text-[8px] text-muted-foreground">
                <span>{node.pageType}</span>
                <span className="flex items-center gap-1">
                    <i className="size-1.5 rounded-full bg-[#16e2be]"/>
                    {node.status}
                </span>
            </footer>

            {childCount > 0 && (
                <div className={cn(
                    'absolute -right-3.5 top-1/2 flex h-7 min-w-7 -translate-y-1/2 items-center justify-center gap-0.5 rounded-full border border-primary/30 bg-card px-1 text-[9px] font-semibold text-primary shadow-md shadow-primary/15 [&_svg]:size-3 [&_svg]:shrink-0 [&_svg]:-rotate-90',
                    layoutDirection === 'vertical' && '-bottom-3.5 left-1/2 right-auto top-auto -translate-x-1/2 translate-y-0 [&_svg]:rotate-0',
                )}>
                    <ChevronDown size={13}/>
                    {childCount}
                </div>
            )}
        </article>
    );
}

export function Workspace({
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
    onMoveNodeSibling,
    onMoveNodeUpLevel,
    onSelectNode,
    onDraggedNodeChange,
    onDropTargetChange,
    canMoveTo,
    onDropNode,
    onUpdateNode,
    onUpdateNodes,
}: WorkspaceProps) {
    const [view, setView] = useState<'canvas' | 'table'>('canvas');
    const [statusFilter, setStatusFilter] = useState('Alle');
    const [typeFilter, setTypeFilter] = useState('Alle');
    const [ownerFilter, setOwnerFilter] = useState('Alle');
    const [importanceFilter, setImportanceFilter] = useState('Alle');
    const [showIssues, setShowIssues] = useState(false);
    const [issuesHeight, setIssuesHeight] = useState(() => Number(localStorage.getItem('issues-panel-height')) || 220);
    const [selectedRows, setSelectedRows] = useState<string[]>([]);
    const [sort, setSort] = useState<{key: keyof SitemapNode; direction: 1 | -1}>({key: 'title', direction: 1});
    const issues = useMemo(() => validateDocument(document), [document]);
    const layout = useMemo(
        () => layoutNodes(document.nodes, layoutDirection),
        [document.nodes, layoutDirection],
    );
    const visibleNodeIds = useMemo(() => new Set(
        document.nodes
            .filter((node) => `${node.title} ${node.slug} ${node.description} ${node.owner} ${node.notes}`
                .toLowerCase()
                .includes(search.toLowerCase())
                && (view !== 'table' || (
                    (statusFilter === 'Alle' || node.status === statusFilter)
                    && (typeFilter === 'Alle' || node.pageType === typeFilter)
                    && (ownerFilter === 'Alle' || node.owner === ownerFilter)
                    && (importanceFilter === 'Alle' || node.seoImportance === importanceFilter)
                )))
            .map((node) => node.id),
    ), [document.nodes, importanceFilter, ownerFilter, search, statusFilter, typeFilter, view]);
    const visibleNodes = useMemo(() => document.nodes
        .filter((node) => visibleNodeIds.has(node.id))
        .sort((a, b) => String(a[sort.key] ?? '').localeCompare(String(b[sort.key] ?? ''), 'de') * sort.direction),
    [document.nodes, sort, visibleNodeIds]);
    const owners = useMemo(() => [...new Set(document.nodes.map((node) => node.owner).filter(Boolean))].sort(), [document.nodes]);

    useEffect(() => {
        localStorage.setItem('issues-panel-height', String(Math.round(issuesHeight)));
    }, [issuesHeight]);

    const toggleSort = (key: keyof SitemapNode) => setSort((current) => ({
        key,
        direction: current.key === key ? (current.direction === 1 ? -1 : 1) : 1,
    }));
    const clearFilters = () => {
        setStatusFilter('Alle');
        setTypeFilter('Alle');
        setOwnerFilter('Alle');
        setImportanceFilter('Alle');
    };
    const activeFilterCount = [statusFilter, typeFilter, ownerFilter, importanceFilter].filter((value) => value !== 'Alle').length;

    const zoomByWheel = (event: WheelEvent<HTMLDivElement>) => {
        if (!event.metaKey && !event.ctrlKey) return;

        event.preventDefault();
        const nextZoom = zoom + (event.deltaY < 0 ? 0.1 : -0.1);
        onZoomChange(Math.max(0.55, Math.min(1.25, nextZoom)));
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
            className="relative col-start-2 grid min-h-0 min-w-0 grid-rows-[50px_minmax(0,1fr)_29px] bg-[hsl(var(--canvas))]"
            style={showIssues ? {gridTemplateRows: `50px minmax(180px, 1fr) ${issuesHeight}px 29px`} : undefined}
        >
            <div className="z-4 flex items-center justify-between border-b border-border bg-[hsl(var(--panel)/.82)] px-3.5 backdrop-blur-md">
                <div className="flex h-8 w-52 items-center gap-2 rounded-md border border-border bg-background px-2 text-muted-foreground">
                    <Search size={15}/>
                    <input
                        className="w-full border-0 bg-transparent text-xs text-foreground outline-none"
                        value={search}
                        placeholder="Seiten durchsuchen …"
                        onChange={(event) => onSearchChange(event.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2.5 [&>button]:h-8 [&>button]:gap-1.5 [&>button]:text-xs">
                    <span className="text-[10px] text-muted-foreground">{document.nodes.length} Seiten</span>
                    {view === 'table' && (
                        <>
                            <select className={toolbarSelectClass} value={statusFilter} aria-label="Nach Status filtern" onChange={(event) => setStatusFilter(event.target.value)}>
                                <option value="Alle">Status</option>
                                {PAGE_STATUSES.map((status) => <option key={status}>{status}</option>)}
                            </select>
                            <select className={toolbarSelectClass} value={typeFilter} aria-label="Nach Seitentyp filtern" onChange={(event) => setTypeFilter(event.target.value)}>
                                <option value="Alle">Typ</option>
                                {PAGE_TYPES.map((type) => <option key={type}>{type}</option>)}
                            </select>
                            <select className={toolbarSelectClass} value={ownerFilter} aria-label="Nach Verantwortlichem filtern" onChange={(event) => setOwnerFilter(event.target.value)}>
                                <option value="Alle">Owner</option>
                                {owners.map((owner) => <option key={owner}>{owner}</option>)}
                            </select>
                            <select className={toolbarSelectClass} value={importanceFilter} aria-label="Nach SEO-Relevanz filtern" onChange={(event) => setImportanceFilter(event.target.value)}>
                                <option value="Alle">SEO</option>
                                {SEO_IMPORTANCE_LEVELS.map((level) => <option key={level}>{level}</option>)}
                            </select>
                            {activeFilterCount > 0 && <button className="rounded-md border border-primary/30 bg-accent px-2 text-primary" onClick={clearFilters}>{activeFilterCount} Filter ×</button>}
                        </>
                    )}
                    <button className={cn('flex items-center rounded-md border border-border bg-background px-2 text-muted-foreground', issues.length > 0 && 'border-amber-500/40 bg-amber-500/10 text-amber-600')} onClick={() => setShowIssues(!showIssues)} title="Qualitätsprüfung">
                        <AlertTriangle size={14}/>{issues.length}
                    </button>
                    <div className={layoutControlsClass} aria-label="Ansicht">
                        <button className={cn(layoutButtonClass, view === 'canvas' && 'bg-accent text-primary')} aria-label="Canvas" onClick={() => setView('canvas')}><Network size={15}/></button>
                        <button className={cn(layoutButtonClass, view === 'table' && 'bg-accent text-primary')} aria-label="Tabelle" onClick={() => setView('table')}><Table2 size={15}/></button>
                    </div>
                    {view === 'canvas' && (
                        <>
                            <div className={layoutControlsClass} aria-label="Darstellung">
                                <button
                                    className={cn(layoutButtonClass, layoutDirection === 'horizontal' && 'bg-accent text-primary')}
                                    aria-label="Horizontal darstellen"
                                    title="Horizontal darstellen"
                                    onClick={() => onLayoutDirectionChange('horizontal')}
                                >
                                    <Rows3 size={15}/>
                                </button>
                                <button
                                    className={cn(layoutButtonClass, layoutDirection === 'vertical' && 'bg-accent text-primary')}
                                    aria-label="Vertikal darstellen"
                                    title="Vertikal darstellen"
                                    onClick={() => onLayoutDirectionChange('vertical')}
                                >
                                    <Columns3 size={15}/>
                                </button>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onAddChild()}
                            >
                                <Plus size={15}/>
                                Unterseite
                            </Button>
                            <div className="flex h-8 items-center overflow-hidden rounded-md border border-border bg-[hsl(var(--panel))] [&_button]:grid [&_button]:h-full [&_button]:w-8 [&_button]:place-items-center [&_button]:rounded-none [&_button]:border-0 [&_button:hover]:bg-muted">
                                <button
                                    aria-label="Verkleinern"
                                    onClick={() => onZoomChange(Math.max(0.55, zoom - 0.1))}
                                >
                                    <Minus size={14}/>
                                </button>
                                <span
                                    className="w-10 select-none text-center text-[9px] text-muted-foreground"
                                    title="Doppelklick: Zoom auf 100 % zurücksetzen"
                                    onDoubleClick={() => onZoomChange(1)}
                                >
                                    {Math.round(zoom * 100)}%
                                </span>
                                <button
                                    aria-label="Vergrößern"
                                    onClick={() => onZoomChange(Math.min(1.25, zoom + 0.1))}
                                >
                                    <Plus size={14}/>
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {view === 'table' ? (
                <div className="overflow-auto p-4">
                    {selectedRows.length > 0 && (
                        <div className="sticky left-0 top-0 z-10 mb-2 flex h-10 items-center gap-3 rounded-lg border border-primary/25 bg-accent px-3 text-[10px] [&_button]:h-7 [&_button]:rounded-md [&_button]:border [&_button]:border-border [&_button]:bg-background [&_button]:px-2 [&_button]:text-[9px] [&_select]:h-7 [&_select]:rounded-md [&_select]:border [&_select]:border-border [&_select]:bg-background [&_select]:px-2 [&_select]:text-[9px]">
                            <strong className="text-primary">{selectedRows.length} ausgewählt</strong>
                            <select defaultValue="" onChange={(event) => {
                                if (event.target.value) onUpdateNodes(selectedRows, 'status', event.target.value as SitemapNode['status']);
                                event.target.value = '';
                            }}>
                                <option value="">Status setzen …</option>
                                {PAGE_STATUSES.map((status) => <option key={status}>{status}</option>)}
                            </select>
                            <button onClick={() => setSelectedRows([])}>Auswahl aufheben</button>
                        </div>
                    )}
                    <table className="w-full border-separate border-spacing-0 overflow-hidden rounded-xl border border-border bg-card text-left text-[10px]">
                        <thead><tr>
                            <th className={`${tableHeaderClass} w-10 min-w-10 cursor-default [resize:none]`}><input type="checkbox" aria-label="Alle sichtbaren Seiten auswählen" checked={visibleNodes.length > 0 && visibleNodes.every((node) => selectedRows.includes(node.id))} onChange={(event) => setSelectedRows(event.target.checked ? visibleNodes.map((node) => node.id) : [])}/></th>
                            {([['title', 'Seite'], ['slug', 'URL'], ['pageType', 'Typ'], ['status', 'Status'], ['owner', 'Owner']] as [keyof SitemapNode, string][]).map(([key, label]) => <th className={tableHeaderClass} key={key} onClick={() => toggleSort(key)}>{label}{sort.key === key ? (sort.direction === 1 ? ' ↑' : ' ↓') : ''}</th>)}
                            <th className={tableHeaderClass}>Prüfung</th>
                        </tr></thead>
                        <tbody>{visibleNodes.map((node) => (
                            <tr key={node.id} className={cn('cursor-pointer hover:bg-accent/60', selectedId === node.id && 'bg-accent/60')} onClick={() => onSelectNode(node.id)}>
                                <td className={tableCellClass} onClick={(event) => event.stopPropagation()}><input type="checkbox" checked={selectedRows.includes(node.id)} onChange={(event) => setSelectedRows((current) => event.target.checked ? [...current, node.id] : current.filter((id) => id !== node.id))}/></td>
                                <td className={tableCellClass}><input className={tableFieldClass} value={node.title} aria-label={`Titel von ${node.title}`} onClick={(event) => event.stopPropagation()} onChange={(event) => onUpdateNode(node.id, 'title', event.target.value)}/></td>
                                <td className={tableCellClass}><input className={tableFieldClass} value={node.slug} aria-label={`URL von ${node.title}`} onClick={(event) => event.stopPropagation()} onChange={(event) => onUpdateNode(node.id, 'slug', event.target.value)}/></td>
                                <td className={tableCellClass}><select className={tableFieldClass} value={node.pageType} onClick={(event) => event.stopPropagation()} onChange={(event) => onUpdateNode(node.id, 'pageType', event.target.value as SitemapNode['pageType'])}>{PAGE_TYPES.map((type) => <option key={type}>{type}</option>)}</select></td>
                                <td className={tableCellClass}><select className={tableFieldClass} value={node.status} onClick={(event) => event.stopPropagation()} onChange={(event) => onUpdateNode(node.id, 'status', event.target.value as SitemapNode['status'])}>{PAGE_STATUSES.map((status) => <option key={status}>{status}</option>)}</select></td>
                                <td className={tableCellClass}><input className={tableFieldClass} value={node.owner} aria-label={`Owner von ${node.title}`} onClick={(event) => event.stopPropagation()} onChange={(event) => onUpdateNode(node.id, 'owner', event.target.value)}/></td>
                                <td className={tableCellClass}>{issues.filter((issue) => issue.nodeId === node.id).length || '✓'}</td>
                            </tr>
                        ))}</tbody>
                    </table>
                </div>
            ) : <div
                className="relative overflow-auto bg-[hsl(var(--canvas))] [background-image:radial-gradient(hsl(var(--line)/.6)_0.7px,transparent_0.7px)] [background-size:18px_18px]"
                onWheel={zoomByWheel}
                onClick={() => onSelectNode('')}
            >
                <div
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
            </div>}

            {showIssues && (
                <section className="relative flex min-h-0 flex-col border-t border-border bg-[hsl(var(--panel))] shadow-[0_-3px_12px_rgb(7_20_46_/_0.05)]" aria-label="Qualitätsprüfung">
                    <div
                        className="absolute inset-x-0 -top-1 z-10 h-2 cursor-ns-resize touch-none after:absolute after:inset-x-0 after:top-0.75 after:h-px after:bg-transparent hover:after:bg-primary active:after:bg-primary"
                        role="separator"
                        aria-label="Höhe der Qualitätsprüfung ändern"
                        aria-orientation="horizontal"
                        onPointerDown={startIssuesResize}
                    />
                    <header className="flex h-9 shrink-0 items-center justify-between border-b border-border bg-muted/50 px-3">
                        <div className="flex items-center gap-2 text-primary">
                            <AlertTriangle size={14}/>
                            <strong className="text-[10px] text-foreground">Qualitätsprüfung</strong>
                            <span className="text-[9px] text-muted-foreground">{issues.length} Hinweise</span>
                        </div>
                        <button className="grid size-6 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Qualitätsprüfung schließen" onClick={() => setShowIssues(false)}><X size={14}/></button>
                    </header>
                    <div className="min-h-0 overflow-auto">
                        {issues.length === 0 ? <p className="m-0 px-4 py-5 text-[10px] text-muted-foreground">Keine Probleme gefunden.</p> : issues.map((issue, index) => {
                            const node = document.nodes.find((item) => item.id === issue.nodeId);
                            return (
                                <button
                                    className="grid min-h-8 w-full grid-cols-[8px_150px_1fr_60px] items-center gap-2 border-b border-border px-3 text-left text-[9px] text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                                    key={`${issue.nodeId}-${index}`}
                                    onClick={() => onSelectNode(issue.nodeId)}
                                >
                                    <i className={cn('size-1.5 rounded-full bg-amber-500', issue.level === 'error' && 'bg-destructive')}/>
                                    <b className="truncate text-foreground">{node?.title}</b>
                                    <span>{issue.message}</span>
                                    <em className="text-right text-[8px] not-italic uppercase tracking-wide">{issue.level === 'error' ? 'Fehler' : 'Warnung'}</em>
                                </button>
                            );
                        })}
                    </div>
                </section>
            )}

            <div className="flex items-center gap-2 border-t border-border bg-[hsl(var(--panel))] px-3 text-[9px] text-muted-foreground">
                <span className="size-1.5 rounded-full bg-[#16e2be]"/>
                {message}
                <span className="ml-auto max-w-[45%] truncate">
                    {currentPath || 'Noch keine .smap-Datei'}
                </span>
            </div>
        </main>
    );
}
