import {Button} from '@/components/ui/button.tsx';
import {Input} from '@/components/ui/input.tsx';
import {FolderOpen, LayoutDashboard, Moon, Save, Sun} from 'lucide-react';

type TopbarProps = {
    projectName: string;
    dirty: boolean;
    theme: 'dark' | 'light' | 'system';
    onProjectNameChange: (name: string) => void;
    onThemeToggle: () => void;
    onOpen: () => void;
    onSave: () => void;
};

export function Topbar({
    projectName,
    dirty,
    theme,
    onProjectNameChange,
    onThemeToggle,
    onOpen,
    onSave,
}: TopbarProps) {
    return (
        <header className="topbar">
            <div className="brand">
                <div className="brand-mark">
                    <LayoutDashboard size={18}/>
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
