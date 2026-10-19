import {stat} from 'node:fs/promises';
import {nativeFilePath} from './file-paths.ts';

/** Renaming an extension must not bypass the native picker's overwrite consent. */
export async function confirmAdjustedSaveTarget(
    selectedPath: string,
    targetPath: string,
    confirmReplace: (path: string) => Promise<boolean>,
): Promise<boolean> {
    if (nativeFilePath(selectedPath) === targetPath) return true;
    try {
        await stat(targetPath);
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') return true;
        throw error;
    }
    return confirmReplace(targetPath);
}
