import {Input} from '@/components/ui/input.tsx';
import type {SitemapProject} from '@/lib/sitemap.ts';
import {CircleHelp, Download, FilePlus2, FolderOpen, Save} from 'lucide-react';

type LeftSidebarProps = {
    project: SitemapProject;
    onProjectChange: (project: SitemapProject) => void;
    onNewProject: () => void;
    onOpen: () => void;
    onSaveAs: () => void;
    onExport: (format: 'xml' | 'csv') => void;
};

export function LeftSidebar({
    project,
    onProjectChange,
    onNewProject,
    onOpen,
    onSaveAs,
    onExport,
}: LeftSidebarProps) {
    return (
        <aside className="left-sidebar">
            <div className="sidebar-section">
                <span className="eyebrow">Projekt</span>
                <label>
                    Kunde
                    <Input
                        value={project.client}
                        onChange={(event) => onProjectChange({
                            ...project,
                            client: event.target.value,
                        })}
                    />
                </label>
                <label>
                    Basis-URL
                    <Input
                        value={project.baseUrl}
                        onChange={(event) => onProjectChange({
                            ...project,
                            baseUrl: event.target.value,
                        })}
                    />
                </label>
            </div>

            <div className="sidebar-section compact">
                <span className="eyebrow">Datei</span>
                <button onClick={onNewProject}>
                    <FilePlus2/>
                    Neue Sitemap
                </button>
                <button onClick={onOpen}>
                    <FolderOpen/>
                    .smap öffnen
                </button>
                <button onClick={onSaveAs}>
                    <Save/>
                    Speichern unter
                </button>
                <button onClick={() => onExport('xml')}>
                    <Download/>
                    XML exportieren
                </button>
                <button onClick={() => onExport('csv')}>
                    <Download/>
                    CSV exportieren
                </button>
            </div>

            <div className="sidebar-section legend">
                <span className="eyebrow">SEO-Relevanz</span>
                <span>
                    <i className="dot high"/>
                    Hoch
                </span>
                <span>
                    <i className="dot medium"/>
                    Mittel
                </span>
                <span>
                    <i className="dot low"/>
                    Niedrig
                </span>
            </div>

            <div className="sidebar-hint">
                <CircleHelp size={17}/>
                <p>
                    <strong>Drag & Drop</strong>
                    Karte auf andere Karte ziehen, um Parent-Relation zu ändern.
                </p>
            </div>
        </aside>
    );
}
