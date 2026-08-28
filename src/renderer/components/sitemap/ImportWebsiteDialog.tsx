import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert.tsx';
import {Button} from '@/components/ui/button.tsx';
import {Checkbox} from '@/components/ui/checkbox.tsx';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
} from '@/components/ui/dialog.tsx';
import {Input} from '@/components/ui/input.tsx';
import {Progress} from '@/components/ui/progress.tsx';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table.tsx';
import type {ImportXmlResponse} from '@/gen/app.ts';
import {ipc} from '@/gen/ipc.ts';
import {useTranslation} from '@/lib/i18n/context.tsx';
import {prepareImportPages, type ImportPreviewPage} from '@/lib/import.ts';
import {FileCode2, Globe2, Search, TriangleAlert, X} from 'lucide-react';
import {useCallback, useMemo, useRef, useState} from 'react';

type ImportWebsiteDialogProps = {
    onClose: () => void;
    onImport: (pages: ImportPreviewPage[], projectName: string, baseUrl: string) => Promise<boolean>;
};

const MAX_VISIBLE_ROWS = 250;

export function ImportWebsiteDialog({onClose, onImport}: ImportWebsiteDialogProps) {
    const {locale, t} = useTranslation();
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

    const filteredPages = useMemo(() => {
        const term = search.trim().toLocaleLowerCase(locale);
        if (!term) return pages;
        return pages.filter((page) => `${page.title} ${page.path} ${page.seoTitle} ${page.seoDescription} ${page.canonicalUrl} ${page.warnings.join(' ')}`.toLocaleLowerCase(locale).includes(term));
    }, [locale, pages, search]);
    const visiblePages = filteredPages.slice(0, MAX_VISIBLE_ROWS);
    const selectedCount = pages.filter(({selected}) => selected).length;
    const allFilteredSelected = filteredPages.length > 0 && filteredPages.every(({selected}) => selected);

    const showResult = async (result: ImportXmlResponse) => {
        if (result.canceled) return;

        const prepared = prepareImportPages(result.pages);
        const pageIndexes = new Map(prepared.map((page, index) => [page.url, index]));
        const abortController = new AbortController();
        enrichmentAbortRef.current = abortController;
        setProgress({completed: 0, total: prepared.length, label: t('import.dialog.enrichProgress')});

        try {
            for await (const event of ipc.app.EnrichImportedPages(
                {pages: result.pages},
                {signal: abortController.signal},
            )) {
                if (event.page) {
                    const index = pageIndexes.get(event.page.url);
                    if (index !== undefined) prepared[index] = {...prepared[index], ...event.page};
                }
                setProgress({completed: event.completed, total: event.total, label: t('import.dialog.enrichProgress')});
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
            setError(caught instanceof Error ? caught.message : t('import.dialog.xmlImportFailed'));
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
            setError(caught instanceof Error ? caught.message : t('import.dialog.xmlLoadFailed'));
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
        setProgress({completed: 0, total: 1, label: t('import.dialog.crawlProgress')});

        try {
            for await (const event of ipc.app.CrawlWebsite({
                startUrl: crawlUrl,
                maxPages,
                maxDepth,
                ignoreQueryParameters,
            }, {signal: abortController.signal})) {
                if (event.page) crawledPages.push(event.page);
                setProgress({completed: event.completed, total: event.discovered, label: t('import.dialog.crawlProgress')});
            }
            if (abortController.signal.aborted) return;

            const effectiveUrl = crawledPages[0]?.finalUrl || crawlUrl;
            const origin = new URL(effectiveUrl).origin;
            const host = new URL(effectiveUrl).hostname.replace(/^www\./, '');
            setPages(prepareImportPages(crawledPages));
            setProjectName(t('import.dialog.crawlProjectName', {host}));
            setBaseUrl(origin);
            setWarnings(crawledPages.length >= maxPages ? [t('import.dialog.pageLimitReached', {count: maxPages})] : []);
            setProgress(null);
        } catch (caught) {
            if (!abortController.signal.aborted) {
                setError(caught instanceof Error ? caught.message : t('import.dialog.crawlFailed'));
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
        <Dialog open onOpenChange={(open) => {
            if (!open && !applying) close();
        }}>
            <DialogContent
                showCloseButton={false}
                className="flex max-h-[88vh] w-full max-w-5xl flex-col gap-0 overflow-hidden rounded-xl bg-card p-0"
                onEscapeKeyDown={(event) => {
                    if (applying) event.preventDefault();
                }}
                onInteractOutside={(event) => {
                    if (applying) event.preventDefault();
                }}
            >
                <header className="flex shrink-0 items-start justify-between border-b border-border px-6 py-5">
                    <div>
                        <span className="block text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{t('import.dialog.badge')}</span>
                        <DialogTitle className="mb-1 mt-1 text-xl">{t('import.dialog.title')}</DialogTitle>
                        <DialogDescription className="m-0 text-xs">{t('import.dialog.description')}</DialogDescription>
                    </div>
                    <Button variant="ghost" size="icon" aria-label={t('import.dialog.close')} disabled={applying} onClick={close}>
                        <X size={18}/>
                    </Button>
                </header>

                {pages.length === 0 ? (
                    <div className="grid grid-cols-2 gap-4 p-6">
                        <div className="flex min-h-52 flex-col items-start rounded-xl border border-border bg-background p-5">
                            <span className="mb-4 grid size-10 place-items-center rounded-lg bg-primary/10 text-primary"><FileCode2 size={21}/></span>
                            <strong className="text-sm">{t('import.dialog.xmlCardTitle')}</strong>
                            <span className="mt-2 text-xs leading-relaxed text-muted-foreground">{t('import.dialog.xmlCardDescription')}</span>
                            <form className="mt-4 flex w-full gap-2" onSubmit={(event) => { event.preventDefault(); void loadXmlUrl(); }}>
                                <Input
                                    className="h-9 min-w-0 flex-1 text-xs"
                                    aria-label={t('import.dialog.xmlUrlLabel')}
                                    placeholder="https://example.com/sitemap.xml"
                                    value={sitemapUrl}
                                    disabled={loading}
                                    onChange={(event) => setSitemapUrl(event.target.value)}
                                />
                                <Button className="h-9 text-xs" type="submit" disabled={loading || !sitemapUrl.trim()}>{t('import.dialog.load')}</Button>
                            </form>
                            <div className="my-3 flex w-full items-center gap-3 text-[9px] uppercase tracking-wider text-muted-foreground before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">{t('import.dialog.or')}</div>
                            <Button className="h-9 w-full text-xs" type="button" variant="outline" disabled={loading} onClick={() => void chooseXml()}>
                                {loading ? t('import.dialog.readingSitemap') : t('import.dialog.chooseFile')}
                            </Button>
                        </div>
                        <div className="flex min-h-52 flex-col items-start rounded-xl border border-border bg-background p-5">
                            <span className="mb-4 grid size-10 place-items-center rounded-lg bg-primary/10 text-primary"><Globe2 size={21}/></span>
                            <strong className="text-sm">{t('import.dialog.crawlCardTitle')}</strong>
                            <span className="mt-2 text-xs leading-relaxed text-muted-foreground">{t('import.dialog.crawlCardDescription')}</span>
                            <form className="mt-4 w-full space-y-3" onSubmit={(event) => { event.preventDefault(); void runCrawl(); }}>
                                <Input
                                    className="h-9 text-xs"
                                    aria-label={t('import.dialog.crawlUrlLabel')}
                                    placeholder="https://example.com"
                                    value={crawlUrl}
                                    disabled={loading}
                                    onChange={(event) => setCrawlUrl(event.target.value)}
                                />
                                <div className="grid grid-cols-2 gap-2">
                                    <label className="text-[10px] font-semibold text-muted-foreground">
                                        {t('import.dialog.maxPages')}
                                        <Input className="mt-1 h-8 text-xs" type="number" min={1} max={2000} value={maxPages} disabled={loading} onChange={(event) => setMaxPages(Number(event.target.value))}/>
                                    </label>
                                    <label className="text-[10px] font-semibold text-muted-foreground">
                                        {t('import.dialog.maxDepth')}
                                        <Input className="mt-1 h-8 text-xs" type="number" min={1} max={30} value={maxDepth} disabled={loading} onChange={(event) => setMaxDepth(Number(event.target.value))}/>
                                    </label>
                                </div>
                                <label className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                    <Checkbox checked={ignoreQueryParameters} disabled={loading} onCheckedChange={(checked) => setIgnoreQueryParameters(checked === true)}/>
                                    {t('import.dialog.ignoreQuery')}
                                </label>
                                <Button className="h-9 w-full text-xs" type="submit" disabled={loading || !crawlUrl.trim()}>{loading ? t('import.dialog.crawlRunning') : t('import.dialog.startCrawl')}</Button>
                            </form>
                        </div>
                        {progress && (
                            <Alert className="col-span-2 border-primary/20 bg-primary/5" role="status" aria-live="polite">
                                <AlertTitle className="flex justify-between text-xs">
                                    <span>{progress.label}</span>
                                    <span className="tabular-nums text-muted-foreground">{progress.completed} / {progress.total}</span>
                                </AlertTitle>
                                <AlertDescription>
                                    <Progress
                                        className="mt-2 h-2"
                                        value={progress.total ? (progress.completed / progress.total) * 100 : 0}
                                    />
                                </AlertDescription>
                            </Alert>
                        )}
                        {error && (
                            <Alert className="col-span-2" variant="destructive">
                                <TriangleAlert/>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="grid shrink-0 grid-cols-[1fr_1fr_auto] gap-3 border-b border-border p-4">
                            <label className="text-[10px] font-semibold text-muted-foreground">
                                {t('import.dialog.projectName')}
                                <Input className="mt-1 h-9 text-xs text-foreground" value={projectName} onChange={(event) => setProjectName(event.target.value)}/>
                            </label>
                            <label className="text-[10px] font-semibold text-muted-foreground">
                                {t('import.dialog.baseUrl')}
                                <Input className="mt-1 h-9 text-xs text-foreground" value={baseUrl} readOnly/>
                            </label>
                            <Button className="self-end" variant="outline" onClick={() => { setPages([]); setWarnings([]); setError(''); }} disabled={loading}>{t('import.dialog.otherSource')}</Button>
                        </div>

                        {warnings.length > 0 && (
                            <Alert className="mx-4 mt-4 shrink-0 border-primary/25 bg-primary/5 text-xs">
                                <TriangleAlert/>
                                <AlertTitle>{t('import.dialog.importWarnings', {count: warnings.length})}</AlertTitle>
                                <AlertDescription>{warnings.slice(0, 2).join(' · ')}</AlertDescription>
                            </Alert>
                        )}

                        <div className="flex shrink-0 items-center justify-between gap-4 px-4 py-3">
                            <div className="relative w-full max-w-sm">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14}/>
                                <Input className="h-8 pl-8 text-xs" placeholder={t('import.dialog.searchPlaceholder')} value={search} onChange={(event) => setSearch(event.target.value)}/>
                            </div>
                            <span className="whitespace-nowrap text-[10px] text-muted-foreground">{t('import.dialog.selectedOfTotal', {selected: selectedCount, total: pages.length})}</span>
                        </div>

                        <div className="min-h-0 flex-1 overflow-auto border-y border-border">
                            <Table className="w-full table-fixed border-collapse text-left text-xs">
                                <TableHeader className="sticky top-0 z-10 bg-muted text-[10px] uppercase tracking-wide text-muted-foreground">
                                    <TableRow>
                                        <TableHead className="w-11 px-4 py-2">
                                            <Checkbox checked={allFilteredSelected} aria-label={t('import.dialog.selectFilteredAria')} onCheckedChange={(checked) => toggleFiltered(checked === true)}/>
                                        </TableHead>
                                        <TableHead className="w-[30%] px-2 py-2">{t('import.dialog.colTitle')}</TableHead>
                                        <TableHead className="px-2 py-2">{t('import.dialog.colUrl')}</TableHead>
                                        <TableHead className="w-24 px-2 py-2">{t('import.dialog.colHttp')}</TableHead>
                                        <TableHead className="w-36 px-2 py-2">{t('import.dialog.colParent')}</TableHead>
                                        <TableHead className="w-20 px-2 py-2">{t('import.dialog.colHint')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {visiblePages.map((page) => (
                                        <TableRow className="border-t border-border/70 hover:bg-muted/40" key={page.url}>
                                            <TableCell className="px-4 py-2"><Checkbox checked={page.selected} aria-label={t('import.dialog.importPageAria', {title: page.title})} onCheckedChange={(checked) => togglePage(page.url, checked === true)}/></TableCell>
                                            <TableCell className="px-2 py-1.5"><Input className="h-7 border-transparent bg-transparent px-1.5 text-xs shadow-none focus-visible:border-input" value={page.title} onChange={(event) => updateTitle(page.url, event.target.value)}/></TableCell>
                                            <TableCell className="truncate px-2 py-2 font-mono text-[10px] text-primary" title={page.finalUrl && page.finalUrl !== page.url ? `${page.url} → ${page.finalUrl}` : page.url}>{page.path}</TableCell>
                                            <TableCell className="px-2 py-2 text-[10px]">
                                                <span className={page.httpStatus >= 400 ? 'font-semibold text-destructive' : page.finalUrl && page.finalUrl !== page.url ? 'font-semibold text-amber-600' : 'text-muted-foreground'}>
                                                    {page.httpStatus || '—'}{page.finalUrl && page.finalUrl !== page.url ? ' ↪' : ''}
                                                </span>
                                            </TableCell>
                                            <TableCell className="truncate px-2 py-2 text-[10px] text-muted-foreground" title={page.parentPath ?? ''}>{page.parentPath ?? '—'}</TableCell>
                                            <TableCell className="px-2 py-2 text-[10px] text-amber-600" title={page.warnings.join('\n')}>{page.warnings.length || '—'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            {filteredPages.length > MAX_VISIBLE_ROWS && (
                                <p className="m-0 p-3 text-center text-[10px] text-muted-foreground">{t('import.dialog.visibleLimitNote', {count: MAX_VISIBLE_ROWS})}</p>
                            )}
                            {filteredPages.length === 0 && <p className="m-0 p-8 text-center text-xs text-muted-foreground">{t('import.dialog.noPagesFound')}</p>}
                        </div>
                    </>
                )}

                <DialogFooter className="flex-row items-center justify-between border-t border-border px-5 py-4 sm:justify-between">
                    <span className="text-[10px] text-muted-foreground">{t('import.dialog.footerNote')}</span>
                    <div className="flex gap-2 [&_button]:h-9 [&_button]:text-xs">
                        <Button variant="outline" onClick={close} disabled={applying}>{t('common.cancel')}</Button>
                        {pages.length > 0 && <Button onClick={() => void apply()} disabled={!selectedCount || !projectName.trim() || applying}>{applying ? t('import.dialog.importing') : t('import.dialog.importCount', {count: selectedCount})}</Button>}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
