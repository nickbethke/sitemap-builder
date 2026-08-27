import {Button} from '@/components/ui/button.tsx';
import {AlertTriangle, X} from 'lucide-react';
import {useEffect} from 'react';

type ConfirmDialogProps = {
    open: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    destructive?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
};

export function ConfirmDialog({
    open,
    title,
    description,
    confirmLabel = 'Bestätigen',
    cancelLabel = 'Abbrechen',
    destructive = false,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    useEffect(() => {
        if (!open) return;

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onCancel();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [onCancel, open]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[60] grid place-items-center bg-[#07142e]/45 p-5 backdrop-blur-sm"
            role="presentation"
            onMouseDown={onCancel}
        >
            <section
                className="w-full max-w-md overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="confirm-dialog-title"
                aria-describedby="confirm-dialog-description"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <header className="flex items-start gap-3 border-b border-border px-5 py-4">
                    <span className={destructive
                        ? 'grid size-9 shrink-0 place-items-center rounded-full bg-destructive/10 text-destructive'
                        : 'grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary'}
                    >
                        <AlertTriangle size={18}/>
                    </span>
                    <div className="min-w-0 flex-1">
                        <h2 className="m-0 text-base font-semibold text-foreground" id="confirm-dialog-title">
                            {title}
                        </h2>
                        <p className="mb-0 mt-1 text-sm leading-relaxed text-muted-foreground" id="confirm-dialog-description">
                            {description}
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="-mr-2 -mt-1 size-8 text-muted-foreground"
                        aria-label="Dialog schließen"
                        onClick={onCancel}
                    >
                        <X size={17}/>
                    </Button>
                </header>

                <footer className="flex justify-end gap-2 px-5 py-4">
                    <Button variant="outline" autoFocus onClick={onCancel}>
                        {cancelLabel}
                    </Button>
                    <Button
                        variant={destructive ? 'destructive' : 'default'}
                        onClick={onConfirm}
                    >
                        {confirmLabel}
                    </Button>
                </footer>
            </section>
        </div>
    );
}
