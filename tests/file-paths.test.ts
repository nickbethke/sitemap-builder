import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtemp, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {confirmAdjustedSaveTarget} from '../src/main/save-target.ts';
import {nativeFilePath, withFileExtension} from '../src/main/file-paths.ts';
import {DialogPathPreferences} from '../src/main/dialog-paths.ts';

test('save results have exactly one extension, with or without native auto-append', () => {
    for (const extension of ['smap', 'pdf', 'csv', 'xml', 'md', 'html']) {
        for (const suffix of ['', `.${extension}`, `.${extension}.${extension}`, `.${extension.toUpperCase()}`]) {
            assert.equal(withFileExtension(`/work/client${suffix}`, extension), `/work/client.${extension}`);
        }
    }
    assert.equal(withFileExtension('/site.smap/relaunch.v2', 'smap'), '/site.smap/relaunch.v2.smap');
});

test('extension correction asks before overwriting another existing file', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'sitemap-save-target-'));
    const target = join(directory, 'site.smap');
    let confirmations = 0;
    const confirm = async (path: string) => { confirmations++; assert.equal(path, target); return false; };
    try {
        assert.equal(await confirmAdjustedSaveTarget(`${target}.smap`, target, confirm), true);
        assert.equal(confirmations, 0);
        await writeFile(target, 'existing');
        assert.equal(await confirmAdjustedSaveTarget(`${target}.smap`, target, confirm), false);
        assert.equal(confirmations, 1);
        assert.equal(await confirmAdjustedSaveTarget(target, target, confirm), true);
        assert.equal(confirmations, 1);
    } finally {
        await rm(directory, {recursive: true, force: true});
    }
});

test('Windows drive and UNC paths get native separators; POSIX backslashes stay valid', () => {
    assert.equal(nativeFilePath('C:/Work/client/site.smap', 'win32'), 'C:\\Work\\client\\site.smap');
    assert.equal(nativeFilePath('//server/share/folder/site.pdf', 'win32'), '\\\\server\\share\\folder\\site.pdf');
    assert.equal(nativeFilePath('/home/name\\with-backslash/site.smap', 'linux'), '/home/name\\with-backslash/site.smap');
});

test('Windows dialog directories normalize stored values and new selections', () => {
    const values = new Map<string, string>([['dialogs.projectDirectory', 'C:/Work/Client']]);
    const preferences = new DialogPathPreferences(
        key => values.get(key) ?? '',
        (key, value) => values.set(key, value),
        () => true,
        'C:/Users/Test/Documents',
        () => true,
        'win32',
    );
    assert.equal(preferences.directory('project'), 'C:\\Work\\Client');
    assert.equal(preferences.savePath('project', 'website-struktur'), 'C:\\Work\\Client\\website-struktur');
    preferences.remember('export', '//server/share/client/output.pdf');
    assert.equal(preferences.savePath('export', 'output'), '\\\\server\\share\\client\\output');
    assert.equal(preferences.directory('import'), 'C:\\Users\\Test\\Documents');
});
