import assert from 'node:assert/strict';
import test from 'node:test';
import {regenerateNodeUrls, starterDocument} from '../src/renderer/lib/sitemap.ts';

const template = starterDocument.nodes[0];
const page = (id: string, parentId: string | null, title: string, slug: string) => ({...template, id, parentId, title, slug});
const document = {...starterDocument, nodes: [
    page('home', null, 'Start', '/'),
    page('parent', 'home', 'Neue Seite', '/individuell'),
    page('child', 'parent', 'Über uns', '/alt'),
    page('grandchild', 'child', 'Team', '/alt/team'),
    page('other', 'home', 'Andere', '/andere'),
]};

test('regenerates only selected URL from title and current parent', () => {
    const result = regenerateNodeUrls(document, 'child', false);
    assert.equal(result.nodes[2].slug, '/individuell/ueber-uns');
    assert.equal(result.nodes[3].slug, '/alt/team');
    assert.equal(regenerateNodeUrls(document, 'home', false).nodes[0].slug, '/');
});

test('regenerates all descendant URLs in hierarchical order without changing parent', () => {
    const result = regenerateNodeUrls(document, 'parent', true);
    assert.deepEqual(result.nodes.map(node => node.slug), ['/', '/individuell', '/individuell/ueber-uns', '/individuell/ueber-uns/team', '/andere']);
    assert.equal(document.nodes[2].slug, '/alt');
});
