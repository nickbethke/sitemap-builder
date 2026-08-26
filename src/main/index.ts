import {app, BrowserWindow, ipc, Theme} from '@mobrowser/api';
import {readFile, rename, stat, writeFile} from 'node:fs/promises';
import {extname} from 'node:path';
import * as process from 'node:process';
import {gzipSync, gunzipSync} from 'node:zlib';
import {ExportRequest, SaveSitemapRequest, SetThemeRequest} from './gen/app';
import {AppServiceDescriptor, OpenFileServiceDescriptor} from './gen/ipc_service';

const MAGIC = Buffer.from('SMAP');
const FORMAT_VERSION = 1;
const MAX_JSON_SIZE = 10 * 1024 * 1024;
const MAX_FILE_SIZE = 12 * 1024 * 1024;
const startupSitemapPath = app.launchInfo.files.find((path) => extname(path).toLowerCase() === '.smap') ?? '';
const openedSitemaps = ipc.registerService(OpenFileServiceDescriptor);

const win = new BrowserWindow({
    url: app.url,
    title: 'Sitemap Builder',
    size: {width: 1440, height: 900},
    minimumSize: {width: 1080, height: 720},
    windowTitleVisible: false,
    windowTitlebarVisible: process.platform !== 'darwin',
});
win.centerWindow();
win.show();

function encodeSitemap(payload: string): Buffer {
    if (Buffer.byteLength(payload, 'utf8') > MAX_JSON_SIZE) throw new Error('Sitemap ist größer als 10 MB.');
    JSON.parse(payload);
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
        JSON.parse(payload);
        return payload;
    } catch {
        throw new Error('.smap-Datei ist beschädigt oder ungültig.');
    }
}

app.handle('openFile', (path) => {
    void openSitemapFile(path)
        .then((sitemap) => openedSitemaps.WatchOpenedSitemaps(sitemap))
        .catch((error: unknown) => console.error('Sitemap konnte nicht geöffnet werden:', error));
});

ipc.registerService(AppServiceDescriptor, {
    async SetTheme(request: SetThemeRequest) {
        app.setTheme(request.theme as Theme);
        return {};
    },
    async SaveSitemap(request: SaveSitemapRequest) {
        let path = request.currentPath;
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

        const temporaryPath = `${path}.tmp`;
        await writeFile(temporaryPath, encodeSitemap(request.payload), {mode: 0o600});
        await rename(temporaryPath, path);
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
        return {canceled: false, ...sitemap};
    },
    async GetStartupSitemap() {
        if (!startupSitemapPath) return {canceled: true, path: '', payload: ''};
        const sitemap = await openSitemapFile(startupSitemapPath);
        return {canceled: false, ...sitemap};
    },
    async ExportFile(request: ExportRequest) {
        const extension = request.format === 'xml' ? 'xml' : 'csv';
        const result = await app.showSaveDialog({
            parentWindow: win,
            title: `${extension.toUpperCase()} exportieren`,
            defaultPath: `${request.suggestedName || 'sitemap'}.${extension}`,
            filters: [{name: `${extension.toUpperCase()} Datei`, extensions: [extension]}],
        });
        if (result.canceled || !result.path) return {canceled: true, path: ''};
        const path = extname(result.path).toLowerCase() === `.${extension}`
            ? result.path
            : `${result.path}.${extension}`;
        await writeFile(path, request.content, {encoding: 'utf8', mode: 0o600});
        return {canceled: false, path};
    },
});
