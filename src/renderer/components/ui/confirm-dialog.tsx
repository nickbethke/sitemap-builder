import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog.tsx';
import {buttonVariants} from '@/components/ui/button.tsx';
import {useTranslation} from '@/lib/i18n/context.tsx';
import {cn} from '@/lib/utils.ts';
import {AlertTriangle} from 'lucide-react';

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
                                  confirmLabel,
                                  cancelLabel,
                                  destructive = false,
                                  onConfirm,
                                  onCancel,
                              }: ConfirmDialogProps) {
    const {t} = useTranslation();

    return (
        <AlertDialog open={open} onOpenChange={(nextOpen) => {
            if (!nextOpen) onCancel();
        }}>
            <AlertDialogContent className="max-w-md overflow-hidden p-0">
                <AlertDialogHeader
                    className="grid grid-cols-[auto_1fr] gap-x-3 border-b border-border px-5 py-4 text-left">
                    <span className={cn(
                        'row-span-2 grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary',
                        destructive && 'bg-destructive/10 text-destructive',
                    )}>
                        <AlertTriangle className="size-4.5"/>
                    </span>
                    <AlertDialogTitle className="self-end text-base">
                        {title}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="mt-1 leading-relaxed">
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter className="px-5 py-4">
                    <AlertDialogCancel autoFocus>{cancelLabel ?? t('common.cancel')}</AlertDialogCancel>
                    <AlertDialogAction
                        className={destructive ? buttonVariants({variant: 'destructive'}) : undefined}
                        onClick={(event) => {
                            event.preventDefault();
                            onConfirm();
                        }}
                    >
                        {confirmLabel ?? t('common.confirm')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
