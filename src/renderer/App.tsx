import {ImportWebsiteDialog} from '@/components/sitemap/ImportWebsiteDialog.tsx';
import {Inspector} from '@/components/sitemap/Inspector.tsx';
import {NewPageDialog} from '@/components/sitemap/NewPageDialog.tsx';
import {NewSitemapDialog} from '@/components/sitemap/NewSitemapDialog.tsx';
import {Topbar} from '@/components/sitemap/Topbar.tsx';
import {Workspace, type WorkspaceHandle} from '@/components/sitemap/Workspace.tsx';
import {ThemeProvider} from '@/components/theme-provider.tsx';
import {ConfirmDialog} from '@/components/ui/confirm-dialog.tsx';
import {ipc} from '@/gen/ipc';
import {useSitemapBuilder} from '@/hooks/useSitemapBuilder.ts';
import {LanguageProvider} from '@/lib/i18n/context.tsx';
import {useEffect, useRef, useState} from 'react';

function App() {
    return (
        <LanguageProvider>
            <ThemeProvider>
                <SitemapBuilder/>
            </ThemeProvider>
        </LanguageProvider>
    );
}

function SitemapBuilder() {
    const sitemap = useSitemapBuilder();
    const isMacOS = navigator.userAgent.includes('Macintosh');
    const [newSitemapOpen, setNewSitemapOpen] = useState(false);
    const [newPageParentId, setNewPageParentId] = useState<string | null>(null);
    const [importWebsiteOpen, setImportWebsiteOpen] = useState(false);
    const [presentationMode, setPresentationMode] = useState(false);
    const [workspaceMode, setWorkspaceMode] = useState<'sitemap' | 'menu'>('sitemap');
    const workspaceRef = useRef<WorkspaceHandle>(null);

    const togglePresentationMode = (enabled: boolean) => setPresentationMode(enabled);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && presentationMode) togglePresentationMode(false);
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [presentationMode]);

    useEffect(() => {
        const subscription = ipc.menuAction.WatchMenuActions({}).subscribe({
            next: ({action}) => {
                switch (action) {
                    case 'new':
                        setNewSitemapOpen(true);
                        break;
                    case 'open':
                        void sitemap.open();
                        break;
                    case 'import-website':
                        setImportWebsiteOpen(true);
                        break;
                    case 'save':
                        void sitemap.save(false);
                        break;
                    case 'save-as':
                        void sitemap.save(true);
                        break;
                    case 'undo':
                        sitemap.undo();
                        break;
                    case 'redo':
                        sitemap.redo();
                        break;
                    case 'export-xml':
                        void sitemap.exportFile('xml');
                        break;
                    case 'export-csv':
                        void sitemap.exportFile('csv');
                        break;
                    case 'export-md':
                        void sitemap.exportFile('md');
                        break;
                    case 'export-html':
                        void sitemap.exportFile('html');
                        break;
                    case 'export-pdf':
                        void workspaceRef.current?.exportPdf();
                        break;
                }
            },
        });
        return () => subscription.unsubscribe();
    }, [sitemap]);

    return (
        <div className={presentationMode
            ? 'grid h-screen grid-cols-1 grid-rows-1 bg-background'
            : workspaceMode === 'menu'
                ? `grid h-screen grid-cols-1 grid-rows-[70px_minmax(0,1fr)] bg-background ${isMacOS ? 'macos-titlebar-inset' : ''}`
                : `grid h-screen grid-cols-[minmax(540px,1fr)_316px] grid-rows-[70px_minmax(0,1fr)] bg-background max-[1180px]:grid-cols-[minmax(500px,1fr)_285px] ${isMacOS ? 'macos-titlebar-inset' : ''}`}>
            {!presentationMode && <Topbar
                projectName={sitemap.document.project.name}
                dirty={sitemap.dirty}
                theme={sitemap.theme}
                onProjectNameChange={(name) => sitemap.updateProject({
                    ...sitemap.document.project,
                    name,
                })}
                onThemeToggle={() => void sitemap.toggleTheme()}
                onOpen={() => void sitemap.open()}
                onImport={() => setImportWebsiteOpen(true)}
                onSave={() => void sitemap.save(false)}
                onUndo={sitemap.undo}
                onRedo={sitemap.redo}
                canUndo={sitemap.canUndo}
                canRedo={sitemap.canRedo}
                workspaceMode={workspaceMode}
                onWorkspaceModeChange={setWorkspaceMode}
                macOS={isMacOS}
            />}

            <Workspace
                ref={workspaceRef}
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
                onAddChild={(parentId) => setNewPageParentId(parentId ?? sitemap.selectedId)}
                onDuplicateNode={sitemap.duplicateNode}
                onDeleteNode={sitemap.deleteNode}
                onDeleteNodes={sitemap.deleteNodes}
                onMoveNodeSibling={sitemap.moveNodeSibling}
                onMoveNodeUpLevel={sitemap.moveNodeUpLevel}
                onSelectNode={sitemap.setSelectedId}
                onDraggedNodeChange={sitemap.setDraggedId}
                onDropTargetChange={sitemap.setDropTargetId}
                canMoveTo={sitemap.canMoveTo}
                onDropNode={sitemap.dropOn}
                onUpdateNode={sitemap.updateNodeById}
                onUpdateNodes={sitemap.updateNodes}
                onExportPdf={sitemap.exportPdf}
                presentationMode={presentationMode}
                onPresentationModeChange={togglePresentationMode}
                workspaceMode={workspaceMode}
            />

            {!presentationMode && workspaceMode === 'sitemap' && <Inspector
                selectedNode={sitemap.selectedNode}
                project={sitemap.document.project}
                onProjectChange={sitemap.updateProject}
                canMoveUp={sitemap.canMoveUp}
                canMoveDown={sitemap.canMoveDown}
                onUpdateNode={sitemap.updateNode}
                onMoveUp={() => sitemap.moveSelectedSibling(-1)}
                onMoveDown={() => sitemap.moveSelectedSibling(1)}
                onDuplicate={() => sitemap.duplicateNode()}
                onDelete={() => sitemap.deleteNode()}
            />}

            {newSitemapOpen && (
                <NewSitemapDialog
                    onClose={() => setNewSitemapOpen(false)}
                    onCreate={sitemap.newProject}
                />
            )}

            {newPageParentId && (() => {
                const parent = sitemap.document.nodes.find((node) => node.id === newPageParentId);
                if (!parent) return null;
                return <NewPageDialog
                    parentTitle={parent.title}
                    parentSlug={parent.slug}
                    onClose={() => setNewPageParentId(null)}
                    onCreate={(title) => {
                        setNewPageParentId(null);
                        sitemap.addChild(title, parent.id);
                    }}
                />;
            })()}

            {importWebsiteOpen && (
                <ImportWebsiteDialog
                    onClose={() => setImportWebsiteOpen(false)}
                    onImport={sitemap.importPages}
                />
            )}

            <ConfirmDialog
                open={Boolean(sitemap.confirmation)}
                title={sitemap.confirmation?.title ?? ''}
                description={sitemap.confirmation?.description ?? ''}
                confirmLabel={sitemap.confirmation?.confirmLabel}
                cancelLabel={sitemap.confirmation?.cancelLabel}
                destructive={sitemap.confirmation?.destructive}
                onConfirm={() => sitemap.answerConfirmation(true)}
                onCancel={() => sitemap.answerConfirmation(false)}
            />
        </div>
    );
}

export default App;
