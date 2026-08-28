import {Badge} from '@/components/ui/badge.tsx';
import {useTranslation} from '@/lib/i18n/context.tsx';
import {cn} from '@/lib/utils.ts';
import {type DragEvent, useState} from 'react';
import {PAGE_STATUSES, type PageStatus, type SitemapNode} from '@/lib/sitemap.ts';

type KanbanViewProps = {
    nodes: SitemapNode[];
    selectedId: string;
    onSelectNode: (id: string) => void;
    onUpdateStatus: (nodeId: string, status: PageStatus) => void;
};

export function KanbanView({nodes, selectedId, onSelectNode, onUpdateStatus}: KanbanViewProps) {
    const {t} = useTranslation();
    const [draggedId, setDraggedId] = useState<string | null>(null);

    const drop = (event: DragEvent<HTMLElement>, status: PageStatus) => {
        event.preventDefault();
        if (draggedId) onUpdateStatus(draggedId, status);
        setDraggedId(null);
    };

    return <div className="min-h-0 overflow-auto p-4"><div className="grid min-w-240 grid-cols-4 gap-3">
        {PAGE_STATUSES.map((status) => {
            const columnNodes = nodes.filter((node) => node.status === status);
            return <section key={status} className="flex min-h-80 flex-col rounded-lg border border-border bg-muted/35" onDragOver={(event) => event.preventDefault()} onDrop={(event) => drop(event, status)}>
                <header className="flex items-center justify-between border-b border-border px-3 py-2">
                    <strong className="text-xs">{t(`pageStatus.${status}`)}</strong>
                    <span className="text-[10px] text-muted-foreground">{columnNodes.length}</span>
                </header>
                <div className={cn('min-h-20 flex-1 space-y-2 p-2', draggedId && 'bg-primary/5')}>
                    {columnNodes.map((node) => <article key={node.id} draggable onDragStart={() => setDraggedId(node.id)} onDragEnd={() => setDraggedId(null)} onClick={() => onSelectNode(node.id)} className={cn('cursor-grab rounded-md border border-border bg-card p-3 shadow-sm active:cursor-grabbing', selectedId === node.id && 'border-primary ring-1 ring-primary/25')}>
                        <div className="mb-1 flex items-center justify-between gap-2"><strong className="min-w-0 truncate text-xs">{node.title || t('export.untitled')}</strong><Badge variant="outline" className="shrink-0 text-[7px]">{t(`seoImportance.${node.seoImportance}`)}</Badge></div>
                        <p className="truncate text-[10px] text-primary">{node.slug}</p>
                        {node.owner && <p className="mt-2 text-[9px] text-muted-foreground">{node.owner}</p>}
                    </article>)}
                </div>
            </section>;
        })}
    </div></div>;
}
