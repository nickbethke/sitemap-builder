import {gzipSync, gunzipSync} from 'node:zlib';
import {validateSitemapDocument} from '../shared/sitemap-schema.ts';

const MAGIC = Buffer.from('SMAP');
const FORMAT_VERSION = 1;
export const MAX_SITEMAP_JSON_SIZE = 10 * 1024 * 1024;

export function encodeSitemap(payload: string): Buffer {
    if (Buffer.byteLength(payload, 'utf8') > MAX_SITEMAP_JSON_SIZE) throw new Error('Sitemap ist größer als 10 MB.');
    validateSitemapDocument(JSON.parse(payload));
    const header = Buffer.concat([MAGIC, Buffer.from([FORMAT_VERSION])]);
    return Buffer.concat([header, gzipSync(Buffer.from(payload, 'utf8'), {level: 9})]);
}

export function decodeSitemap(file: Buffer): string {
    if (file.length < 6 || !file.subarray(0, MAGIC.length).equals(MAGIC)) {
        throw new Error('Keine gültige .smap-Datei.');
    }
    if (file[MAGIC.length] !== FORMAT_VERSION) {
        throw new Error(`.smap-Version ${file[MAGIC.length]} wird nicht unterstützt.`);
    }

    try {
        const payload = gunzipSync(file.subarray(MAGIC.length + 1), {maxOutputLength: MAX_SITEMAP_JSON_SIZE}).toString('utf8');
        validateSitemapDocument(JSON.parse(payload));
        return payload;
    } catch {
        throw new Error('.smap-Datei ist beschädigt oder ungültig.');
    }
}
