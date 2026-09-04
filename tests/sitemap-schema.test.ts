import assert from 'node:assert/strict';
import test from 'node:test';
import {validateSitemapDocument} from '../src/shared/sitemap-schema.ts';

const root = {
    id: 'home',
    parentId: null,
    title: 'Home',
    description: '',
    slug: '/',
    pageType: 'home',
    seoImportance: 'high',
    status: 'planned',
    owner: '',
    template: 'Homepage',
    noIndex: false,
    notes: '',
};

const validDocument = () => ({
    formatVersion: 1,
    project: {name: 'Test', baseUrl: 'https://example.test', client: ''},
    nodes: [{...root}],
    updatedAt: new Date().toISOString(),
});

test('accepts valid sitemap', () => {
    assert.doesNotThrow(() => validateSitemapDocument(validDocument()));
});

test('rejects duplicate IDs', () => {
    const document = validDocument();
    document.nodes.push({...root});
    assert.throws(() => validateSitemapDocument(document), /Doppelte oder leere Seiten-ID/);
});

test('rejects cycles', () => {
    const document = validDocument();
    document.nodes = [
        {...root, id: 'root'},
        {...root, id: 'a', parentId: 'b', pageType: 'content'},
        {...root, id: 'b', parentId: 'a', pageType: 'content'},
    ];
    assert.throws(() => validateSitemapDocument(document), /Zyklische Seitenhierarchie/);
});

test('rejects values capable of escaping HTML class attributes', () => {
    const document = validDocument();
    document.nodes[0].status = 'planned\" onmouseover=alert(1)';
    assert.throws(() => validateSitemapDocument(document), /Ungültiger Status/);
});
