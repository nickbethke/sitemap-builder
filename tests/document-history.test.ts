import assert from 'node:assert/strict';
import test from 'node:test';
import {applyDocumentChange, createDocumentChange} from '../src/renderer/lib/documentHistory.ts';
import type {SitemapDocument, SitemapNode} from '../src/renderer/lib/sitemap.ts';

const node = (id: string, title = id): SitemapNode => ({
    id,
    parentId: id === 'home' ? null : 'home',
    title,
    description: '',
    slug: id === 'home' ? '/' : `/${id}`,
    pageType: id === 'home' ? 'home' : 'content',
    seoImportance: 'medium',
    status: 'planned',
    owner: '',
    template: 'Standard',
    noIndex: false,
    notes: '',
});
const document = (nodes: SitemapNode[], updatedAt: string, name = 'Test'): SitemapDocument => ({
    formatVersion: 1,
    project: {name, baseUrl: 'https://example.com', client: ''},
    nodes,
    updatedAt,
});

test('document change restores node edits in both directions', () => {
    const before = document([node('home'), node('about')], 'before');
    const after = document([node('home'), node('about', 'About us')], 'after');
    const change = createDocumentChange(before, after);

    assert.deepEqual(applyDocumentChange(after, change, 'undo'), before);
    assert.deepEqual(applyDocumentChange(before, change, 'redo'), after);
    assert.equal(change.nodeChanges.length, 1);
});

test('document change restores additions, deletion, order, and project', () => {
    const before = document([node('home'), node('about'), node('contact')], 'before');
    const after = document([node('home'), node('services'), node('about')], 'after', 'Renamed');
    const change = createDocumentChange(before, after);

    assert.deepEqual(applyDocumentChange(after, change, 'undo'), before);
    assert.deepEqual(applyDocumentChange(before, change, 'redo'), after);
});
