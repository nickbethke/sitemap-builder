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
        <header className="topbar">
            <div className="brand">
                <div className="brand-mark">
                    <img src="/logo.svg" alt="" className="size-full"/>
                </div>
                <div>
                    <strong>Sitemap Builder</strong>
                    <span>Website Architecture</span>
                </div>
            </div>

            <div className="document-title">
                <Input
                    value={projectName}
                    aria-label="Projektname"
                    onChange={(event) => onProjectNameChange(event.target.value)}
                />
                <span>
                    {dirty
                        ? 'Ungespeicherte Änderungen'
                        : 'Alle Änderungen gespeichert'}
                </span>
            </div>

            <div className="toolbar-actions">
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
                        : <Moon size={17}/>}
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
