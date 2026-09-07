import assert from 'node:assert/strict';
import test from 'node:test';
import {createImportedDocument, prepareImportPages} from '../src/renderer/lib/import.ts';
import {canDuplicateNode, canPromoteNode, prepareDocumentMutation} from '../src/renderer/lib/documentOperations.ts';
import {createProjectDocument, documentToMarkdown, documentToXml, type SitemapDocument} from '../src/renderer/lib/sitemap.ts';
import {createCanvasPdf} from '../src/renderer/lib/pdfDocument.ts';
import {decodeSitemap, encodeSitemap} from '../src/main/sitemap-file.ts';
import {applyDocumentChange, createDocumentChange} from '../src/renderer/lib/documentHistory.ts';
import {MAX_NODES, validateSitemapDocument} from '../src/shared/sitemap-schema.ts';
import {translations} from '../src/renderer/lib/i18n/translations.ts';

const project = {name: 'Audit', baseUrl: 'https://example.com', client: 'Client'};
const makeDocument = () => createProjectDocument('company', {...project}, 'en');
const pages = (count: number, withHome = false) => prepareImportPages(Array.from({length: count}, (_, i) => ({
    url: `https://example.com/${withHome && i === 0 ? '' : `page${i}`}`,
    path: withHome && i === 0 ? '/' : `/page${i}`,
    title: 'Page', warnings: [], httpStatus: 0, finalUrl: '', seoTitle: '', seoDescription: '', canonicalUrl: '', noIndex: false, noFollow: false,
})));

test('network consent notices use the application interpolation syntax in both languages', () => {
    for (const dictionary of Object.values(translations)) {
        const notice = dictionary['import.dialog.enrichNetworkNotice'];
        assert.ok(notice.includes('{{count}}'));
        assert.ok(notice.includes('{{host}}'));
    }
});

test('root duplication and promotion of its direct children are disabled', () => {
    const document = makeDocument();
    const root = document.nodes.find(node => node.parentId === null)!;
    const child = document.nodes.find(node => node.parentId === root.id)!;
    const grandchild = document.nodes.find(node => node.parentId === child.id)!;
    assert.equal(canDuplicateNode(root), false);
    assert.equal(canDuplicateNode(child), true);
    assert.equal(canPromoteNode(document, root), false);
    assert.equal(canPromoteNode(document, child), false);
    assert.equal(canPromoteNode(document, grandchild), true);
});

test('central mutation guard rejects invalid hierarchies without changing the current document', () => {
    const document = makeDocument();
    const before = JSON.stringify(document);
    const mutations: Array<(value: SitemapDocument) => SitemapDocument> = [
        value => ({...value, nodes: [...value.nodes, {...value.nodes[0], id: 'copy'}]}),
        value => ({...value, nodes: value.nodes.map(node => node.id === 'services' ? {...node, parentId: null} : node)}),
        value => ({...value, nodes: value.nodes.map(node => node.id === 'services' ? {...node, parentId: 'service-one'} : node)}),
        value => ({...value, nodes: value.nodes.map(node => node.id === 'services' ? {...node, parentId: 'missing'} : node)}),
    ];
    for (const mutation of mutations) assert.throws(() => prepareDocumentMutation(document, mutation));
    assert.equal(JSON.stringify(document), before);
});

test('mutation guard enforces node, depth, text and serialized size limits', () => {
    const document = createImportedDocument(pages(MAX_NODES, true), 'Audit', project.baseUrl);
    assert.throws(() => prepareDocumentMutation(document, current => ({...current, nodes: [...current.nodes, {...current.nodes[1], id: 'extra'}]})), /10000/);
    assert.throws(() => prepareDocumentMutation(makeDocument(), current => ({...current, project: {...current.project, name: 'x'.repeat(10001)}})), /name/);
    const deep = makeDocument();
    deep.nodes = Array.from({length: 102}, (_, i) => ({...deep.nodes[0], id: `n${i}`, parentId: i === 0 ? null : `n${i - 1}`}));
    assert.throws(() => prepareDocumentMutation(deep, current => current), /100 Ebenen/);
    const large = createImportedDocument(pages(110, true), 'Audit', project.baseUrl);
    assert.throws(() => prepareDocumentMutation(large, current => ({...current, nodes: current.nodes.map(node => ({...node, notes: 'x'.repeat(100000)}))})), /10 MB/);
});

test('accepted edits survive undo, redo and a file round-trip', () => {
    const before = makeDocument();
    const after = prepareDocumentMutation(before, current => ({...current, nodes: current.nodes.map(node => node.id === 'service-one' ? {...node, parentId: 'home'} : node)}));
    const change = createDocumentChange(before, after);
    const undone = applyDocumentChange(after, change, 'undo');
    const redone = applyDocumentChange(undone, change, 'redo');
    assert.deepEqual(undone, before);
    assert.deepEqual(redone, after);
    assert.deepEqual(JSON.parse(decodeSitemap(encodeSitemap(JSON.stringify(redone)))), after);
});

test('homepage is included in the import budget; boundary documents remain saveable', () => {
    assert.throws(() => createImportedDocument(pages(10000), 'Audit', project.baseUrl), /Startseite/);
    for (const selected of [pages(9999), pages(10000, true)]) {
        const document = createImportedDocument(selected, 'Audit', project.baseUrl);
        assert.equal(document.nodes.length, 10000);
        assert.doesNotThrow(() => encodeSitemap(JSON.stringify(document)));
    }
});

test('long import paths create short unique IDs; oversized imported text is rejected', () => {
    const selected = pages(2);
    selected[0].path = `/${'a'.repeat(500)}`;
    selected[1].path = `${selected[0].path}b`;
    const document = createImportedDocument(selected, 'Audit', project.baseUrl);
    assert.equal(new Set(document.nodes.map(node => node.id)).size, document.nodes.length);
    assert.ok(document.nodes.every(node => node.id.length <= 256));
    validateSitemapDocument(document);
    selected[0].seoTitle = 'x'.repeat(10001);
    assert.throws(() => createImportedDocument(selected, 'Audit', project.baseUrl), /seoTitle/);
});

test('PDF page dimensions match landscape, portrait and square canvases', () => {
    for (const [width, height] of [[1200, 800], [800, 1200], [800, 800]]) {
        const pdf = createCanvasPdf(width, height);
        assert.ok(Math.abs(pdf.internal.pageSize.getWidth() - width) < 0.01);
        assert.ok(Math.abs(pdf.internal.pageSize.getHeight() - height) < 0.01);
    }
    assert.throws(() => createCanvasPdf(8193, 1));
});

test('Markdown neutralizes raw HTML, injected link syntax and multiline project fields', () => {
    const document = makeDocument();
    document.project.name = 'Project\n<script>alert(1)</script>';
    document.project.client = '[click](javascript:alert(1))';
    document.nodes[0].title = '<img src=x onerror=alert(1)>\n![image](https://evil.example/x)';
    document.nodes[0].slug = '/path(foo)?x=1&y=2';
    const result = documentToMarkdown(document);
    assert.ok(!result.includes('<img'));
    assert.ok(!result.includes('<script>'));
    assert.ok(!result.includes('\n![image]'));
    assert.ok(result.includes('&lt;img'));
    assert.ok(result.includes('/path%28foo%29?x=1&y=2'));
    assert.ok(result.includes('\\[click\\]\\(javascript:alert\\(1\\)\\)'));
    for (const slug of ['javascript:alert(1)', '//evil.example/x', '/\\evil.example', '/x\n<script>']) {
        document.nodes[0].slug = slug;
        assert.throws(() => documentToMarkdown(document), /Exportpfad/);
    }
});

test('XML export refuses invalid bases, invalid paths and duplicate normalized URLs', () => {
    const document = makeDocument();
    for (const baseUrl of ['not-a-url', 'https://', 'ftp://example.com', 'https://u:p@example.com', 'https://example.com?x=1', 'https://example.com/#', 'https://example.com/\n']) {
        document.project.baseUrl = baseUrl;
        assert.throws(() => documentToXml(document), /Basis-URL/);
    }
    document.project.baseUrl = project.baseUrl;
    for (const slug of ['https://evil.example', '//evil.example', '/a b', '/bad%zz', '/x\u0001', '/a#section']) {
        document.nodes[1].slug = slug;
        assert.throws(() => documentToXml(document), /Exportpfad/);
    }
    document.nodes[1].slug = '/';
    assert.throws(() => documentToXml(document), /Doppelte/);
});

test('XML export preserves base paths, encodes Unicode and escapes query strings', () => {
    const document = createProjectDocument('empty', {...project, baseUrl: 'https://example.com/sub/'}, 'en');
    document.nodes[0].slug = '/über?x=1&y=2';
    assert.match(documentToXml(document), /https:\/\/example.com\/sub\/%C3%BCber\?x=1&amp;y=2/);
    document.nodes[0].noIndex = true;
    assert.ok(!documentToXml(document).includes('<url>'));
});
