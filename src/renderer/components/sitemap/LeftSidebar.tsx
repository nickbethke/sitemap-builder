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

const eyebrowClass = 'block text-[9px] font-bold uppercase tracking-widest text-muted-foreground';
const labelClass = 'flex flex-col gap-1.5 text-[10px] font-semibold text-muted-foreground';
const inputClass = 'h-9 px-2 text-xs text-foreground';
const fileButtonClass = 'flex h-9 items-center gap-2 rounded-md px-2 text-left text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground [&_svg]:w-4';

export function LeftSidebar({
    project,
    onProjectChange,
    onNewProject,
    onOpen,
    onSaveAs,
    onExport,
}: LeftSidebarProps) {
    return (
        <aside className="col-start-1 flex min-h-0 flex-col gap-6 border-r border-border bg-[hsl(var(--panel))] px-4 py-5">
            <div className="flex flex-col gap-3">
                <span className={eyebrowClass}>Projekt</span>
                <label className={labelClass}>
                    Kunde
                    <Input
                        className={inputClass}
                        value={project.client}
                        onChange={(event) => onProjectChange({
                            ...project,
                            client: event.target.value,
                        })}
                    />
                </label>
                <label className={labelClass}>
                    Basis-URL
                    <Input
                        className={inputClass}
                        value={project.baseUrl}
                        onChange={(event) => onProjectChange({
                            ...project,
                            baseUrl: event.target.value,
                        })}
                    />
                </label>
            </div>

            <div className="flex flex-col gap-1">
                <span className={`${eyebrowClass} mb-1.5`}>Datei</span>
                <button className={fileButtonClass} onClick={onNewProject}>
                    <FilePlus2/>
                    Neue Sitemap
                </button>
                <button className={fileButtonClass} onClick={onOpen}>
                    <FolderOpen/>
                    .smap öffnen
                </button>
                <button className={fileButtonClass} onClick={onSaveAs}>
                    <Save/>
                    Speichern unter
                </button>
                <button className={fileButtonClass} onClick={() => onExport('xml')}>
                    <Download/>
                    XML exportieren
                </button>
                <button className={fileButtonClass} onClick={() => onExport('csv')}>
                    <Download/>
                    CSV exportieren
                </button>
            </div>

            <div className="flex flex-col gap-2 text-[10px] text-muted-foreground [&>span:not(:first-child)]:flex [&>span:not(:first-child)]:items-center [&>span:not(:first-child)]:gap-2">
                <span className={`${eyebrowClass} mb-1`}>SEO-Relevanz</span>
                <span>
                    <i className="size-2 rounded-full bg-blue-600 shadow-[0_0_0_3px_rgb(35_104_255_/_0.12)]"/>
                    Hoch
                </span>
                <span>
                    <i className="size-2 rounded-full bg-amber-500 shadow-[0_0_0_3px_rgb(227_155_57_/_0.12)]"/>
                    Mittel
                </span>
                <span>
                    <i className="size-2 rounded-full bg-emerald-600/70 shadow-[0_0_0_3px_rgb(104_167_135_/_0.12)]"/>
                    Niedrig
                </span>
            </div>

            <div className="mt-auto flex gap-2 rounded-lg border border-border bg-muted/50 p-3 text-muted-foreground">
                <CircleHelp className="mt-px shrink-0 text-primary" size={17}/>
                <p className="m-0 text-[10px] leading-relaxed">
                    <strong className="block text-foreground">Drag & Drop</strong>
                    Karte auf andere Karte ziehen, um Parent-Relation zu ändern.
                </p>
            </div>
        </aside>
    );
}
