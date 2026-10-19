import assert from 'node:assert/strict';
import test from 'node:test';
import {sitemapToPdfBase64} from '../src/renderer/lib/canvasExport.ts';
import {createProjectDocument, documentToCsv, starterDocument} from '../src/renderer/lib/sitemap.ts';

const project = {name: 'Relaunch ÄÖÜ', baseUrl: 'https://example.com', client: 'Client'};

test('PDF export is compact vector output, independent of DOM, zoom and selection', () => {
    for (const direction of ['horizontal', 'vertical'] as const) {
        const bytes = Buffer.from(sitemapToPdfBase64(starterDocument, direction, 'de'), 'base64');
        assert.equal(bytes.subarray(0, 5).toString(), '%PDF-');
        assert.ok(bytes.length < 200_000, `starter PDF is ${bytes.length} bytes`);
        assert.ok(!bytes.toString('latin1').includes('/Subtype /Image'));
        assert.ok(bytes.toString('latin1').includes('/FlateDecode'));
    }
});

test('PDF export fits large hierarchies instead of failing the old bitmap limit', () => {
    const document = createProjectDocument('empty', project, 'en');
    const root = document.nodes[0];
    document.nodes.push(...Array.from({length: 150}, (_, index) => ({
        ...root, id: `page-${index}`, parentId: root.id, title: `Page ${index}`, slug: `/page-${index}`,
    })));
    for (const direction of ['horizontal', 'vertical'] as const) {
        const bytes = Buffer.from(sitemapToPdfBase64(document, direction, 'en'), 'base64');
        const box = bytes.toString('latin1').match(/\/MediaBox \[0 0 ([\d.]+) ([\d.]+)\]/);
        assert.ok(box);
        assert.ok(Number(box[1]) <= 14400 && Number(box[2]) <= 14400);
        assert.ok(bytes.length < 1_000_000);
    }
});

test('CSV supports Excel UTF-8, hierarchy, planning fields and quoted multiline text', () => {
    const document = createProjectDocument('empty', project, 'en');
    Object.assign(document.nodes[0], {title: 'Äpfel; "Öl"', description: 'Line 1\nLine 2', notes: 'Review', template: 'Custom', showInMainNavigation: true});
    const csv = documentToCsv(document, 'en');
    assert.ok(csv.startsWith('\uFEFF"Title";"URL"'));
    assert.ok(csv.endsWith('\r\n'));
    assert.match(csv, /"Page ID";"Parent ID";"Description";"Template";"In main navigation";"Notes"/);
    assert.ok(csv.includes('"Äpfel; ""Öl"""'));
    assert.ok(csv.includes('"Line 1\nLine 2";"Custom";"Yes";"Review"'));
});

test('CSV neutralizes spreadsheet formulas, including whitespace-prefixed formulas', () => {
    const document = createProjectDocument('empty', project, 'en');
    for (const title of ['=1+1', '+SUM(1)', '-1+1', '@SUM(1)', '  =1+1', '\t=1', '\n=1']) {
        document.nodes[0].title = title;
        assert.ok(documentToCsv(document, 'en').includes(`"'${title}";`));
    }
});
