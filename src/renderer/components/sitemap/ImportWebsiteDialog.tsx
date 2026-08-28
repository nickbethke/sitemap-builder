import {Button} from '@/components/ui/button.tsx';
import {Checkbox} from '@/components/ui/checkbox.tsx';
import {Input} from '@/components/ui/input.tsx';
import type {ImportXmlResponse} from '@/gen/app.ts';
import {ipc} from '@/gen/ipc.ts';
import {prepareImportPages, type ImportPreviewPage} from '@/lib/import.ts';
import {FileCode2, Globe2, Search, TriangleAlert, X} from 'lucide-react';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';

type ImportWebsiteDialogProps = {
    onClose: () => void;
    onImport: (pages: ImportPreviewPage[], projectName: string, baseUrl: string) => Promise<boolean>;
};

const MAX_VISIBLE_ROWS = 250;

export function ImportWebsiteDialog({onClose, onImport}: ImportWebsiteDialogProps) {
    const [pages, setPages] = useState<ImportPreviewPage[]>([]);
    const [warnings, setWarnings] = useState<string[]>([]);
    const [projectName, setProjectName] = useState('');
    const [baseUrl, setBaseUrl] = useState('');
    const [search, setSearch] = useState('');
    const [sitemapUrl, setSitemapUrl] = useState('https://');
    const [crawlUrl, setCrawlUrl] = useState('https://');
    const [maxPages, setMaxPages] = useState(500);
    const [maxDepth, setMaxDepth] = useState(10);
    const [ignoreQueryParameters, setIgnoreQueryParameters] = useState(true);
    const [loading, setLoading] = useState(false);
    const [applying, setApplying] = useState(false);
    const [error, setError] = useState('');
    const [progress, setProgress] = useState<{completed: number; total: number; label: string} | null>(null);
    const enrichmentAbortRef = useRef<AbortController | null>(null);

    const close = useCallback(() => {
        enrichmentAbortRef.current?.abort();
        onClose();
    }, [onClose]);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !applying) close();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [applying, close]);

    const filteredPages = useMemo(() => {
        const term = search.trim().toLocaleLowerCase('de');
        if (!term) return pages;
        return pages.filter((page) => `${page.title} ${page.path} ${page.seoTitle} ${page.seoDescription} ${page.canonicalUrl} ${page.warnings.join(' ')}`.toLocaleLowerCase('de').includes(term));
    }, [pages, search]);
    const visiblePages = filteredPages.slice(0, MAX_VISIBLE_ROWS);
    const selectedCount = pages.filter(({selected}) => selected).length;
    const allFilteredSelected = filteredPages.length > 0 && filteredPages.every(({selected}) => selected);

    const showResult = async (result: ImportXmlResponse) => {
        if (result.canceled) return;

        const prepared = prepareImportPages(result.pages);
        const pageIndexes = new Map(prepared.map((page, index) => [page.url, index]));
        const abortController = new AbortController();
        enrichmentAbortRef.current = abortController;
        setProgress({completed: 0, total: prepared.length, label: 'Seitentitel, Status und Weiterleitungen werden geprüft …'});

        try {
            for await (const event of ipc.app.EnrichImportedPages(
                {pages: result.pages},
                {signal: abortController.signal},
            )) {
                if (event.page) {
                    const index = pageIndexes.get(event.page.url);
                    if (index !== undefined) prepared[index] = {...prepared[index], ...event.page};
                }
                setProgress({completed: event.completed, total: event.total, label: 'Seitentitel, Status und Weiterleitungen werden geprüft …'});
            }
        } finally {
            if (enrichmentAbortRef.current === abortController) enrichmentAbortRef.current = null;
        }

        if (abortController.signal.aborted) return;
        setPages(prepared);
        setProjectName(result.projectName);
        setBaseUrl(result.baseUrl);
        setWarnings(result.warnings);
        setProgress(null);
    };

    const chooseXml = async () => {
        setLoading(true);
        setError('');
        try {
            await showResult(await ipc.app.SelectAndParseXml({}));
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : 'XML-Sitemap konnte nicht importiert werden.');
        } finally {
            setLoading(false);
        }
    };

    const loadXmlUrl = async () => {
        setLoading(true);
        setError('');
        try {
            await showResult(await ipc.app.ParseXmlUrl({url: sitemapUrl}));
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : 'XML-Sitemap konnte nicht geladen werden.');
        } finally {
            setLoading(false);
        }
    };

    const runCrawl = async () => {
        setLoading(true);
        setError('');
        const abortController = new AbortController();
        enrichmentAbortRef.current = abortController;
        const crawledPages: ImportXmlResponse['pages'] = [];
        setProgress({completed: 0, total: 1, label: 'Website wird gecrawlt …'});

        try {
            for await (const event of ipc.app.CrawlWebsite({
                startUrl: crawlUrl,
                maxPages,
                maxDepth,
                ignoreQueryParameters,
            }, {signal: abortController.signal})) {
                if (event.page) crawledPages.push(event.page);
                setProgress({completed: event.completed, total: event.discovered, label: 'Website wird gecrawlt …'});
            }
            if (abortController.signal.aborted) return;

            const effectiveUrl = crawledPages[0]?.finalUrl || crawlUrl;
            const origin = new URL(effectiveUrl).origin;
            const host = new URL(effectiveUrl).hostname.replace(/^www\./, '');
            setPages(prepareImportPages(crawledPages));
            setProjectName(`Import ${host}`);
            setBaseUrl(origin);
            setWarnings(crawledPages.length >= maxPages ? [`Seitenlimit von ${maxPages} erreicht`] : []);
            setProgress(null);
        } catch (caught) {
            if (!abortController.signal.aborted) {
                setError(caught instanceof Error ? caught.message : 'Website konnte nicht gecrawlt werden.');
            }
        } finally {
            if (enrichmentAbortRef.current === abortController) enrichmentAbortRef.current = null;
            setLoading(false);
        }
    };

    const togglePage = (url: string, selected: boolean) => {
        setPages((current) => current.map((page) => page.url === url ? {...page, selected} : page));
    };

    const updateTitle = (url: string, title: string) => {
        setPages((current) => current.map((page) => page.url === url ? {...page, title} : page));
    };

    const toggleFiltered = (selected: boolean) => {
        const urls = new Set(filteredPages.map(({url}) => url));
        setPages((current) => current.map((page) => urls.has(page.url) ? {...page, selected} : page));
    };

    const apply = async () => {
        setApplying(true);
        try {
            if (await onImport(pages, projectName, baseUrl)) onClose();
        } finally {
            setApplying(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#07142e]/50 p-5 backdrop-blur-sm" role="presentation" onMouseDown={close}>
            <section
                className="flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
                role="dialog"
                aria-modal="true"
                aria-labelledby="import-website-title"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <header className="flex shrink-0 items-start justify-between border-b border-border px-6 py-5">
                    <div>
                        <span className="block text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Bestehende Struktur</span>
                        <h2 className="mb-1 mt-1 text-xl tracking-tight" id="import-website-title">Website importieren</h2>
                        <p className="m-0 text-xs text-muted-foreground">Website crawlen oder XML-Sitemap laden, Seiten prüfen, neues Projekt erzeugen.</p>
                    </div>
                    <Button variant="ghost" size="icon" aria-label="Dialog schließen" disabled={applying} onClick={close}>
                        <X size={18}/>
                    </Button>
                </header>

                {pages.length === 0 ? (
                    <div className="grid grid-cols-2 gap-4 p-6">
                        <div className="flex min-h-52 flex-col items-start rounded-xl border border-border bg-background p-5">
                            <span className="mb-4 grid size-10 place-items-center rounded-lg bg-primary/10 text-primary"><FileCode2 size={21}/></span>
                            <strong className="text-sm">XML-Sitemap importieren</strong>
                            <span className="mt-2 text-xs leading-relaxed text-muted-foreground">URL eingeben oder lokale `.xml`- beziehungsweise `.xml.gz`-Datei auswählen.</span>
                            <form className="mt-4 flex w-full gap-2" onSubmit={(event) => { event.preventDefault(); void loadXmlUrl(); }}>
                                <Input
                                    className="h-9 min-w-0 flex-1 text-xs"
                                    aria-label="URL der XML-Sitemap"
                                    placeholder="https://example.com/sitemap.xml"
                                    value={sitemapUrl}
                                    disabled={loading}
                                    onChange={(event) => setSitemapUrl(event.target.value)}
                                />
                                <Button className="h-9 text-xs" type="submit" disabled={loading || !sitemapUrl.trim()}>Laden</Button>
                            </form>
                            <div className="my-3 flex w-full items-center gap-3 text-[9px] uppercase tracking-wider text-muted-foreground before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">oder</div>
                            <Button className="h-9 w-full text-xs" type="button" variant="outline" disabled={loading} onClick={() => void chooseXml()}>
                                {loading ? 'Sitemap wird gelesen …' : 'Datei auswählen'}
                            </Button>
                        </div>
                        <div className="flex min-h-52 flex-col items-start rounded-xl border border-border bg-background p-5">
                            <span className="mb-4 grid size-10 place-items-center rounded-lg bg-primary/10 text-primary"><Globe2 size={21}/></span>
                            <strong className="text-sm">Website crawlen</strong>
                            <span className="mt-2 text-xs leading-relaxed text-muted-foreground">Interne Links ab Start-URL verfolgen und Seiten automatisch erfassen.</span>
                            <form className="mt-4 w-full space-y-3" onSubmit={(event) => { event.preventDefault(); void runCrawl(); }}>
                                <Input
                                    className="h-9 text-xs"
                                    aria-label="Start-URL der Website"
                                    placeholder="https://example.com"
                                    value={crawlUrl}
                                    disabled={loading}
                                    onChange={(event) => setCrawlUrl(event.target.value)}
                                />
                                <div className="grid grid-cols-2 gap-2">
                                    <label className="text-[10px] font-semibold text-muted-foreground">
                                        Max. Seiten
                                        <Input className="mt-1 h-8 text-xs" type="number" min={1} max={2000} value={maxPages} disabled={loading} onChange={(event) => setMaxPages(Number(event.target.value))}/>
                                    </label>
                                    <label className="text-[10px] font-semibold text-muted-foreground">
                                        Max. Tiefe
                                        <Input className="mt-1 h-8 text-xs" type="number" min={1} max={30} value={maxDepth} disabled={loading} onChange={(event) => setMaxDepth(Number(event.target.value))}/>
                                    </label>
                                </div>
                                <label className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                    <Checkbox checked={ignoreQueryParameters} disabled={loading} onCheckedChange={(checked) => setIgnoreQueryParameters(checked === true)}/>
                                    Query-Parameter ignorieren
                                </label>
                                <Button className="h-9 w-full text-xs" type="submit" disabled={loading || !crawlUrl.trim()}>{loading ? 'Analyse läuft …' : 'Crawl starten'}</Button>
                            </form>
                        </div>
                        {progress && (
                            <div className="col-span-2 rounded-lg border border-primary/20 bg-primary/5 p-4" role="status" aria-live="polite">
                                <div className="mb-2 flex justify-between text-xs">
                                    <strong>{progress.label}</strong>
                                    <span className="tabular-nums text-muted-foreground">{progress.completed} / {progress.total}</span>
                                </div>
                                <div className="h-2 overflow-hidden rounded-full bg-muted">
                                    <div className="h-full rounded-full bg-primary transition-[width]" style={{width: `${progress.total ? (progress.completed / progress.total) * 100 : 0}%`}}/>
                                </div>
                            </div>
                        )}
                        {error && (
                            <div className="col-span-2 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive" role="alert">
                                <TriangleAlert className="mt-px shrink-0" size={15}/>{error}
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="grid shrink-0 grid-cols-[1fr_1fr_auto] gap-3 border-b border-border p-4">
                            <label className="text-[10px] font-semibold text-muted-foreground">
                                Projektname
                                <Input className="mt-1 h-9 text-xs text-foreground" value={projectName} onChange={(event) => setProjectName(event.target.value)}/>
                            </label>
                            <label className="text-[10px] font-semibold text-muted-foreground">
                                Basis-URL
                                <Input className="mt-1 h-9 text-xs text-foreground" value={baseUrl} readOnly/>
                            </label>
                            <Button className="self-end" variant="outline" onClick={() => { setPages([]); setWarnings([]); setError(''); }} disabled={loading}>Andere Quelle</Button>
                        </div>

                        {warnings.length > 0 && (
                            <div className="mx-4 mt-4 flex shrink-0 items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
                                <TriangleAlert className="mt-px shrink-0" size={15}/>
                                <div><strong>{warnings.length} Importwarnungen</strong><span className="ml-1">{warnings.slice(0, 2).join(' · ')}</span></div>
                            </div>
                        )}

                        <div className="flex shrink-0 items-center justify-between gap-4 px-4 py-3">
                            <div className="relative w-full max-w-sm">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14}/>
                                <Input className="h-8 pl-8 text-xs" placeholder="Titel oder URL filtern" value={search} onChange={(event) => setSearch(event.target.value)}/>
                            </div>
                            <span className="whitespace-nowrap text-[10px] text-muted-foreground">{selectedCount} von {pages.length} Seiten ausgewählt</span>
                        </div>

                        <div className="min-h-0 flex-1 overflow-auto border-y border-border">
                            <table className="w-full table-fixed border-collapse text-left text-xs">
                                <thead className="sticky top-0 z-10 bg-muted text-[10px] uppercase tracking-wide text-muted-foreground">
                                    <tr>
                                        <th className="w-11 px-4 py-2">
                                            <Checkbox checked={allFilteredSelected} aria-label="Gefilterte Seiten auswählen" onCheckedChange={(checked) => toggleFiltered(checked === true)}/>
                                        </th>
                                        <th className="w-[30%] px-2 py-2">Titel</th>
                                        <th className="px-2 py-2">URL</th>
                                        <th className="w-24 px-2 py-2">HTTP</th>
                                        <th className="w-36 px-2 py-2">Erkannter Parent</th>
                                        <th className="w-20 px-2 py-2">Hinweis</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {visiblePages.map((page) => (
                                        <tr className="border-t border-border/70 hover:bg-muted/40" key={page.url}>
                                            <td className="px-4 py-2"><Checkbox checked={page.selected} aria-label={`${page.title} importieren`} onCheckedChange={(checked) => togglePage(page.url, checked === true)}/></td>
                                            <td className="px-2 py-1.5"><Input className="h-7 border-transparent bg-transparent px-1.5 text-xs shadow-none focus-visible:border-input" value={page.title} onChange={(event) => updateTitle(page.url, event.target.value)}/></td>
                                            <td className="truncate px-2 py-2 font-mono text-[10px] text-primary" title={page.finalUrl && page.finalUrl !== page.url ? `${page.url} → ${page.finalUrl}` : page.url}>{page.path}</td>
                                            <td className="px-2 py-2 text-[10px]">
                                                <span className={page.httpStatus >= 400 ? 'font-semibold text-destructive' : page.finalUrl && page.finalUrl !== page.url ? 'font-semibold text-amber-600' : 'text-muted-foreground'}>
                                                    {page.httpStatus || '—'}{page.finalUrl && page.finalUrl !== page.url ? ' ↪' : ''}
                                                </span>
                                            </td>
                                            <td className="truncate px-2 py-2 text-[10px] text-muted-foreground" title={page.parentPath ?? ''}>{page.parentPath ?? '—'}</td>
                                            <td className="px-2 py-2 text-[10px] text-amber-600" title={page.warnings.join('\n')}>{page.warnings.length || '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredPages.length > MAX_VISIBLE_ROWS && (
                                <p className="m-0 p-3 text-center text-[10px] text-muted-foreground">Erste {MAX_VISIBLE_ROWS} Treffer sichtbar. Suche nutzen, um weitere Seiten zu bearbeiten.</p>
                            )}
                            {filteredPages.length === 0 && <p className="m-0 p-8 text-center text-xs text-muted-foreground">Keine Seiten gefunden.</p>}
                        </div>
                    </>
                )}

                <footer className="flex shrink-0 items-center justify-between border-t border-border px-5 py-4">
                    <span className="text-[10px] text-muted-foreground">Import ersetzt aktuelles Projekt erst nach Bestätigung.</span>
                    <div className="flex gap-2 [&_button]:h-9 [&_button]:text-xs">
                        <Button variant="outline" onClick={close} disabled={applying}>Abbrechen</Button>
                        {pages.length > 0 && <Button onClick={() => void apply()} disabled={!selectedCount || !projectName.trim() || applying}>{applying ? 'Importiere …' : `${selectedCount} Seiten importieren`}</Button>}
                    </div>
                </footer>
            </section>
        </div>
    );
}
