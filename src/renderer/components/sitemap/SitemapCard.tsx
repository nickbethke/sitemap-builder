import {CardContextMenu} from '@/components/sitemap/CardContextMenu.tsx';
import {Badge} from '@/components/ui/badge.tsx';
import {Card} from '@/components/ui/card.tsx';
import {useTranslation} from '@/lib/i18n/context.tsx';
import {
    CARD_WIDTH,
    type LayoutDirection,
    type SeoImportance,
    type SitemapDocument,
    type SitemapLayout,
    type SitemapNode,
} from '@/lib/sitemap.ts';
import {cn} from '@/lib/utils.ts';
import {type DragEvent, useEffect, useRef} from 'react';
import {nl2br} from "@/lib/manipulate.tsx";

const badgeClass = 'py-0.75 px-1.5 text-[6px] uppercase tracking-wide leading-none';
const seoBadgeStyles: Record<SeoImportance, string> = {
    'high': 'border-destructive/25 text-destructive/80',
    'medium': 'border-amber-500/25 text-amber-700 dark:text-amber-400',
    'low': 'border-border text-muted-foreground',
    'none': 'border-border/60 text-muted-foreground/50',
};

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
        const y1 = from.y + layout.cardSizes[node.parentId].height / 2;
        const x2 = to.x;
        const y2 = to.y + layout.cardSizes[node.id].height / 2;

        return `M ${x1} ${y1} C ${x1 + 52} ${y1}, ${x2 - 52} ${y2}, ${x2} ${y2}`;
    }

    const x1 = from.x + CARD_WIDTH / 2;
    const y1 = from.y + layout.cardSizes[node.parentId].height;
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
    onSizeChange: (nodeId: string, height: number) => void;
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
                                onSizeChange,
                            }: SitemapCardProps) {
    const {t} = useTranslation();
    const cardRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const card = cardRef.current;
        if (!card) return;
        const observer = new ResizeObserver(([entry]) => onSizeChange(node.id, entry.borderBoxSize[0]?.blockSize ?? entry.contentRect.height));
        observer.observe(card);
        return () => observer.disconnect();
    }, [node.id, onSizeChange]);
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
        'absolute flex w-59 cursor-grab select-none flex-col rounded-lg border border-border bg-card shadow-sm transition-[left,top,border-color,box-shadow,opacity,transform] duration-200 hover:border-primary/55 active:cursor-grabbing',
        selected && 'border-primary ring-2 ring-primary/15',
        dropTarget && 'scale-[1.035] border-[hsl(var(--success))] ring-3 ring-[hsl(var(--success)/.15)]',
        dimmed && 'opacity-20',
    );

    return (
        <Card
            ref={cardRef}
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
            <div className="flex shrink-0 items-center gap-1 border-b border-border bg-muted/50 px-2 py-1.5">
                <i className="size-1.5 rounded-full bg-red-400/70"/>
                <i className="size-1.5 rounded-full bg-amber-400/70"/>
                <i className="size-1.5 rounded-full bg-emerald-400/70"/>
            </div>

            <div className="flex flex-col px-3.5 py-3.5">
                <div className="flex items-center justify-between mb-1">
                    <div className="flex min-w-0 items-center gap-1">
                        <Badge
                            className={cn(badgeClass, seoBadgeStyles[node.seoImportance])}
                            variant="outline"
                        >
                            {t(`seoImportance.${node.seoImportance}`)}
                        </Badge>
                        {node.noIndex &&
                            <Badge className={badgeClass} variant="destructive">{t('export.noIndexLabel')}</Badge>}
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

                <h3 className="mb-0.5 mt-1 text-sm font-medium leading-tight tracking-tight">{node.title || t('export.untitled')}</h3>
                <div className="flex items-center gap-1 text-[9px] text-primary">
                    {node.slug || '/'}
                </div>
                {node.description ?
                    <p className="mb-1 mt-2 text-[9px] leading-snug text-muted-foreground">{nl2br(node.description)}</p> :
                    <div className="mb-4"></div>}
                <footer
                    className="mt-auto flex items-center justify-between border-t border-border pt-2 text-[8px] text-muted-foreground">
                    <span>{t(`pageType.${node.pageType}`)}</span>
                    <span className="flex items-center gap-1">
                        <i className="size-1.5 rounded-full bg-[hsl(var(--success))]"/>
                        {t(`pageStatus.${node.status}`)}
                    </span>
                </footer>
            </div>

            {childCount > 0 && (
                <div className={cn(
                    'absolute -right-3 top-1/2 flex h-6 min-w-5 -translate-y-1/2 items-center justify-center gap-0 rounded-lg  border border-primary/30 bg-primary text-primary-foreground px-2 text-[9px] font-semibold shadow-sm [&_svg]:size-3 [&_svg]:shrink-0 [&_svg]:-rotate-90',
                    layoutDirection === 'vertical' && '-bottom-3 left-1/2 right-auto top-auto -translate-x-1/2 translate-y-0 [&_svg]:rotate-0',
                )}>
                    <span>{childCount}</span>
                </div>
            )}
        </Card>
    );
}
