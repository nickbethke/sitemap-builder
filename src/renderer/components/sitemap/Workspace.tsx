import {CardContextMenu} from '@/components/sitemap/CardContextMenu.tsx';
import {Button} from '@/components/ui/button.tsx';
import {
    CARD_HEIGHT,
    CARD_WIDTH,
    importanceClass,
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
    const className = [
        'sitemap-card',
        selected ? 'selected' : '',
        dropTarget ? 'drop-target' : '',
        dimmed ? 'search-dimmed' : '',
    ].filter(Boolean).join(' ');

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
            <div className="card-topline">
                <div className="card-badges">
                    <span className={importanceClass[node.seoImportance]}>
                        {node.seoImportance}
                    </span>
                    {node.noIndex && (
                        <span className="badge badge-noindex">Noindex</span>
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

            <h3>{node.title || 'Ohne Titel'}</h3>
            <div className="slug">
                <Link2 size={13}/>
                {node.slug || '/'}
            </div>
            {node.description && <p>{node.description}</p>}
            <footer>
                <span>{node.pageType}</span>
                <span className="status-dot">
                    <i/>
                    {node.status}
                </span>
            </footer>

            {childCount > 0 && (
                <div className={`child-count ${layoutDirection}`}>
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
            className={showIssues ? 'workspace tool-window-open' : 'workspace'}
            style={showIssues ? {gridTemplateRows: `50px minmax(180px, 1fr) ${issuesHeight}px 29px`} : undefined}
        >
            <div className="canvas-toolbar">
                <div className="search">
                    <Search size={15}/>
                    <input
                        value={search}
                        placeholder="Seiten durchsuchen …"
                        onChange={(event) => onSearchChange(event.target.value)}
                    />
                </div>

                <div className="canvas-actions">
                    <span>{document.nodes.length} Seiten</span>
                    {view === 'table' && (
                        <>
                            <select value={statusFilter} aria-label="Nach Status filtern" onChange={(event) => setStatusFilter(event.target.value)}>
                                <option value="Alle">Status</option>
                                {PAGE_STATUSES.map((status) => <option key={status}>{status}</option>)}
                            </select>
                            <select value={typeFilter} aria-label="Nach Seitentyp filtern" onChange={(event) => setTypeFilter(event.target.value)}>
                                <option value="Alle">Typ</option>
                                {PAGE_TYPES.map((type) => <option key={type}>{type}</option>)}
                            </select>
                            <select value={ownerFilter} aria-label="Nach Verantwortlichem filtern" onChange={(event) => setOwnerFilter(event.target.value)}>
                                <option value="Alle">Owner</option>
                                {owners.map((owner) => <option key={owner}>{owner}</option>)}
                            </select>
                            <select value={importanceFilter} aria-label="Nach SEO-Relevanz filtern" onChange={(event) => setImportanceFilter(event.target.value)}>
                                <option value="Alle">SEO</option>
                                {SEO_IMPORTANCE_LEVELS.map((level) => <option key={level}>{level}</option>)}
                            </select>
                            {activeFilterCount > 0 && <button className="filter-reset" onClick={clearFilters}>{activeFilterCount} Filter ×</button>}
                        </>
                    )}
                    <button className={issues.length ? 'issue-button has-issues' : 'issue-button'} onClick={() => setShowIssues(!showIssues)} title="Qualitätsprüfung">
                        <AlertTriangle size={14}/>{issues.length}
                    </button>
                    <div className="layout-controls" aria-label="Ansicht">
                        <button className={view === 'canvas' ? 'active' : ''} aria-label="Canvas" onClick={() => setView('canvas')}><Network size={15}/></button>
                        <button className={view === 'table' ? 'active' : ''} aria-label="Tabelle" onClick={() => setView('table')}><Table2 size={15}/></button>
                    </div>
                    {view === 'canvas' && (
                        <>
                            <div className="layout-controls" aria-label="Darstellung">
                                <button
                                    className={layoutDirection === 'horizontal' ? 'active' : ''}
                                    aria-label="Horizontal darstellen"
                                    title="Horizontal darstellen"
                                    onClick={() => onLayoutDirectionChange('horizontal')}
                                >
                                    <Rows3 size={15}/>
                                </button>
                                <button
                                    className={layoutDirection === 'vertical' ? 'active' : ''}
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
                            <div className="zoom-controls">
                                <button
                                    aria-label="Verkleinern"
                                    onClick={() => onZoomChange(Math.max(0.55, zoom - 0.1))}
                                >
                                    <Minus size={14}/>
                                </button>
                                <span>{Math.round(zoom * 100)}%</span>
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
                <div className="sitemap-table-wrap">
                    {selectedRows.length > 0 && (
                        <div className="bulk-toolbar">
                            <strong>{selectedRows.length} ausgewählt</strong>
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
                    <table className="sitemap-table">
                        <thead><tr>
                            <th className="select-column"><input type="checkbox" aria-label="Alle sichtbaren Seiten auswählen" checked={visibleNodes.length > 0 && visibleNodes.every((node) => selectedRows.includes(node.id))} onChange={(event) => setSelectedRows(event.target.checked ? visibleNodes.map((node) => node.id) : [])}/></th>
                            {([['title', 'Seite'], ['slug', 'URL'], ['pageType', 'Typ'], ['status', 'Status'], ['owner', 'Owner']] as [keyof SitemapNode, string][]).map(([key, label]) => <th key={key} onClick={() => toggleSort(key)}>{label}{sort.key === key ? (sort.direction === 1 ? ' ↑' : ' ↓') : ''}</th>)}
                            <th>Prüfung</th>
                        </tr></thead>
                        <tbody>{visibleNodes.map((node) => (
                            <tr key={node.id} className={selectedId === node.id ? 'selected' : ''} onClick={() => onSelectNode(node.id)}>
                                <td onClick={(event) => event.stopPropagation()}><input type="checkbox" checked={selectedRows.includes(node.id)} onChange={(event) => setSelectedRows((current) => event.target.checked ? [...current, node.id] : current.filter((id) => id !== node.id))}/></td>
                                <td><input value={node.title} aria-label={`Titel von ${node.title}`} onClick={(event) => event.stopPropagation()} onChange={(event) => onUpdateNode(node.id, 'title', event.target.value)}/></td>
                                <td><input value={node.slug} aria-label={`URL von ${node.title}`} onClick={(event) => event.stopPropagation()} onChange={(event) => onUpdateNode(node.id, 'slug', event.target.value)}/></td>
                                <td><select value={node.pageType} onClick={(event) => event.stopPropagation()} onChange={(event) => onUpdateNode(node.id, 'pageType', event.target.value as SitemapNode['pageType'])}>{PAGE_TYPES.map((type) => <option key={type}>{type}</option>)}</select></td>
                                <td><select value={node.status} onClick={(event) => event.stopPropagation()} onChange={(event) => onUpdateNode(node.id, 'status', event.target.value as SitemapNode['status'])}>{PAGE_STATUSES.map((status) => <option key={status}>{status}</option>)}</select></td>
                                <td><input value={node.owner} aria-label={`Owner von ${node.title}`} onClick={(event) => event.stopPropagation()} onChange={(event) => onUpdateNode(node.id, 'owner', event.target.value)}/></td>
                                <td>{issues.filter((issue) => issue.nodeId === node.id).length || '✓'}</td>
                            </tr>
                        ))}</tbody>
                    </table>
                </div>
            ) : <div
                className="canvas-scroll"
                onWheel={zoomByWheel}
                onClick={() => onSelectNode('')}
            >
                <div
                    className="canvas-world"
                    style={{
                        width: layout.width,
                        height: layout.height,
                        transform: `scale(${zoom})`,
                    }}
                >
                    <svg
                        className="connections"
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
                <section className="issues-panel" aria-label="Qualitätsprüfung">
                    <div
                        className="tool-window-resizer"
                        role="separator"
                        aria-label="Höhe der Qualitätsprüfung ändern"
                        aria-orientation="horizontal"
                        onPointerDown={startIssuesResize}
                    />
                    <header>
                        <div><AlertTriangle size={14}/><strong>Qualitätsprüfung</strong><span>{issues.length} Hinweise</span></div>
                        <button aria-label="Qualitätsprüfung schließen" onClick={() => setShowIssues(false)}><X size={14}/></button>
                    </header>
                    <div className="issues-list">
                        {issues.length === 0 ? <p>Keine Probleme gefunden.</p> : issues.map((issue, index) => {
                            const node = document.nodes.find((item) => item.id === issue.nodeId);
                            return <button key={`${issue.nodeId}-${index}`} onClick={() => onSelectNode(issue.nodeId)}><i className={issue.level}/><b>{node?.title}</b><span>{issue.message}</span><em>{issue.level === 'error' ? 'Fehler' : 'Warnung'}</em></button>;
                        })}
                    </div>
                </section>
            )}

            <div className="statusbar">
                <span className="status-indicator"/>
                {message}
                <span className="file-path">
                    {currentPath || 'Noch keine .smap-Datei'}
                </span>
            </div>
        </main>
    );
}
