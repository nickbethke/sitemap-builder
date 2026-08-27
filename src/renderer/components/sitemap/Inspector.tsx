import {AccordionSection} from '@/components/sitemap/AccordionSection.tsx';
import {Button} from '@/components/ui/button.tsx';
import {Checkbox} from '@/components/ui/checkbox.tsx';
import {Input} from '@/components/ui/input.tsx';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select.tsx';
import {Textarea} from '@/components/ui/textarea.tsx';
import {
    PAGE_STATUSES,
    PAGE_TYPES,
    SEO_IMPORTANCE_LEVELS,
    type PageStatus,
    type PageType,
    type SeoImportance,
    type SitemapNode,
    type UpdateNode,
} from '@/lib/sitemap.ts';
import {ArrowDown, ArrowUp, Copy, LayoutDashboard, Trash2} from 'lucide-react';
import type React from 'react';

type InspectorProps = {
    selectedNode: SitemapNode | null;
    canMoveUp: boolean;
    canMoveDown: boolean;
    onUpdateNode: UpdateNode;
    onMoveUp: () => void;
    onMoveDown: () => void;
    onDuplicate: () => void;
    onDelete: () => void;
};

const inspectorClass = 'col-start-3 grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] border-l border-border bg-[hsl(var(--panel))]';
const eyebrowClass = 'block text-[9px] font-bold uppercase tracking-widest text-muted-foreground';
const formGroupClass = 'flex flex-col gap-3';
const labelClass = 'flex flex-col gap-1.5 text-[10px] font-semibold text-muted-foreground';
const fieldClass = 'h-9 rounded-md border border-input bg-background px-2 text-xs font-normal text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/15';
const textareaClass = `${fieldClass} h-auto min-h-16 resize-y py-2 leading-relaxed`;
const formGridClass = 'grid grid-cols-2 gap-x-2.5 gap-y-3';

export function Inspector({
    selectedNode,
    canMoveUp,
    canMoveDown,
    onUpdateNode,
    onMoveUp,
    onMoveDown,
    onDuplicate,
    onDelete,
}: InspectorProps) {
    if (!selectedNode) {
        return (
            <aside className={inspectorClass}>
                <div className="self-center p-10 text-center text-muted-foreground">
                    <LayoutDashboard className="mx-auto size-9 rounded-lg bg-accent p-2 text-primary"/>
                    <h2 className="mb-1 mt-3 text-sm text-foreground">Seite auswählen</h2>
                    <p className="m-0 text-[10px] leading-normal">
                        Karte anklicken, um Seitendetails zu bearbeiten.
                    </p>
                </div>
            </aside>
        );
    }

    return (
        <aside className={inspectorClass}>
            <div className="flex items-start justify-between border-b border-border px-5 pb-4 pt-5">
                <div>
                    <span className={eyebrowClass}>Seitendetails</span>
                    <h2 className="mb-0 mt-1 max-w-52 truncate text-base tracking-tight">
                        {selectedNode.title || 'Ohne Titel'}
                    </h2>
                </div>
            </div>

            <div className="overflow-y-auto">
                <AccordionSection title="Seite" defaultOpen>
                    <div className={formGroupClass}>
                        <label className={labelClass}>
                            <span className="inline-flex items-baseline gap-1">
                                Titel <b className="text-destructive">*</b>
                            </span>
                            <Input
                                className={fieldClass}
                                value={selectedNode.title}
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) => onUpdateNode('title', event.target.value)}
                            />
                        </label>
                        <label className={labelClass}>
                            <span className="inline-flex items-baseline gap-1">
                                Slug / URL <b className="text-destructive">*</b>
                            </span>
                            <Input
                                className={fieldClass}
                                value={selectedNode.slug}
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) => onUpdateNode('slug', event.target.value)}
                            />
                        </label>
                        <label className={labelClass}>
                            Beschreibung
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
                            Seitentyp
                            <Select value={selectedNode.pageType} onValueChange={(value) => onUpdateNode('pageType', value as PageType)}>
                                <SelectTrigger className={`${fieldClass} w-full`}>
                                    <SelectValue/>
                                </SelectTrigger>
                                <SelectContent>
                                    {PAGE_TYPES.map((item: PageType) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </label>
                        <label className={labelClass}>
                            Status
                            <Select value={selectedNode.status} onValueChange={(value) => onUpdateNode('status', value as PageStatus)}>
                                <SelectTrigger className={`${fieldClass} w-full`}>
                                    <SelectValue/>
                                </SelectTrigger>
                                <SelectContent>
                                    {PAGE_STATUSES.map((item: PageStatus) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </label>
                        <label className={labelClass}>
                            Verantwortlich
                            <Input
                                className={fieldClass}
                                value={selectedNode.owner}
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) => onUpdateNode('owner', event.target.value)}
                            />
                        </label>
                    </div>
                </AccordionSection>

                <AccordionSection title="SEO" defaultOpen>
                    <div className={formGroupClass}>
                        <label className={labelClass}>
                            SEO-Titel
                            <Input
                                className={fieldClass}
                                value={selectedNode.seoTitle ?? ''}
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) => onUpdateNode('seoTitle', event.target.value)}
                            />
                        </label>
                        <label className={labelClass}>
                            SEO-Beschreibung
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
                            SEO-Relevanz
                            <Select value={selectedNode.seoImportance} onValueChange={(value) => onUpdateNode('seoImportance', value as SeoImportance)}>
                                <SelectTrigger className={`${fieldClass} w-full`}>
                                    <SelectValue/>
                                </SelectTrigger>
                                <SelectContent>
                                    {SEO_IMPORTANCE_LEVELS.map((item: SeoImportance) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
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
                            <strong className="block text-[10px] text-foreground">Von Indexierung ausschließen</strong>
                            <small className="mt-0.5 block font-normal leading-snug">Setzt noindex.</small>
                        </span>
                    </label>
                </AccordionSection>

                <AccordionSection title="Erweitert & Notizen">
                    <div className={formGroupClass}>
                        <label className={labelClass}>
                            Template
                            <Input
                                className={fieldClass}
                                value={selectedNode.template}
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) => onUpdateNode('template', event.target.value)}
                            />
                        </label>
                        <label className={labelClass}>
                            Alte URL / Redirect von
                            <Input
                                className={fieldClass}
                                value={selectedNode.redirectFrom ?? ''}
                                placeholder="/alte-url"
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) => onUpdateNode('redirectFrom', event.target.value)}
                            />
                        </label>
                        <label className={labelClass}>
                            Notizen
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
                <Button variant="outline" size="icon" aria-label="Innerhalb Parent nach oben sortieren" title="Nach oben" disabled={!canMoveUp} onClick={onMoveUp}>
                    <ArrowUp size={15}/>
                </Button>
                <Button variant="outline" size="icon" aria-label="Innerhalb Parent nach unten sortieren" title="Nach unten" disabled={!canMoveDown} onClick={onMoveDown}>
                    <ArrowDown size={15}/>
                </Button>
                <Button className="flex-1" variant="outline" size="sm" onClick={onDuplicate}>
                    <Copy size={15}/>
                    Duplizieren
                </Button>
                <Button variant="outline" size="sm" disabled={selectedNode.parentId === null} onClick={onDelete}>
                    <Trash2 size={15}/>
                </Button>
            </div>
        </aside>
    );
}
