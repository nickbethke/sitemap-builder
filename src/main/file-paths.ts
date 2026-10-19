import {normalize, win32} from 'node:path';

/** Native dialogs may return forward slashes even on Windows. */
export function nativeFilePath(value: string, platform: NodeJS.Platform = process.platform): string {
    return platform === 'win32' ? win32.normalize(value) : normalize(value);
}

/** Accept native auto-appended extensions without accumulating .smap.smap. */
export function withFileExtension(value: string, extension: string): string {
    const suffix = `.${extension}`;
    let path = value;
    while (path.toLowerCase().endsWith(suffix.toLowerCase())) path = path.slice(0, -suffix.length);
    return `${path}${suffix}`;
}
