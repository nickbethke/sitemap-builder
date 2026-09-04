import {Button} from '@/components/ui/button.tsx';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
} from '@/components/ui/dialog.tsx';
import {Field, FieldContent, FieldLabel} from '@/components/ui/field.tsx';
import {Input} from '@/components/ui/input.tsx';
import {RadioGroup, RadioGroupItem} from '@/components/ui/radio-group.tsx';
import {useTranslation} from '@/lib/i18n/context.tsx';
import {PROJECT_TEMPLATES, type ProjectTemplateId, type SitemapProject} from '@/lib/sitemap.ts';
import {X} from 'lucide-react';
import {useState} from 'react';

type NewSitemapDialogProps = {
    onClose: () => void;
    onCreate: (templateId: ProjectTemplateId, project: SitemapProject) => Promise<boolean>;
};

const eyebrowClass = 'block text-[9px] font-bold uppercase tracking-widest text-muted-foreground';
const labelClass = 'flex flex-col gap-1.5 text-[10px] font-semibold text-muted-foreground';

export function NewSitemapDialog({onClose, onCreate}: NewSitemapDialogProps) {
    const {t} = useTranslation();
    const [templateId, setTemplateId] = useState<ProjectTemplateId>('empty');
    const [project, setProject] = useState<SitemapProject>({
        name: t('newSitemap.defaultName'),
        client: '',
        baseUrl: 'https://',
    });
    const [creating, setCreating] = useState(false);

    const create = async () => {
        setCreating(true);
        try {
            if (await onCreate(templateId, project)) onClose();
        } finally {
            setCreating(false);
        }
    };

    return (
        <Dialog open onOpenChange={(open) => {
            if (!open) onClose();
        }}>
            <DialogContent showCloseButton={false} className="block w-full max-w-3xl gap-0 overflow-hidden rounded-xl bg-card p-0">
                <header className="flex items-start justify-between border-b border-border px-6 py-5">
                    <div>
                        <span className={eyebrowClass}>{t('newSitemap.eyebrow')}</span>
                        <DialogTitle className="mb-1 mt-1 text-xl">{t('newSitemap.title')}</DialogTitle>
                        <DialogDescription className="m-0 text-xs">{t('newSitemap.description')}</DialogDescription>
                    </div>
                    <Button className="-mr-2 -mt-1 text-muted-foreground" variant="ghost" size="icon" aria-label={t('newSitemap.close')} onClick={onClose}>
                        <X size={18}/>
                    </Button>
                </header>

                <RadioGroup
                    className="grid grid-cols-2 gap-2 border-b border-border p-5"
                    value={templateId}
                    aria-label={t('newSitemap.chooseTemplate')}
                    onValueChange={(value) => setTemplateId(value as ProjectTemplateId)}
                >
                    {PROJECT_TEMPLATES.map((template) => (
                        <FieldLabel htmlFor={`template-${template.id}`} key={template.id}>
                            <Field orientation="horizontal" className="relative min-h-24 items-start bg-background p-3">
                                <RadioGroupItem id={`template-${template.id}`} value={template.id}/>
                                <FieldContent>
                                    <strong className="text-xs text-foreground">{t(template.titleKey)}</strong>
                                    <span className="pr-3 text-[10px] leading-snug text-muted-foreground">{t(template.descriptionKey)}</span>
                                    <span className="absolute bottom-3 right-3 text-[9px] text-muted-foreground">{t('newSitemap.pageCount', {count: template.pageCount})}</span>
                                </FieldContent>
                            </Field>
                        </FieldLabel>
                    ))}
                </RadioGroup>

                <div className="grid grid-cols-3 gap-3 p-5">
                    <label className={labelClass}>
                        {t('newSitemap.projectName')}
                        <Input className="h-9 px-2 text-xs text-foreground" autoFocus value={project.name} onChange={(event) => setProject({...project, name: event.target.value})}/>
                    </label>
                    <label className={labelClass}>
                        {t('newSitemap.client')}
                        <Input className="h-9 px-2 text-xs text-foreground" value={project.client} onChange={(event) => setProject({...project, client: event.target.value})}/>
                    </label>
                    <label className={labelClass}>
                        {t('newSitemap.baseUrl')}
                        <Input className="h-9 px-2 text-xs text-foreground" value={project.baseUrl} onChange={(event) => setProject({...project, baseUrl: event.target.value})}/>
                    </label>
                </div>

                <DialogFooter className="flex-row justify-end gap-2 border-t border-border px-5 py-4 [&_button]:h-9 [&_button]:text-xs">
                    <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
                    <Button onClick={() => void create()} disabled={!project.name.trim() || creating}>{t('newSitemap.create')}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
