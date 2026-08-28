import {Button} from '@/components/ui/button.tsx';
import {Input} from '@/components/ui/input.tsx';
import {useTranslation} from '@/lib/i18n/context.tsx';
import {cn} from '@/lib/utils.ts';
import {FolderInput, FolderOpen, Moon, Redo2, Save, Sun, Undo2} from 'lucide-react';

type TopbarProps = {
    projectName: string;
    dirty: boolean;
    theme: 'dark' | 'light' | 'system';
    onProjectNameChange: (name: string) => void;
    onThemeToggle: () => void;
    onOpen: () => void;
    onImport: () => void;
    onSave: () => void;
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
};

export function Topbar({
                           projectName,
                           dirty,
                           theme,
                           onProjectNameChange,
                           onThemeToggle,
                           onOpen,
                           onImport,
                           onSave,
                           onUndo,
                           onRedo,
                           canUndo,
                           canRedo,
                       }: TopbarProps) {
    const {locale, setLocale, t} = useTranslation();

    return (
        <header
            className="z-20 col-span-full grid grid-cols-[214px_minmax(240px,1fr)_auto] items-center border-b border-border bg-[hsl(var(--panel)/.94)] shadow-[0_1px_12px_hsl(var(--foreground)/.05)] backdrop-blur-xl [-webkit-app-region:drag] max-[1180px]:grid-cols-[180px_minmax(160px,1fr)_auto]">
            <div
                className="flex h-full items-center gap-3 border-r border-border px-4 text-foreground max-[1180px]:pl-3">
                <div className="grid size-9 place-items-center">
                    <img src="/logo.svg?v=blueprint" alt="" className="size-full"/>
                </div>
                <div className="whitespace-nowrap">
                    <strong className="block text-sm">Sitemap Builder</strong>
                    <span className="mt-px block text-[9px] tracking-[.18em] text-muted-foreground">
                        krawallstudio
                    </span>
                </div>
            </div>

            <div className="min-w-56 justify-self-center text-center">
                <Input
                    className="h-8 border-0 bg-transparent px-2 text-center text-sm font-semibold shadow-none [-webkit-app-region:no-drag] focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0"
                    value={projectName}
                    placeholder={t('topbar.projectName')}
                    aria-label={t('topbar.projectName')}
                    onChange={(event) => onProjectNameChange(event.target.value)}
                />
                <span className="block text-[10px] text-muted-foreground">
                    {dirty
                        ? t('topbar.unsavedChanges')
                        : t('topbar.allChangesSaved')}
                </span>
            </div>

            <div className="flex items-center gap-2 pr-4 [&_button]:h-9 [&_button]:gap-2">
                <Button variant="ghost" size="icon" aria-label={t('topbar.undo')} title={t('topbar.undo')}
                        disabled={!canUndo} onClick={onUndo}>
                    <Undo2 size={17}/>
                </Button>
                <Button variant="ghost" size="icon" aria-label={t('topbar.redo')} title={t('topbar.redo')}
                        disabled={!canRedo} onClick={onRedo}>
                    <Redo2 size={17}/>
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="w-9 px-0 text-[10px] font-semibold"
                    aria-label={t('topbar.toggleLanguage')}
                    title={t('topbar.toggleLanguage')}
                    onClick={() => setLocale(locale === 'de' ? 'en' : 'de')}
                >
                    <span className={cn('uppercase', '[-webkit-app-region:no-drag]')}>{locale}</span>
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t('topbar.toggleTheme')}
                    onClick={onThemeToggle}
                >
                    {theme === 'dark'
                        ? <Sun size={17}/>
                        : <Moon size={17}/>
                    }
                </Button>
                <Button variant="ghost" size="icon" aria-label={t('topbar.importWebsite')}
                        title={t('topbar.importWebsite')} onClick={onImport}>
                    <FolderInput size={17}/>
                </Button>
                <Button variant="outline" size="sm" onClick={onOpen}>
                    <FolderOpen size={16}/>
                    {t('topbar.open')}
                </Button>
                <Button size="sm" onClick={onSave}>
                    <Save size={16}/>
                    {t('topbar.save')}
                </Button>
            </div>
        </header>
    );
}
