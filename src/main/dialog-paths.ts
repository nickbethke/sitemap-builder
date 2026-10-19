import {existsSync} from 'node:fs';
import {homedir} from 'node:os';
import {join, posix, win32} from 'node:path';
import {nativeFilePath} from './file-paths.ts';

export type DialogLocation = 'project' | 'export' | 'import';

const KEYS: Record<DialogLocation, string> = {
    project: 'dialogs.projectDirectory',
    export: 'dialogs.exportDirectory',
    import: 'dialogs.importDirectory',
};

export function defaultDialogDirectory(home = homedir(), exists = existsSync): string {
    const documents = join(home, 'Documents');
    return exists(documents) ? documents : home;
}

export class DialogPathPreferences {
    private readonly read: (key: string) => string;
    private readonly write: (key: string, value: string) => void;
    private readonly persist: () => boolean;
    private readonly fallback: string;
    private readonly exists: (path: string) => boolean;
    private readonly platform: NodeJS.Platform;

    constructor(
        read: (key: string) => string,
        write: (key: string, value: string) => void,
        persist: () => boolean,
        fallback = defaultDialogDirectory(),
        exists = existsSync,
        platform: NodeJS.Platform = process.platform,
    ) {
        this.read = read;
        this.write = write;
        this.persist = persist;
        this.fallback = nativeFilePath(fallback, platform);
        this.exists = exists;
        this.platform = platform;
    }

    directory(location: DialogLocation): string {
        const value = this.read(KEYS[location]);
        const stored = value ? nativeFilePath(value, this.platform) : '';
        return stored && this.exists(stored) ? stored : this.fallback;
    }

    remember(location: DialogLocation, filePath: string): void {
        const paths = this.platform === 'win32' ? win32 : posix;
        const directory = paths.dirname(nativeFilePath(filePath, this.platform));
        if (!this.exists(directory)) return;
        this.write(KEYS[location], directory);
        if (!this.persist()) console.error('Dialog-Ordner konnte nicht gespeichert werden.');
    }

    savePath(location: DialogLocation, fileName: string): string {
        const paths = this.platform === 'win32' ? win32 : posix;
        return paths.join(this.directory(location), fileName);
    }
}
