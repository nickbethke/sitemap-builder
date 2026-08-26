import {Button} from '@/components/ui/button.tsx';
import {Input} from '@/components/ui/input.tsx';
import {
    PROJECT_TEMPLATES,
    type ProjectTemplateId,
    type SitemapProject,
} from '@/lib/sitemap.ts';
import {Check, X} from 'lucide-react';
import {useState} from 'react';

type NewSitemapDialogProps = {
    onClose: () => void;
    onCreate: (templateId: ProjectTemplateId, project: SitemapProject) => void;
};

export function NewSitemapDialog({
    onClose,
    onCreate,
}: NewSitemapDialogProps) {
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
        <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}>
            <section
                className="new-sitemap-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="new-sitemap-title"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <header>
                    <div>
                        <span className="eyebrow">Neues Projekt</span>
                        <h2 id="new-sitemap-title">Sitemap erstellen</h2>
                        <p>Starte leer oder mit einer passenden Seitenstruktur.</p>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Dialog schließen"
                        onClick={onClose}
                    >
                        <X size={18}/>
                    </Button>
                </header>

                <div className="template-options" role="radiogroup" aria-label="Vorlage wählen">
                    {PROJECT_TEMPLATES.map((template) => {
                        const selected = template.id === templateId;
                        return (
                            <button
                                key={template.id}
                                className={selected ? 'template-option selected' : 'template-option'}
                                role="radio"
                                aria-checked={selected}
                                onClick={() => setTemplateId(template.id)}
                            >
                                <span className="template-check">
                                    {selected && <Check size={13}/>} 
                                </span>
                                <span>
                                    <strong>{template.title}</strong>
                                    <small>{template.description}</small>
                                </span>
                                <em>{template.pageCount} Seiten</em>
                            </button>
                        );
                    })}
                </div>

                <div className="new-sitemap-fields">
                    <label>
                        Projektname
                        <Input
                            autoFocus
                            value={project.name}
                            onChange={(event) => setProject({
                                ...project,
                                name: event.target.value,
                            })}
                        />
                    </label>
                    <label>
                        Kunde / Unternehmen
                        <Input
                            value={project.client}
                            onChange={(event) => setProject({
                                ...project,
                                client: event.target.value,
                            })}
                        />
                    </label>
                    <label>
                        Basis-URL
                        <Input
                            value={project.baseUrl}
                            onChange={(event) => setProject({
                                ...project,
                                baseUrl: event.target.value,
                            })}
                        />
                    </label>
                </div>

                <footer>
                    <Button variant="outline" onClick={onClose}>Abbrechen</Button>
                    <Button onClick={create} disabled={!project.name.trim()}>
                        Sitemap erstellen
                    </Button>
                </footer>
            </section>
        </div>
    );
}
