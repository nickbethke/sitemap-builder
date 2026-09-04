import {AccordionSection} from '@/components/sitemap/AccordionSection.tsx';
import {Button} from '@/components/ui/button.tsx';
import {Checkbox} from '@/components/ui/checkbox.tsx';
import {Input} from '@/components/ui/input.tsx';
import {Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select.tsx';
import {Textarea} from '@/components/ui/textarea.tsx';
import {useTranslation} from '@/lib/i18n/context.tsx';
import {
    PAGE_STATUSES,
    PAGE_TYPES,
    SEO_IMPORTANCE_LEVELS,
    type PageStatus,
    type PageType,
    type SeoImportance,
    type SitemapNode,
    type SitemapProject,
    type UpdateNode,
} from '@/lib/sitemap.ts';
import {ArrowDown, ArrowUp, CircleHelp, Copy, Trash2} from 'lucide-react';
import type React from 'react';

type InspectorProps = {
    selectedNode: SitemapNode | null;
    project: SitemapProject;
    onProjectChange: (project: SitemapProject) => void;
    canMoveUp: boolean;
    canMoveDown: boolean;
    onUpdateNode: UpdateNode;
    onMoveUp: () => void;
    onMoveDown: () => void;
    onDuplicate: () => void;
    onDelete: () => void;
};

const inspectorClass = 'col-start-2 grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] border-l border-border bg-[hsl(var(--panel))]';
const eyebrowClass = 'block text-[9px] font-bold uppercase tracking-widest text-muted-foreground';
const formGroupClass = 'flex flex-col gap-3';
const labelClass = 'flex flex-col gap-1.5 text-[10px] font-semibold text-muted-foreground';
const fieldClass = 'h-9 rounded-md border border-input bg-background px-2 text-xs font-normal text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/15';
const textareaClass = `${fieldClass} h-auto min-h-16 resize-y py-2 leading-relaxed`;
const formGridClass = 'grid grid-cols-2 gap-x-2.5 gap-y-3';

export function Inspector({
    selectedNode,
    project,
    onProjectChange,
    canMoveUp,
    canMoveDown,
    onUpdateNode,
    onMoveUp,
    onMoveDown,
    onDuplicate,
    onDelete,
}: InspectorProps) {
    const {t} = useTranslation();

    if (!selectedNode) {
        return (
            <aside className={inspectorClass}>
                <div className="flex items-start justify-between border-b border-border px-5 pb-4 pt-5">
                    <div>
                        <span className={eyebrowClass}>{t('inspector.noPageSelected')}</span>
                        <h2 className="mb-0 mt-1 text-base tracking-tight">{t('inspector.projectSettings')}</h2>
                    </div>
                </div>

                <div className="overflow-y-auto">
                    <AccordionSection title={t('inspector.section.project')} defaultOpen>
                        <div className={formGroupClass}>
                            <label className={labelClass}>
                                {t('inspector.client')}
                                <Input
                                    className={fieldClass}
                                    value={project.client}
                                    onChange={(event) => onProjectChange({...project, client: event.target.value})}
                                />
                            </label>
                            <label className={labelClass}>
                                {t('inspector.baseUrl')}
                                <Input
                                    className={fieldClass}
                                    value={project.baseUrl}
                                    onChange={(event) => onProjectChange({...project, baseUrl: event.target.value})}
                                />
                            </label>
                        </div>
                    </AccordionSection>

                    <AccordionSection title={t('inspector.section.seoImportance')} defaultOpen>
                        <div className="flex flex-col gap-2 text-[10px] text-muted-foreground [&>span]:flex [&>span]:items-center [&>span]:gap-2">
                            <span>
                                <i className="size-2 rounded-full bg-primary shadow-[0_0_0_3px_hsl(var(--primary)/.12)]"/>
                                {t('seoImportance.high')}
                            </span>
                            <span>
                                <i className="size-2 rounded-full bg-amber-500 shadow-[0_0_0_3px_rgb(227_155_57_/_0.12)]"/>
                                {t('seoImportance.medium')}
                            </span>
                            <span>
                                <i className="size-2 rounded-full bg-[hsl(var(--success))] shadow-[0_0_0_3px_hsl(var(--success)/.12)]"/>
                                {t('seoImportance.low')}
                            </span>
                            <span>
                                <i className="size-2 rounded-full bg-muted-foreground/40"/>
                                {t('seoImportance.none')}
                            </span>
                        </div>
                    </AccordionSection>
                </div>

                <div className="flex gap-2 border-t border-border bg-[hsl(var(--panel))] px-5 py-3 text-muted-foreground">
                    <CircleHelp className="mt-px shrink-0 text-primary" size={17}/>
                    <p className="m-0 text-[10px] leading-relaxed">
                        <strong className="block text-foreground">{t('inspector.dragDrop.title')}</strong>
                        {t('inspector.dragDrop.description')}
                    </p>
                </div>
            </aside>
        );
    }

    return (
        <aside className={inspectorClass}>
            <div className="flex items-start justify-between border-b border-border px-5 pb-4 pt-5">
                <div>
                    <span className={eyebrowClass}>{t('inspector.pageDetails')}</span>
                    <h2 className="mb-0 mt-1 max-w-52 truncate text-base tracking-tight">
                        {selectedNode.title || t('export.untitled')}
                    </h2>
                </div>
            </div>

            <div className="overflow-y-auto">
                <AccordionSection title={t('inspector.section.page')} defaultOpen>
                    <div className={formGroupClass}>
                        <label className={labelClass}>
                            <span className="inline-flex items-baseline gap-1">
                                {t('inspector.title')} <b className="text-destructive">*</b>
                            </span>
                            <Input
                                className={fieldClass}
                                value={selectedNode.title}
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) => onUpdateNode('title', event.target.value)}
                            />
                        </label>
                        <label className={labelClass}>
                            <span className="inline-flex items-baseline gap-1">
                                {t('inspector.slugUrl')} <b className="text-destructive">*</b>
                            </span>
                            <Input
                                className={fieldClass}
                                value={selectedNode.slug}
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) => onUpdateNode('slug', event.target.value)}
                            />
                        </label>
                        <label className={labelClass}>
                            {t('inspector.description')}
                            <Textarea
                                className={textareaClass}
                                value={selectedNode.description}
                                rows={3}
                                onChange={(event) => onUpdateNode('description', event.target.value)}
                            />
                        </label>
                    </div>

                    <div className={formGridClass}>
                        <label className={labelClass}>
                            {t('inspector.pageType')}
                            <Select value={selectedNode.pageType} onValueChange={(value) => onUpdateNode('pageType', value as PageType)}>
                                <SelectTrigger className={`${fieldClass} w-full`}>
                                    <SelectValue/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                    {PAGE_TYPES.map((item: PageType) => <SelectItem key={item} value={item}>{t(`pageType.${item}`)}</SelectItem>)}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </label>
                        <label className={labelClass}>
                            {t('inspector.status')}
                            <Select value={selectedNode.status} onValueChange={(value) => onUpdateNode('status', value as PageStatus)}>
                                <SelectTrigger className={`${fieldClass} w-full`}>
                                    <SelectValue/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                    {PAGE_STATUSES.map((item: PageStatus) => <SelectItem key={item} value={item}>{t(`pageStatus.${item}`)}</SelectItem>)}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </label>
                        <label className={labelClass}>
                            {t('inspector.owner')}
                            <Input
                                className={fieldClass}
                                value={selectedNode.owner}
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) => onUpdateNode('owner', event.target.value)}
                            />
                        </label>
                    </div>

                    <label className="flex flex-row items-start gap-2 rounded-lg border border-border bg-muted/40 p-3 text-[10px] font-semibold text-muted-foreground">
                        <Checkbox
                            className="mt-px"
                            checked={selectedNode.showInMainNavigation !== false}
                            onCheckedChange={(checked) => onUpdateNode('showInMainNavigation', checked === true)}
                        />
                        <span className="block">
                            <strong className="block text-[10px] text-foreground">{t('inspector.mainNavigation.title')}</strong>
                            <small className="mt-0.5 block font-normal leading-snug">{t('inspector.mainNavigation.description')}</small>
                        </span>
                    </label>
                </AccordionSection>

                <AccordionSection title={t('inspector.section.seo')} defaultOpen>
                    <div className={formGroupClass}>
                        <label className={labelClass}>
                            {t('inspector.seoTitle')}
                            <Input
                                className={fieldClass}
                                value={selectedNode.seoTitle ?? ''}
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) => onUpdateNode('seoTitle', event.target.value)}
                            />
                        </label>
                        <label className={labelClass}>
                            {t('inspector.seoDescription')}
                            <Textarea
                                className={textareaClass}
                                value={selectedNode.seoDescription ?? ''}
                                rows={3}
                                onChange={(event) => onUpdateNode('seoDescription', event.target.value)}
                            />
                        </label>
                    </div>

                    <div className={formGridClass}>
                        <label className={labelClass}>
                            {t('inspector.seoRelevance')}
                            <Select value={selectedNode.seoImportance} onValueChange={(value) => onUpdateNode('seoImportance', value as SeoImportance)}>
                                <SelectTrigger className={`${fieldClass} w-full`}>
                                    <SelectValue/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                    {SEO_IMPORTANCE_LEVELS.map((item: SeoImportance) => <SelectItem key={item} value={item}>{t(`seoImportance.${item}`)}</SelectItem>)}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </label>
                    </div>

                    <label className="flex flex-row items-start gap-2 rounded-lg border border-border bg-muted/40 p-3 text-[10px] font-semibold text-muted-foreground">
                        <Checkbox
                            className="mt-px"
                            checked={selectedNode.noIndex}
                            onCheckedChange={(checked) => onUpdateNode('noIndex', checked === true)}
                        />
                        <span className="block">
                            <strong className="block text-[10px] text-foreground">{t('inspector.noIndex.title')}</strong>
                            <small className="mt-0.5 block font-normal leading-snug">{t('inspector.noIndex.description')}</small>
                        </span>
                    </label>
                </AccordionSection>

                <AccordionSection title={t('inspector.section.advanced')}>
                    <div className={formGroupClass}>
                        <label className={labelClass}>
                            {t('inspector.template')}
                            <Input
                                className={fieldClass}
                                value={selectedNode.template}
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) => onUpdateNode('template', event.target.value)}
                            />
                        </label>
                        <label className={labelClass}>
                            {t('inspector.redirectFrom')}
                            <Input
                                className={fieldClass}
                                value={selectedNode.redirectFrom ?? ''}
                                placeholder="/alte-url"
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) => onUpdateNode('redirectFrom', event.target.value)}
                            />
                        </label>
                        <label className={labelClass}>
                            {t('inspector.notes')}
                            <Textarea
                                className={textareaClass}
                                value={selectedNode.notes}
                                rows={3}
                                onChange={(event) => onUpdateNode('notes', event.target.value)}
                            />
                        </label>
                    </div>
                </AccordionSection>
            </div>

            <div className="flex gap-2 border-t border-border bg-[hsl(var(--panel))] px-5 py-3 [&_button]:h-9 [&_button]:gap-2 [&_button]:text-[10px]">
                <Button variant="outline" size="icon" aria-label={t('inspector.moveUpAria')} title={t('inspector.moveUp')} disabled={!canMoveUp} onClick={onMoveUp}>
                    <ArrowUp size={15}/>
                </Button>
                <Button variant="outline" size="icon" aria-label={t('inspector.moveDownAria')} title={t('inspector.moveDown')} disabled={!canMoveDown} onClick={onMoveDown}>
                    <ArrowDown size={15}/>
                </Button>
                <Button className="flex-1" variant="outline" size="sm" onClick={onDuplicate}>
                    <Copy size={15}/>
                    {t('inspector.duplicate')}
                </Button>
                <Button variant="outline" size="sm" aria-label={t('common.delete')} title={t('common.delete')} disabled={selectedNode.parentId === null} onClick={onDelete}>
                    <Trash2 size={15}/>
                </Button>
            </div>
        </aside>
    );
}
