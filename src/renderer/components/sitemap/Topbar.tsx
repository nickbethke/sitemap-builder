import {Button} from '@/components/ui/button.tsx';
import {Input} from '@/components/ui/input.tsx';
import {FolderOpen, Moon, Redo2, Save, Sun, Undo2} from 'lucide-react';

type TopbarProps = {
    projectName: string;
    dirty: boolean;
    theme: 'dark' | 'light' | 'system';
    onProjectNameChange: (name: string) => void;
    onThemeToggle: () => void;
    onOpen: () => void;
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
    onSave,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
}: TopbarProps) {
    return (
        <header className="z-20 col-span-full grid grid-cols-[214px_minmax(240px,1fr)_auto] items-center border-b border-border bg-[hsl(var(--panel))] [-webkit-app-region:drag] max-[1180px]:grid-cols-[180px_minmax(160px,1fr)_auto]">
            <div className="flex h-full items-center gap-3 border-r border-border px-4 max-[1180px]:pl-3">
                <div className="grid size-9 place-items-center rounded-lg bg-gradient-to-br from-[#18c8ff] via-[#2368ff] to-[#6d3cff] text-white shadow-md shadow-primary/20">
                    <img src="/logo.svg" alt="" className="size-full"/>
                </div>
                <div className="whitespace-nowrap">
                    <strong className="block text-sm">Sitemap Builder</strong>
                    <span className="mt-px block text-[9px] uppercase tracking-widest text-muted-foreground">
                        Website Architecture
                    </span>
                </div>
            </div>

            <div className="min-w-56 justify-self-center text-center">
                <Input
                    className="h-8 border-0 bg-transparent px-2 text-center text-sm font-semibold shadow-none [-webkit-app-region:no-drag] focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0"
                    value={projectName}
                    aria-label="Projektname"
                    onChange={(event) => onProjectNameChange(event.target.value)}
                />
                <span className="block text-[10px] text-muted-foreground">
                    {dirty
                        ? 'Ungespeicherte Änderungen'
                        : 'Alle Änderungen gespeichert'}
                </span>
            </div>

            <div className="flex items-center gap-2 pr-4 [&_button]:h-9 [&_button]:gap-2">
                <Button variant="ghost" size="icon" aria-label="Rückgängig" title="Rückgängig" disabled={!canUndo} onClick={onUndo}>
                    <Undo2 size={17}/>
                </Button>
                <Button variant="ghost" size="icon" aria-label="Wiederholen" title="Wiederholen" disabled={!canRedo} onClick={onRedo}>
                    <Redo2 size={17}/>
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Farbschema wechseln"
                    onClick={onThemeToggle}
                >
                    {theme === 'dark'
                        ? <Sun size={17}/>
                        : <Moon size={17}/>
                    }
                </Button>
                <Button variant="outline" size="sm" onClick={onOpen}>
                    <FolderOpen size={16}/>
                    Öffnen
                </Button>
                <Button size="sm" onClick={onSave}>
                    <Save size={16}/>
                    Speichern
                </Button>
            </div>
        </header>
    );
}
