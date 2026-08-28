import {Badge} from '@/components/ui/badge.tsx';
import {Button} from '@/components/ui/button.tsx';
import {useTranslation} from '@/lib/i18n/context.tsx';
import {cn} from '@/lib/utils.ts';
import {ChevronDown, ChevronRight, GripVertical} from 'lucide-react';
import {type DragEvent, useMemo, useState} from 'react';
import type {SitemapDocument, SitemapNode} from '@/lib/sitemap.ts';

type TreeViewProps = {
    document: SitemapDocument;
    selectedId: string;
    onSelectNode: (id: string) => void;
    onMoveNode: (event: DragEvent<HTMLElement>, parentId: string) => void;
    canMoveTo: (nodeId: string, parentId: string) => boolean;
    onDraggedNodeChange: (id: string | null) => void;
    onDropTargetChange: (id: string | null) => void;
    draggedId: string | null;
    dropTargetId: string | null;
};

export function TreeView({document, selectedId, onSelectNode, onMoveNode, canMoveTo, onDraggedNodeChange, onDropTargetChange, draggedId, dropTargetId}: TreeViewProps) {
    const {t} = useTranslation();
    const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
    const children = useMemo(() => {
        const map = new Map<string | null, SitemapNode[]>();
        document.nodes.forEach((node) => map.set(node.parentId, [...(map.get(node.parentId) ?? []), node]));
        return map;
    }, [document.nodes]);

    const renderNode = (node: SitemapNode, depth: number) => {
        const childNodes = children.get(node.id) ?? [];
        const isCollapsed = collapsed.has(node.id);
        return <li key={node.id}>
            <div
                className={cn('flex h-10 items-center gap-2 border-b border-border px-3 text-xs hover:bg-accent/60', selectedId === node.id && 'bg-accent/70', dropTargetId === node.id && 'bg-primary/10 ring-1 ring-inset ring-primary')}
                style={{paddingLeft: 12 + depth * 22}}
                draggable={node.parentId !== null}
                onDragStart={(event) => { onDraggedNodeChange(node.id); event.dataTransfer.effectAllowed = 'move'; }}
                onDragEnd={() => { onDraggedNodeChange(null); onDropTargetChange(null); }}
                onDragOver={(event) => { if (draggedId && canMoveTo(draggedId, node.id)) { event.preventDefault(); onDropTargetChange(node.id); } }}
                onDragLeave={() => onDropTargetChange(null)}
                onDrop={(event) => onMoveNode(event, node.id)}
                onClick={() => onSelectNode(node.id)}
            >
                <GripVertical className="shrink-0 text-muted-foreground" size={14}/>
                {childNodes.length > 0 ? <Button variant="ghost" size="icon" className="size-5" aria-label={isCollapsed ? t('tree.expand') : t('tree.collapse')} onClick={(event) => { event.stopPropagation(); setCollapsed((current) => { const next = new Set(current); isCollapsed ? next.delete(node.id) : next.add(node.id); return next; }); }}>{isCollapsed ? <ChevronRight size={14}/> : <ChevronDown size={14}/>}</Button> : <span className="w-5"/>}
                <span className="min-w-0 flex-1 truncate font-medium">{node.title || t('export.untitled')}</span>
                <span className="hidden truncate text-[10px] text-muted-foreground sm:block">{node.slug}</span>
                <Badge variant="outline" className="text-[8px]">{t(`pageStatus.${node.status}`)}</Badge>
            </div>
            {!isCollapsed && childNodes.length > 0 && <ul>{childNodes.map((child) => renderNode(child, depth + 1))}</ul>}
        </li>;
    };

    return <div className="min-h-0 overflow-auto p-4"><ul className="overflow-hidden rounded-lg border border-border bg-card">{(children.get(null) ?? []).map((node) => renderNode(node, 0))}</ul></div>;
}
