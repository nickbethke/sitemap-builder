import {app, BrowserWindow, ipc, Menu, MenuItem, MenuWithRole, Theme} from '@mobrowser/api';
import {readFile, rename, rm, stat, writeFile} from 'node:fs/promises';
import {extname} from 'node:path';
import * as process from 'node:process';
import {gzipSync, gunzipSync} from 'node:zlib';
import {randomUUID} from 'node:crypto';
import {
    CrawlRequest,
    EnrichImportRequest,
    ExportRequest,
    ImportXmlUrlRequest,
    SaveSitemapRequest,
    SetThemeRequest
} from './gen/app';
import {AppServiceDescriptor, MenuActionServiceDescriptor, OpenFileServiceDescriptor} from './gen/ipc_service';
import {crawlWebsite} from './import/crawler';
import {enrichImportedPage} from './import/page-parser';
import {parseXmlSitemap, parseXmlSitemapUrl} from './import/xml';
import {validateSitemapDocument} from '../shared/sitemap-schema';

const MAGIC = Buffer.from('SMAP');
const FORMAT_VERSION = 1;
const MAX_JSON_SIZE = 10 * 1024 * 1024;
const MAX_FILE_SIZE = 12 * 1024 * 1024;
const MAX_EXPORT_SIZE = 50 * 1024 * 1024;
const MAX_IMPORT_PAGES = 10_000;
const startupSitemapPath = app.launchInfo.files.find((path) => extname(path).toLowerCase() === '.smap') ?? '';
let currentSitemapPath = '';
const pendingOpenedSitemapPaths = new Set<string>();
const openedSitemaps = ipc.registerService(OpenFileServiceDescriptor);
const menuActions = ipc.registerService(MenuActionServiceDescriptor);

const EXPORT_FORMATS: Record<string, { extension: string; label: string; binary?: boolean }> = {
    xml: {extension: 'xml', label: 'XML'},
    csv: {extension: 'csv', label: 'CSV'},
    md: {extension: 'md', label: 'Markdown'},
    html: {extension: 'html', label: 'HTML'},
    pdf: {extension: 'pdf', label: 'PDF', binary: true},
};

const win = new BrowserWindow({
    url: app.url,
    title: 'Sitemap Builder',
    size: {width: 1440, height: 900},
    minimumSize: {width: 1200, height: 800},
    windowTitleVisible: false,
    windowTitlebarVisible: process.platform !== 'darwin',
});
win.centerWindow();
win.show();

function encodeSitemap(payload: string): Buffer {
    if (Buffer.byteLength(payload, 'utf8') > MAX_JSON_SIZE) throw new Error('Sitemap ist größer als 10 MB.');
    validateSitemapDocument(JSON.parse(payload));
    const header = Buffer.concat([MAGIC, Buffer.from([FORMAT_VERSION])]);
    return Buffer.concat([header, gzipSync(Buffer.from(payload, 'utf8'), {level: 9})]);
}

async function openSitemapFile(path: string) {
    if (extname(path).toLowerCase() !== '.smap') throw new Error('Keine gültige .smap-Datei.');
    const file = await stat(path);
    if (!file.isFile()) throw new Error('Pfad ist keine Datei.');
    if (file.size > MAX_FILE_SIZE) throw new Error('Datei ist größer als 12 MB.');
    return {path, payload: decodeSitemap(await readFile(path))};
}

function decodeSitemap(file: Buffer): string {
    if (file.length < 6 || !file.subarray(0, MAGIC.length).equals(MAGIC)) {
        throw new Error('Keine gültige .smap-Datei.');
    }
    if (file[MAGIC.length] !== FORMAT_VERSION) {
        throw new Error(`.smap-Version ${file[MAGIC.length]} wird nicht unterstützt.`);
    }

    try {
        const payload = gunzipSync(file.subarray(MAGIC.length + 1), {maxOutputLength: MAX_JSON_SIZE}).toString('utf8');
        validateSitemapDocument(JSON.parse(payload));
        return payload;
    } catch {
        throw new Error('.smap-Datei ist beschädigt oder ungültig.');
    }
}

app.handle('openFile', (path) => {
    void openSitemapFile(path)
        .then((sitemap) => {
            pendingOpenedSitemapPaths.add(sitemap.path);
            openedSitemaps.WatchOpenedSitemaps(sitemap);
        })
        .catch((error: unknown) => console.error('Sitemap konnte nicht geöffnet werden:', error));
});

ipc.registerService(AppServiceDescriptor, {
    async SetTheme(request: SetThemeRequest) {
        if (!['light', 'dark', 'system'].includes(request.theme)) throw new Error('Ungültiges Farbschema.');
        app.setTheme(request.theme as Theme);
        return {};
    },
    async SaveSitemap(request: SaveSitemapRequest) {
        let path = request.saveAs ? '' : currentSitemapPath;
        if (!path) {
            const result = await app.showSaveDialog({
                parentWindow: win,
                title: 'Sitemap speichern',
                defaultPath: 'website-struktur.smap',
                filters: [{name: 'Sitemap Builder Datei', extensions: ['smap']}],
            });
            if (result.canceled || !result.path) return {canceled: true, path: ''};
            path = result.path;
        }
        if (extname(path).toLowerCase() !== '.smap') path += '.smap';

        const temporaryPath = `${path}.${randomUUID()}.tmp`;
        try {
            await writeFile(temporaryPath, encodeSitemap(request.payload), {flag: 'wx', mode: 0o600});
            await rename(temporaryPath, path);
        } finally {
            await rm(temporaryPath, {force: true}).catch(() => undefined);
        }
        currentSitemapPath = path;
        return {canceled: false, path};
    },
    async OpenSitemap() {
        const result = await app.showOpenDialog({
            parentWindow: win,
            title: 'Sitemap öffnen',
            selectionPolicy: 'files',
            filters: [{name: 'Sitemap Builder Datei', extensions: ['smap']}],
        });
        if (result.canceled || !result.paths[0]) return {canceled: true, path: '', payload: ''};

        const sitemap = await openSitemapFile(result.paths[0]);
        currentSitemapPath = sitemap.path;
        return {canceled: false, ...sitemap};
    },
    async GetStartupSitemap() {
        if (!startupSitemapPath) return {canceled: true, path: '', payload: ''};
        const sitemap = await openSitemapFile(startupSitemapPath);
        currentSitemapPath = sitemap.path;
        return {canceled: false, ...sitemap};
    },
    async ResolveOpenedSitemap(request) {
        if (!pendingOpenedSitemapPaths.delete(request.path)) throw new Error('Dateiöffnung ist nicht mehr gültig.');
        if (request.accepted) currentSitemapPath = request.path;
        return {};
    },
    async* ParseXmlUrl(request: ImportXmlUrlRequest, context) {
        yield {canceled: false, ...await parseXmlSitemapUrl(request.url, context.signal)};
    },
    async* CrawlWebsite(request: CrawlRequest, context) {
        yield* crawlWebsite(request, context.signal);
    },
    async* EnrichImportedPages(request: EnrichImportRequest, context) {
        if (request.pages.length > MAX_IMPORT_PAGES) throw new Error(`Import enthält mehr als ${MAX_IMPORT_PAGES} Seiten.`);
        const total = request.pages.length;
        const concurrency = 6;
        const pending = new Map<number, Promise<(typeof request.pages)[number]>>();
        let nextIndex = 0;
        let completed = 0;

        const fillQueue = () => {
            while (nextIndex < total && pending.size < concurrency) {
                const index = nextIndex;
                nextIndex += 1;
                pending.set(index, enrichImportedPage(request.pages[index], context.signal));
            }
        };

        fillQueue();
        while (pending.size > 0) {
            const result = await Promise.race([...pending].map(async ([index, promise]) => ({
                index,
                page: await promise,
            })));
            pending.delete(result.index);
            completed += 1;
            yield {completed, total, page: result.page};
            fillQueue();
        }
    },
    async SelectAndParseXml() {
        const result = await app.showOpenDialog({
            parentWindow: win,
            title: 'XML-Sitemap importieren',
            selectionPolicy: 'files',
            filters: [{name: 'XML-Sitemap', extensions: ['xml', 'gz']}],
        });
        if (result.canceled || !result.paths[0]) {
            return {canceled: true, pages: [], baseUrl: '', projectName: '', warnings: []};
        }

        const parsed = await parseXmlSitemap(result.paths[0]);
        return {canceled: false, ...parsed};
    },
    async ExportFile(request: ExportRequest) {
        const config = EXPORT_FORMATS[request.format];
        if (!config) throw new Error('Nicht unterstütztes Exportformat.');
        if (Buffer.byteLength(request.content, config.binary ? 'base64' : 'utf8') > MAX_EXPORT_SIZE) {
            throw new Error('Export ist größer als 50 MB.');
        }
        const result = await app.showSaveDialog({
            parentWindow: win,
            title: `${config.label} exportieren`,
            defaultPath: `${request.suggestedName || 'sitemap'}.${config.extension}`,
            filters: [{name: `${config.label} Datei`, extensions: [config.extension]}],
        });
        if (result.canceled || !result.path) return {canceled: true, path: ''};
        const path = extname(result.path).toLowerCase() === `.${config.extension}`
            ? result.path
            : `${result.path}.${config.extension}`;
        if (config.binary) {
            await writeFile(path, Buffer.from(request.content, 'base64'), {mode: 0o600});
        } else {
            await writeFile(path, request.content, {encoding: 'utf8', mode: 0o600});
        }
        return {canceled: false, path};
    },
});

function emitMenuAction(action: string) {
    menuActions.WatchMenuActions({action});
}

app.setMenu(new Menu({
    items: [
        new MenuWithRole({
            role: 'macAppMenu',
            items: ['macHideApp', 'macHideOthers', 'macShowAll', 'separator', 'quit'],
        }),
        new MenuWithRole({
            role: 'fileMenu',
            items: [
                new MenuItem({
                    id: 'new',
                    label: 'Neue Sitemap…',
                    shortcut: 'CommandOrControl+N',
                    action: () => emitMenuAction('new')
                }),
                new MenuItem({
                    id: 'open',
                    label: 'Öffnen…',
                    shortcut: 'CommandOrControl+O',
                    action: () => emitMenuAction('open')
                }),
                new MenuItem({
                    id: 'import-website',
                    label: 'Bestehende Website importieren…',
                    action: () => emitMenuAction('import-website')
                }),
                'separator',
                new MenuItem({id: 'save', label: 'Speichern', action: () => emitMenuAction('save')}),
                new MenuItem({
                    id: 'save-as',
                    label: 'Speichern unter…',
                    shortcut: 'CommandOrControl+Shift+S',
                    action: () => emitMenuAction('save-as')
                }),
                'separator',
                new Menu({
                    label: 'Exportieren',
                    items: [
                        new MenuItem({
                            id: 'export-xml',
                            label: 'XML-Sitemap…',
                            action: () => emitMenuAction('export-xml')
                        }),
                        new MenuItem({id: 'export-csv', label: 'CSV…', action: () => emitMenuAction('export-csv')}),
                        new MenuItem({id: 'export-pdf', label: 'PDF…', action: () => emitMenuAction('export-pdf')}),
                        new MenuItem({id: 'export-md', label: 'Markdown…', action: () => emitMenuAction('export-md')}),
                        new MenuItem({
                            id: 'export-html',
                            label: 'Statische HTML-Ansicht…',
                            action: () => emitMenuAction('export-html')
                        }),
                    ],
                }),
                'separator',
                'closeWindow',
            ],
        }),
        new MenuWithRole({
            role: 'editMenu',
            items: [
                new MenuItem({id: 'undo', label: 'Rückgängig', action: () => emitMenuAction('undo')}),
                new MenuItem({id: 'redo', label: 'Wiederholen', action: () => emitMenuAction('redo')}),
                'separator',
                'cut',
                'copy',
                'paste',
                'selectAll',
            ],
        }),
        new MenuWithRole({
            role: 'viewMenu',
            items: ['zoomReset', 'zoomIn', 'zoomOut', 'separator', 'fullScreen'],
        }),
        new MenuWithRole({
            role: 'windowMenu',
            items: ['minimizeWindow', 'maximizeWindow'],
        }),
        new MenuWithRole({
            role: 'helpMenu',
            items: [],
        }),
    ],
}));
