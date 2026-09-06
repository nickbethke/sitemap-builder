import assert from 'node:assert/strict';
import test from 'node:test';
import {decodeSitemap, encodeSitemap} from '../src/main/sitemap-file.ts';
import {createImportedDocument, prepareImportPages} from '../src/renderer/lib/import.ts';
import {createProjectDocument, documentToCsv, documentToHtml, documentToMarkdown, documentToXml} from '../src/renderer/lib/sitemap.ts';

const project = {name: 'Example', baseUrl: 'https://example.com', client: 'Client'};

test('round-trips validated sitemap file payload', () => {
    const payload = JSON.stringify(createProjectDocument('company', project, 'en'));
    assert.equal(decodeSitemap(encodeSitemap(payload)), payload);
    assert.throws(() => decodeSitemap(Buffer.from('invalid')));
});

test('localizes English project templates including slugs', () => {
    const document = createProjectDocument('company', project, 'en');
    assert.equal(document.nodes[0].title, 'Home');
    assert.equal(document.nodes.find(({id}) => id === 'services')?.slug, '/services');
    assert.equal(document.nodes.some(({title}) => title === 'Leistungen'), false);
});

test('builds hierarchy from imported page paths', () => {
    const pages = prepareImportPages([
        {url: 'https://example.com/', path: '/', title: 'Home', warnings: [], httpStatus: 200, finalUrl: '', seoTitle: '', seoDescription: '', canonicalUrl: '', noIndex: false, noFollow: false},
        {url: 'https://example.com/services', path: '/services', title: 'Services', warnings: [], httpStatus: 200, finalUrl: '', seoTitle: '', seoDescription: '', canonicalUrl: '', noIndex: false, noFollow: false},
        {url: 'https://example.com/services/design', path: '/services/design', title: 'Design', warnings: [], httpStatus: 200, finalUrl: '', seoTitle: '', seoDescription: '', canonicalUrl: '', noIndex: false, noFollow: false},
    ]);
    const document = createImportedDocument(pages, 'Imported', 'https://example.com', 'en');
    const services = document.nodes.find(({slug}) => slug === '/services');
    const design = document.nodes.find(({slug}) => slug === '/services/design');
    assert.equal(design?.parentId, services?.id);
});

test('generates bounded text exports from document model', () => {
    const document = createProjectDocument('company', project, 'en');
    assert.match(documentToXml(document), /https:\/\/example\.com\/services/);
    assert.match(documentToCsv(document, 'en'), /"Title";"URL"/);
    assert.match(documentToMarkdown(document, 'en'), /\[Services\]\(\/services\)/);
    assert.match(documentToHtml(document, 'en'), /Content-Security-Policy/);
});
