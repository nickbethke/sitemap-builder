import {Button} from '@/components/ui/button.tsx';
import {Input} from '@/components/ui/input.tsx';
import {PROJECT_TEMPLATES, type ProjectTemplateId, type SitemapProject} from '@/lib/sitemap.ts';
import {cn} from '@/lib/utils.ts';
import {Check, X} from 'lucide-react';
import {useState} from 'react';

type NewSitemapDialogProps = {
    onClose: () => void;
    onCreate: (templateId: ProjectTemplateId, project: SitemapProject) => void;
};

const eyebrowClass = 'block text-[9px] font-bold uppercase tracking-widest text-muted-foreground';
const labelClass = 'flex flex-col gap-1.5 text-[10px] font-semibold text-muted-foreground';

export function NewSitemapDialog({onClose, onCreate}: NewSitemapDialogProps) {
    const [templateId, setTemplateId] = useState<ProjectTemplateId>('empty');
    const [project, setProject] = useState<SitemapProject>({
        name: 'Neue Sitemap',
        client: '',
        baseUrl: 'https://',
    });

    const create = () => {
        onCreate(templateId, project);
        onClose();
    };

    return (
        <div
            className="fixed inset-0 z-50 grid place-items-center bg-[#07142e]/45 p-5 backdrop-blur-sm"
            role="presentation"
            onMouseDown={onClose}
        >
            <section
                className="w-full max-w-3xl overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
                role="dialog"
                aria-modal="true"
                aria-labelledby="new-sitemap-title"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <header className="flex items-start justify-between border-b border-border px-6 py-5">
                    <div>
                        <span className={eyebrowClass}>Neues Projekt</span>
                        <h2 className="mb-1 mt-1 text-xl tracking-tight" id="new-sitemap-title">Sitemap erstellen</h2>
                        <p className="m-0 text-xs text-muted-foreground">Starte leer oder mit einer passenden Seitenstruktur.</p>
                    </div>
                    <Button className="-mr-2 -mt-1 text-muted-foreground" variant="ghost" size="icon" aria-label="Dialog schließen" onClick={onClose}>
                        <X size={18}/>
                    </Button>
                </header>

                <div className="grid grid-cols-2 gap-2 border-b border-border p-5" role="radiogroup" aria-label="Vorlage wählen">
                    {PROJECT_TEMPLATES.map((template) => {
                        const selected = template.id === templateId;
                        return (
                            <Button
                                key={template.id}
                                variant="ghost"
                                className={cn(
                                    'relative h-auto min-h-24 items-start justify-start gap-3 whitespace-normal rounded-lg border border-border bg-background p-3 text-left font-normal hover:border-primary/50 hover:bg-accent/40',
                                    selected && 'border-primary bg-accent/50 ring-2 ring-primary/10',
                                )}
                                role="radio"
                                aria-checked={selected}
                                onClick={() => setTemplateId(template.id)}
                            >
                                <span className={cn(
                                    'grid size-5 shrink-0 place-items-center rounded-full border border-input text-white',
                                    selected && 'border-primary bg-primary',
                                )}>
                                    {selected && <Check size={13}/>}
                                </span>
                                <span>
                                    <strong className="block text-xs text-foreground">{template.title}</strong>
                                    <small className="mt-1 block pr-3 text-[10px] leading-snug text-muted-foreground">{template.description}</small>
                                </span>
                                <em className="absolute bottom-3 right-3 text-[9px] not-italic text-muted-foreground">{template.pageCount} Seiten</em>
                            </Button>
                        );
                    })}
                </div>

                <div className="grid grid-cols-3 gap-3 p-5">
                    <label className={labelClass}>
                        Projektname
                        <Input className="h-9 px-2 text-xs text-foreground" autoFocus value={project.name} onChange={(event) => setProject({...project, name: event.target.value})}/>
                    </label>
                    <label className={labelClass}>
                        Kunde / Unternehmen
                        <Input className="h-9 px-2 text-xs text-foreground" value={project.client} onChange={(event) => setProject({...project, client: event.target.value})}/>
                    </label>
                    <label className={labelClass}>
                        Basis-URL
                        <Input className="h-9 px-2 text-xs text-foreground" value={project.baseUrl} onChange={(event) => setProject({...project, baseUrl: event.target.value})}/>
                    </label>
                </div>

                <footer className="flex justify-end gap-2 border-t border-border px-5 py-4 [&_button]:h-9 [&_button]:text-xs">
                    <Button variant="outline" onClick={onClose}>Abbrechen</Button>
                    <Button onClick={create} disabled={!project.name.trim()}>Sitemap erstellen</Button>
                </footer>
            </section>
        </div>
    );
}
