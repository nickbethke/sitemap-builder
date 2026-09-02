import {Button} from '@/components/ui/button.tsx';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
} from '@/components/ui/dialog.tsx';
import {Input} from '@/components/ui/input.tsx';
import {useTranslation} from '@/lib/i18n/context.tsx';
import {createChildSlug, slugify} from '@/lib/sitemap.ts';
import {useState} from 'react';

type NewPageDialogProps = {
    parentTitle: string;
    parentSlug: string;
    onClose: () => void;
    onCreate: (title: string) => void;
};

export function NewPageDialog({parentTitle, parentSlug, onClose, onCreate}: NewPageDialogProps) {
    const {t} = useTranslation();
    const [title, setTitle] = useState('');
    const slug = createChildSlug(parentSlug, title);

    const create = () => {
        const trimmedTitle = title.trim();
        if (!trimmedTitle || !slugify(trimmedTitle)) return;
        onCreate(trimmedTitle);
    };

    return (
        <Dialog open onOpenChange={(open) => {
            if (!open) onClose();
        }}>
            <DialogContent showCloseButton={false} className="w-full max-w-md gap-0 overflow-hidden rounded-xl bg-card p-0">
                <form onSubmit={(event) => {
                    event.preventDefault();
                    create();
                }}>
                    <header className="border-b border-border px-6 py-5">
                        <DialogTitle className="mb-1 text-xl">{t('newPage.title')}</DialogTitle>
                        <DialogDescription className="m-0 text-xs">
                            {t('newPage.description', {parent: parentTitle})}
                        </DialogDescription>
                    </header>

                    <div className="space-y-3 p-5">
                        <label className="flex flex-col gap-1.5 text-[10px] font-semibold text-muted-foreground">
                            {t('newPage.name')}
                            <Input
                                autoFocus
                                className="h-9 px-2 text-xs text-foreground"
                                value={title}
                                onChange={(event) => setTitle(event.target.value)}
                            />
                        </label>
                        <div className="rounded-md border border-border bg-muted/50 px-3 py-2">
                            <span className="block text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">{t('newPage.slug')}</span>
                            <code className="mt-0.5 block truncate text-xs text-primary">{slug || '/'}</code>
                        </div>
                    </div>

                    <DialogFooter className="flex-row justify-end gap-2 border-t border-border px-5 py-4 [&_button]:h-9 [&_button]:text-xs">
                        <Button type="button" variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
                        <Button type="submit" disabled={!title.trim() || !slugify(title)}>{t('newPage.create')}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
