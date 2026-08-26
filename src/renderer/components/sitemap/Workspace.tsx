import {CardContextMenu} from '@/components/sitemap/CardContextMenu.tsx';
import {Button} from '@/components/ui/button.tsx';
import {
    CARD_HEIGHT,
    CARD_WIDTH,
    importanceClass,
    layoutNodes,
    type LayoutDirection,
    type SitemapDocument,
    type SitemapLayout,
    type SitemapNode,
} from '@/lib/sitemap.ts';
import {
    ChevronDown,
    Columns3,
    Link2,
    Minus,
    Plus,
    Rows3,
    Search,
} from 'lucide-react';
import {type DragEvent, useMemo, type WheelEvent} from 'react';

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
}: WorkspaceProps) {
    const layout = useMemo(
        () => layoutNodes(document.nodes, layoutDirection),
        [document.nodes, layoutDirection],
    );
    const visibleNodeIds = useMemo(() => new Set(
        document.nodes
            .filter((node) => `${node.title} ${node.slug}`
                .toLowerCase()
                .includes(search.toLowerCase()))
            .map((node) => node.id),
    ), [document.nodes, search]);

    const zoomByWheel = (event: WheelEvent<HTMLDivElement>) => {
        if (!event.metaKey && !event.ctrlKey) return;

        event.preventDefault();
        const nextZoom = zoom + (event.deltaY < 0 ? 0.1 : -0.1);
        onZoomChange(Math.max(0.55, Math.min(1.25, nextZoom)));
    };

    return (
        <main className="workspace">
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
                </div>
            </div>

            <div
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
            </div>

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
