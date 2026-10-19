import assert from 'node:assert/strict';
import test from 'node:test';
import {join} from 'node:path';
import {DialogPathPreferences, defaultDialogDirectory} from '../src/main/dialog-paths.ts';

test('uses Documents when available, then home', () => {
    const home = join('users', 'a');
    const documents = join(home, 'Documents');
    assert.equal(defaultDialogDirectory(home, path => path === documents), documents);
    assert.equal(defaultDialogDirectory(home, () => false), home);
});

test('remembers independent project, export and import directories', () => {
    const values = new Map<string, string>();
    let persistCalls = 0;
    const preferences = new DialogPathPreferences(
        key => values.get(key) ?? '',
        (key, value) => values.set(key, value),
        () => { persistCalls += 1; return true; },
        '/Documents',
        () => true,
        'linux',
    );
    assert.equal(preferences.directory('project'), '/Documents');
    assert.equal(preferences.savePath('export', 'sitemap.pdf'), '/Documents/sitemap.pdf');

    preferences.remember('project', '/Work/client/site.smap');
    preferences.remember('export', '/Exports/site.pdf');
    preferences.remember('import', '/Downloads/source.xml');

    assert.equal(preferences.directory('project'), '/Work/client');
    assert.equal(preferences.savePath('project', 'new.smap'), '/Work/client/new.smap');
    assert.equal(preferences.directory('export'), '/Exports');
    assert.equal(preferences.savePath('export', 'site.csv'), '/Exports/site.csv');
    assert.equal(preferences.directory('import'), '/Downloads');
    assert.equal(persistCalls, 3);
});
