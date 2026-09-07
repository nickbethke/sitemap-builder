import {existsSync} from 'node:fs';
import {homedir} from 'node:os';
import {dirname, join} from 'node:path';

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

    constructor(
        read: (key: string) => string,
        write: (key: string, value: string) => void,
        persist: () => boolean,
        fallback = defaultDialogDirectory(),
        exists = existsSync,
    ) {
        this.read = read;
        this.write = write;
        this.persist = persist;
        this.fallback = fallback;
        this.exists = exists;
    }

    directory(location: DialogLocation): string {
        const stored = this.read(KEYS[location]);
        return stored && this.exists(stored) ? stored : this.fallback;
    }

    remember(location: DialogLocation, filePath: string): void {
        const directory = dirname(filePath);
        if (!this.exists(directory)) return;
        this.write(KEYS[location], directory);
        if (!this.persist()) console.error('Dialog-Ordner konnte nicht gespeichert werden.');
    }

    savePath(location: DialogLocation, fileName: string): string {
        return join(this.directory(location), fileName);
    }
}
