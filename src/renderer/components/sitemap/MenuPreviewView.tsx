import {Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select.tsx';
import {useTranslation} from '@/lib/i18n/context.tsx';
import type {SitemapDocument, SitemapNode} from '@/lib/sitemap.ts';
import {ChevronDown, ChevronRight, Monitor, Smartphone} from 'lucide-react';
import {useMemo, useState} from 'react';

export type MenuType = 'dropdown' | 'mega' | 'accordion';

type MenuPreviewViewProps = {
    document: SitemapDocument;
    depth: number;
    menuType: MenuType;
    onDepthChange: (depth: number) => void;
    onMenuTypeChange: (type: MenuType) => void;
};

function childrenOf(nodes: SitemapNode[], parentId: string | null) {
    return nodes.filter((node) => node.parentId === parentId && node.showInMainNavigation !== false);
}

function DesktopMenu({nodes, allNodes, depth, activeId, onActivate}: {nodes: SitemapNode[]; allNodes: SitemapNode[]; depth: number; activeId: string | null; onActivate: (id: string) => void}) {
    return <ul className="flex items-center gap-2">
        {nodes.map((node) => {
            const children = depth > 1 ? childrenOf(allNodes, node.id) : [];
            const active = activeId === node.id;
            return <li key={node.id}><button type="button" onClick={() => onActivate(node.id)} className={active ? 'flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary shadow-sm transition-colors' : 'flex items-center gap-1 rounded-md px-2 py-1 text-[10px] text-foreground transition-colors hover:bg-muted hover:text-primary'}>{node.title}{children.length > 0 && <ChevronDown className={active ? 'size-3 shrink-0 stroke-[2.5] text-primary' : 'size-3 shrink-0 stroke-[2.5] text-muted-foreground'}/>} </button></li>;
        })}
    </ul>;
}

function PreviewBranch({nodes, parentId, level, maxDepth}: {nodes: SitemapNode[]; parentId: string; level: number; maxDepth: number}) {
    const children = level <= maxDepth ? childrenOf(nodes, parentId) : [];
    return <ul className={level === 2 ? 'space-y-1' : 'ml-2 mt-1 space-y-1 border-l border-border pl-2'}>{children.map((node) => <li key={node.id}><span className="flex items-center gap-1 text-[9px] text-foreground"><span className="truncate">{node.title}</span>{level < maxDepth && childrenOf(nodes, node.id).length > 0 && <ChevronRight className="size-2.5 text-muted-foreground"/>}</span>{level < maxDepth && <PreviewBranch nodes={nodes} parentId={node.id} level={level + 1} maxDepth={maxDepth}/>}</li>)}</ul>;
}

function MobileBranch({nodes, parentId, level, maxDepth}: {nodes: SitemapNode[]; parentId: string | null; level: number; maxDepth: number}) {
    const children = childrenOf(nodes, parentId);
    const [expanded, setExpanded] = useState<Set<string>>(() => new Set(children.slice(0, 1).map((node) => node.id)));
    return <ul className={level === 1 ? 'divide-y divide-border' : 'mt-1 space-y-1 border-l border-border pl-3'}>{children.map((node) => {
        const subPages = level < maxDepth ? childrenOf(nodes, node.id) : [];
        const isExpanded = expanded.has(node.id);
        return <li className={level === 1 ? 'py-2.5' : ''} key={node.id}><button type="button" disabled={subPages.length === 0} onClick={() => setExpanded((current) => {const next = new Set(current); if (next.has(node.id)) next.delete(node.id); else next.add(node.id); return next;})} className="flex w-full items-center justify-between gap-2 text-left text-[10px] font-medium text-foreground disabled:cursor-default"><span className="truncate">{node.title}</span>{subPages.length > 0 && <ChevronRight className={isExpanded ? 'size-3 rotate-90 text-primary transition-transform' : 'size-3 text-muted-foreground transition-transform'}/>}</button>{isExpanded && subPages.length > 0 && <MobileBranch nodes={nodes} parentId={node.id} level={level + 1} maxDepth={maxDepth}/>}</li>;
    })}</ul>;
}

export function MenuPreviewView({document, depth, menuType, onDepthChange, onMenuTypeChange}: MenuPreviewViewProps) {
    const {t} = useTranslation();
    const [activeId, setActiveId] = useState<string | null>(null);
    const nodes = useMemo(() => document.nodes.filter((node) => node.showInMainNavigation !== false), [document.nodes]);
    const root = document.nodes.find((node) => node.parentId === null);
    const topNodes = useMemo(() => root ? childrenOf(nodes, root.id) : nodes.filter((node) => node.parentId === null), [nodes, root]);
    const activeNode = topNodes.find((node) => node.id === activeId) ?? topNodes[0];
    const activeChildren = activeNode && depth > 1 ? childrenOf(nodes, activeNode.id) : [];

    return <section className="min-h-0 overflow-auto bg-[hsl(var(--canvas))] p-6"><div className="mx-auto max-w-6xl"><header className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{t('menuPreview.eyebrow')}</span><h2 className="mt-1 text-lg font-semibold tracking-tight">{t('menuPreview.title')}</h2><p className="mt-1 text-xs text-muted-foreground">{t('menuPreview.description')}</p></div><div className="flex items-center gap-2"><Select value={String(depth)} onValueChange={(value) => onDepthChange(Number(value))}><SelectTrigger className="h-8 w-34 text-[10px]" aria-label={t('menuPreview.depth')}><SelectValue/></SelectTrigger><SelectContent><SelectGroup>{[2, 3, 4].map((value) => <SelectItem key={value} value={String(value)}>{t('menuPreview.depthValue', {count: value})}</SelectItem>)}</SelectGroup></SelectContent></Select><Select value={menuType} onValueChange={(value) => onMenuTypeChange(value as MenuType)}><SelectTrigger className="h-8 w-34 text-[10px]" aria-label={t('menuPreview.menuType')}><SelectValue/></SelectTrigger><SelectContent><SelectGroup><SelectItem value="dropdown">{t('menuPreview.typeDropdown')}</SelectItem><SelectItem value="mega">{t('menuPreview.typeMega')}</SelectItem><SelectItem value="accordion">{t('menuPreview.typeAccordion')}</SelectItem></SelectGroup></SelectContent></Select></div></header><div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]"><article className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"><div className="flex h-7 items-center gap-1 border-b border-border bg-muted/60 px-3"><i className="size-1.5 rounded-full bg-red-400"/><i className="size-1.5 rounded-full bg-amber-400"/><i className="size-1.5 rounded-full bg-emerald-400"/><span className="ml-2 text-[8px] text-muted-foreground">{document.project.baseUrl || 'website.de'}</span><Monitor className="ml-auto size-3 text-muted-foreground"/></div><div className="min-h-85 bg-background p-5"><div className="flex items-center justify-between border-b border-border pb-4"><div className="flex items-center gap-2"><i className="grid size-6 place-items-center rounded-md bg-primary text-[9px] font-bold text-primary-foreground">M</i><span className="text-[10px] font-semibold tracking-tight text-foreground">Logo</span></div><div className="hidden md:block"><DesktopMenu nodes={topNodes} allNodes={nodes} depth={depth} activeId={activeNode?.id ?? null} onActivate={setActiveId}/></div></div>{menuType === 'mega' && activeNode && <div className="mt-4 grid grid-cols-2 gap-5 rounded-lg border border-border bg-muted/35 p-4 md:grid-cols-3"><div><strong className="text-xs">{activeNode.title}</strong><p className="mt-1 text-[9px] text-muted-foreground">{activeNode.description || activeNode.slug}</p></div>{activeChildren.map((node) => <div key={node.id}><strong className="text-[10px]">{node.title}</strong>{depth > 2 && <PreviewBranch nodes={nodes} parentId={node.id} level={3} maxDepth={depth}/>}</div>)}</div>}{menuType === 'dropdown' && activeNode && <div className="mt-4 w-52 rounded-lg border border-border bg-card p-3 shadow-md"><strong className="mb-2 block text-[10px]">{activeNode.title}</strong><PreviewBranch nodes={nodes} parentId={activeNode.id} level={2} maxDepth={depth}/></div>}{menuType === 'accordion' && <div className="mt-4 w-64 rounded-lg border border-border bg-card p-3 shadow-md"><MobileBranch nodes={nodes} parentId={root?.id ?? null} level={1} maxDepth={depth}/></div>}</div><footer className="border-t border-border bg-muted/30 px-4 py-2 text-[9px] text-muted-foreground">{t('menuPreview.demoNote')}</footer></article><article className="mx-auto w-full max-w-60 overflow-hidden rounded-[1.8rem] border-6 border-foreground bg-card p-1 shadow-xl"><div className="flex h-5 items-center justify-center"><i className="h-1 w-10 rounded-full bg-foreground"/></div><div className="min-h-105 bg-background px-4 pb-4 pt-3"><div className="flex items-center justify-between border-b border-border pb-3"><strong className="text-[11px]">{document.project.name}</strong><Smartphone className="size-3.5 text-muted-foreground"/></div><div className="pt-2"><MobileBranch nodes={nodes} parentId={root?.id ?? null} level={1} maxDepth={depth}/></div></div><footer className="border-t border-border bg-muted/30 px-3 py-2 text-center text-[8px] text-muted-foreground">{t('menuPreview.mobile')}</footer></article></div></div></section>;
}
