import {Inspector} from '@/components/sitemap/Inspector.tsx';
import {LeftSidebar} from '@/components/sitemap/LeftSidebar.tsx';
import {NewSitemapDialog} from '@/components/sitemap/NewSitemapDialog.tsx';
import {Topbar} from '@/components/sitemap/Topbar.tsx';
import {Workspace} from '@/components/sitemap/Workspace.tsx';
import {ThemeProvider} from '@/components/theme-provider.tsx';
import {useSitemapBuilder} from '@/hooks/useSitemapBuilder.ts';
import {useState} from 'react';

function App() {
    return (
        <ThemeProvider>
            <SitemapBuilder/>
        </ThemeProvider>
    );
}

function SitemapBuilder() {
    const sitemap = useSitemapBuilder();
    const [newSitemapOpen, setNewSitemapOpen] = useState(false);

    return (
        <div className="app-shell">
            <Topbar
                projectName={sitemap.document.project.name}
                dirty={sitemap.dirty}
                theme={sitemap.theme}
                onProjectNameChange={(name) => sitemap.updateProject({
                    ...sitemap.document.project,
                    name,
                })}
                onThemeToggle={() => void sitemap.toggleTheme()}
                onOpen={() => void sitemap.open()}
                onSave={() => void sitemap.save(false)}
                onUndo={sitemap.undo}
                onRedo={sitemap.redo}
                canUndo={sitemap.canUndo}
                canRedo={sitemap.canRedo}
            />

            <LeftSidebar
                project={sitemap.document.project}
                onProjectChange={sitemap.updateProject}
                onNewProject={() => setNewSitemapOpen(true)}
                onOpen={() => void sitemap.open()}
                onSaveAs={() => void sitemap.save(true)}
                onExport={(format) => void sitemap.exportFile(format)}
            />

            <Workspace
                document={sitemap.document}
                selectedId={sitemap.selectedId}
                draggedId={sitemap.draggedId}
                dropTargetId={sitemap.dropTargetId}
                search={sitemap.search}
                zoom={sitemap.zoom}
                layoutDirection={sitemap.layoutDirection}
                message={sitemap.message}
                currentPath={sitemap.currentPath}
                onSearchChange={sitemap.setSearch}
                onZoomChange={sitemap.setZoom}
                onLayoutDirectionChange={sitemap.setLayoutDirection}
                onAddChild={sitemap.addChild}
                onDuplicateNode={sitemap.duplicateNode}
                onDeleteNode={sitemap.deleteNode}
                onMoveNodeSibling={sitemap.moveNodeSibling}
                onMoveNodeUpLevel={sitemap.moveNodeUpLevel}
                onSelectNode={sitemap.setSelectedId}
                onDraggedNodeChange={sitemap.setDraggedId}
                onDropTargetChange={sitemap.setDropTargetId}
                canMoveTo={sitemap.canMoveTo}
                onDropNode={sitemap.dropOn}
                onUpdateNode={sitemap.updateNodeById}
                onUpdateNodes={sitemap.updateNodes}
            />

            <Inspector
                selectedNode={sitemap.selectedNode}
                canMoveUp={sitemap.canMoveUp}
                canMoveDown={sitemap.canMoveDown}
                onUpdateNode={sitemap.updateNode}
                onMoveUp={() => sitemap.moveSelectedSibling(-1)}
                onMoveDown={() => sitemap.moveSelectedSibling(1)}
                onDuplicate={() => sitemap.duplicateNode()}
                onDelete={() => sitemap.deleteNode()}
            />

            {newSitemapOpen && (
                <NewSitemapDialog
                    onClose={() => setNewSitemapOpen(false)}
                    onCreate={sitemap.newProject}
                />
            )}
        </div>
    );
}

export default App;
