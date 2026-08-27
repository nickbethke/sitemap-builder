import {CardContextMenu} from '@/components/sitemap/CardContextMenu.tsx';
import {
    CARD_HEIGHT,
    CARD_WIDTH,
    type LayoutDirection,
    type SitemapDocument,
    type SitemapLayout,
    type SitemapNode,
} from '@/lib/sitemap.ts';
import {cn} from '@/lib/utils.ts';
import {ChevronDown, Link2} from 'lucide-react';
import {type DragEvent} from 'react';

const badgeClass = 'inline-flex h-5 items-center rounded-full px-2 text-[8px] font-bold uppercase tracking-wide';
const importanceClasses = {
    Hoch: 'bg-blue-600/10 text-blue-600 dark:text-cyan-300',
    Mittel: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
    Niedrig: 'bg-emerald-600/15 text-emerald-700 dark:text-emerald-300',
} satisfies Record<SitemapNode['seoImportance'], string>;

export function connectionPath(
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

export function SitemapCard({
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
