import {AccordionSection} from '@/components/sitemap/AccordionSection.tsx';
import {Button} from '@/components/ui/button.tsx';
import {Input} from '@/components/ui/input.tsx';
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
import {
    ArrowDown,
    ArrowUp,
    Copy,
    LayoutDashboard,
    Trash2,
} from 'lucide-react';
import React from "react";

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
            <aside className="inspector">
                <div className="empty-inspector">
                    <LayoutDashboard/>
                    <h2>Seite auswählen</h2>
                    <p>
                        Karte anklicken, um Seitendetails zu bearbeiten.
                    </p>
                </div>
            </aside>
        );
    }

    return (
        <aside className="inspector">
            <div className="inspector-header">
                <div>
                    <span className="eyebrow">Seitendetails</span>
                    <h2>{selectedNode.title || 'Ohne Titel'}</h2>
                </div>
            </div>

            <div className="form-scroll">
                <AccordionSection title="Seite" defaultOpen>
                    <div className="form-group">
                        <label>
                            <span className="field-label">
                                Titel <b>*</b>
                            </span>
                            <Input
                                value={selectedNode.title}
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) => onUpdateNode(
                                    'title',
                                    event.target.value,
                                )}
                            />
                        </label>
                        <label>
                            <span className="field-label">
                                Slug / URL <b>*</b>
                            </span>
                            <Input
                                value={selectedNode.slug}
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) => onUpdateNode(
                                    'slug',
                                    event.target.value,
                                )}
                            />
                        </label>
                        <label>
                            Beschreibung
                            <textarea
                                value={selectedNode.description}
                                rows={3}
                                onChange={(event) => onUpdateNode(
                                    'description',
                                    event.target.value,
                                )}
                            />
                        </label>
                    </div>

                    <div className="form-grid">
                        <label>
                            Seitentyp
                            <select
                                value={selectedNode.pageType}
                                onChange={(event) => onUpdateNode(
                                    'pageType',
                                    event.target.value as PageType,
                                )}
                            >
                                {PAGE_TYPES.map((item: PageType) => (
                                    <option key={item}>{item}</option>
                                ))}
                            </select>
                        </label>
                        <label>
                            Status
                            <select
                                value={selectedNode.status}
                                onChange={(event) => onUpdateNode(
                                    'status',
                                    event.target.value as PageStatus,
                                )}
                            >
                                {PAGE_STATUSES.map((item: PageStatus) => (
                                    <option key={item}>{item}</option>
                                ))}
                            </select>
                        </label>
                        <label>
                            Verantwortlich
                            <Input
                                value={selectedNode.owner}
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) => onUpdateNode(
                                    'owner',
                                    event.target.value,
                                )}
                            />
                        </label>
                    </div>
                </AccordionSection>

                <AccordionSection title="SEO" defaultOpen>
                    <div className="form-group">
                        <label>
                            SEO-Titel
                            <Input
                                value={selectedNode.seoTitle ?? ''}
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) => onUpdateNode(
                                    'seoTitle',
                                    event.target.value,
                                )}
                            />
                        </label>
                        <label>
                            SEO-Beschreibung
                            <textarea
                                value={selectedNode.seoDescription ?? ''}
                                rows={3}
                                onChange={(event) => onUpdateNode(
                                    'seoDescription',
                                    event.target.value,
                                )}
                            />
                        </label>
                    </div>

                    <div className="form-grid">
                        <label>
                            SEO-Relevanz
                            <select
                                value={selectedNode.seoImportance}
                                onChange={(event) => onUpdateNode(
                                    'seoImportance',
                                    event.target.value as SeoImportance,
                                )}
                            >
                                {SEO_IMPORTANCE_LEVELS.map((item: SeoImportance) => (
                                    <option key={item}>{item}</option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <label className="checkbox-row">
                        <input
                            type="checkbox"
                            checked={selectedNode.noIndex}
                            onChange={(event) => onUpdateNode(
                                'noIndex',
                                event.target.checked,
                            )}
                        />
                        <span>
                            <strong>Von Indexierung ausschließen</strong>
                            <small>Setzt noindex.</small>
                        </span>
                    </label>
                </AccordionSection>

                <AccordionSection title="Erweitert & Notizen">
                    <div className="form-group">
                        <label>
                            Template
                            <Input
                                value={selectedNode.template}
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) => onUpdateNode(
                                    'template',
                                    event.target.value,
                                )}
                            />
                        </label>
                        <label>
                            Alte URL / Redirect von
                            <Input
                                value={selectedNode.redirectFrom ?? ''}
                                placeholder="/alte-url"
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) => onUpdateNode(
                                    'redirectFrom',
                                    event.target.value,
                                )}
                            />
                        </label>
                        <label>
                            Notizen
                            <textarea
                                value={selectedNode.notes}
                                rows={3}
                                onChange={(event) => onUpdateNode(
                                    'notes',
                                    event.target.value,
                                )}
                            />
                        </label>
                    </div>
                </AccordionSection>
            </div>

            <div className="inspector-actions">
                <Button
                    variant="outline"
                    size="icon"
                    aria-label="Innerhalb Parent nach oben sortieren"
                    title="Nach oben"
                    disabled={!canMoveUp}
                    onClick={onMoveUp}
                >
                    <ArrowUp size={15}/>
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    aria-label="Innerhalb Parent nach unten sortieren"
                    title="Nach unten"
                    disabled={!canMoveDown}
                    onClick={onMoveDown}
                >
                    <ArrowDown size={15}/>
                </Button>
                <Button
                    className="duplicate"
                    variant="outline"
                    size="sm"
                    onClick={onDuplicate}
                >
                    <Copy size={15}/>
                    Duplizieren
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={selectedNode.parentId === null}
                    onClick={onDelete}
                >
                    <Trash2 size={15}/>
                </Button>
            </div>
        </aside>
    );
}
