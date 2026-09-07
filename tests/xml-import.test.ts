import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtemp, rm, writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {gzipSync} from 'node:zlib';
import {parseXmlImport, parseXmlSitemap} from '../src/main/import/xml.ts';
import {XmlImportBudget, XmlImportLimitError, XML_IMPORT_LIMITS} from '../src/main/import/xml-budget.ts';

const host = 'https://example.com';
const index = (urls: string[]) => Buffer.from(`<sitemapindex>${urls.map(url => `<sitemap><loc>${url}</loc></sitemap>`).join('')}</sitemapindex>`);
const urlset = (paths: string[]) => Buffer.from(`<urlset>${paths.map(path => `<url><loc>${host}${path}</loc></url>`).join('')}</urlset>`);
const paths = (count: number, offset = 0) => Array.from({length: count}, (_, i) => `/p${i + offset}`);

test('local URL sets parse offline, including gzip; local indexes never request remote files by default', async () => {
    let requests = 0;
    const remote = async () => { requests += 1; return urlset(['/']); };
    const plain = urlset(['/a', '/b']);
    assert.equal((await parseXmlImport('/tmp/local.xml', plain, {}, remote)).pages.length, 2);
    assert.equal((await parseXmlImport('/tmp/local.xml.gz', gzipSync(plain), {}, remote)).pages.length, 2);
    await assert.rejects(parseXmlImport('/tmp/index.xml', index([`${host}/child.xml`]), {}, remote), /Offline/);
    assert.equal(requests, 0);

    const directory = await mkdtemp(join(tmpdir(), 'sitemap-xml-test-'));
    try {
        const file = join(directory, 'index.xml');
        // Even a real private URL must not be resolved/requested in the default file flow.
        await writeFile(file, index(['http://127.0.0.1:1/child.xml']));
        await assert.rejects(parseXmlSitemap(file), /Offline/);
    } finally {
        await rm(directory, {recursive: true, force: true});
    }
});

test('explicit network consent enables linked sitemap traversal', async () => {
    const requested: string[] = [];
    const result = await parseXmlImport('/tmp/index.xml', index([`${host}/child.xml`]), {allowRemote: true}, async url => {
        requested.push(url.href);
        return urlset(['/']);
    });
    assert.deepEqual(requested, [`${host}/child.xml`]);
    assert.equal(result.pages.length, 1);
});

test('file budget fails before the 50th child request and does not downgrade to warnings', async () => {
    let requests = 0;
    await assert.rejects(parseXmlImport('/tmp/index.xml', index(paths(60).map(path => `${host}${path}.xml`)), {allowRemote: true}, async () => {
        requests += 1;
        return urlset([`/page${requests}`]);
    }), XmlImportLimitError);
    assert.equal(requests, 49); // local root also consumes one slot
});

test('failed downloads still consume the shared file budget', async () => {
    let requests = 0;
    await assert.rejects(parseXmlImport('/tmp/index.xml', index(paths(60).map(path => `${host}${path}.xml`)), {allowRemote: true}, async () => {
        requests += 1;
        throw new Error('HTTP 500');
    }), XmlImportLimitError);
    assert.equal(requests, 49);
});

test('duplicates and self-references are skipped before fetching', async () => {
    const source = `${host}/index.xml`;
    const leaf = `${host}/leaf.xml`;
    const requested: string[] = [];
    const result = await parseXmlImport(source, index([source, leaf, leaf]), {allowRemote: true}, async url => {
        requested.push(url.href);
        return urlset(['/']);
    });
    assert.deepEqual(requested, [leaf]);
    assert.equal(result.pages.length, 1);
    assert.equal(result.warnings.length, 2);
});

test('depth limit rejects before fetching the over-depth document', async () => {
    let requests = 0;
    await assert.rejects(parseXmlImport('/tmp/index.xml', index([`${host}/1.xml`]), {allowRemote: true}, async () => {
        requests += 1;
        return index([`${host}/${requests + 1}.xml`]);
    }), /tiefer als 5/);
    assert.equal(requests, 5);
});

test('a child with 10001 URLs fails the whole import without returning partial data', async () => {
    await assert.rejects(parseXmlImport('/tmp/index.xml', index([`${host}/leaf.xml`]), {allowRemote: true}, async () => urlset(paths(10001))), /10000 URLs/);
});

test('URL budget is shared by children and stops subsequent requests', async () => {
    let requests = 0;
    await assert.rejects(parseXmlImport('/tmp/index.xml', index(['a', 'b', 'c'].map(name => `${host}/${name}.xml`)), {allowRemote: true}, async () => {
        requests += 1;
        return urlset(requests === 1 ? paths(6000) : paths(4001, 6000));
    }), /10000 URLs/);
    assert.equal(requests, 2);
    assert.equal((await parseXmlImport('/tmp/pages.xml', urlset(paths(10000)))).pages.length, 10000);
});

test('foreign index origins are rejected before the injected transport', async () => {
    const calls: string[] = [];
    const result = await parseXmlImport(`${host}/index.xml`, index(['https://other.example/child.xml', `${host}/leaf.xml`]), {allowRemote: true}, async url => {
        calls.push(url.href);
        return urlset(['/']);
    });
    assert.deepEqual(calls, [`${host}/leaf.xml`]);
    assert.match(result.warnings[0], /fremde Domain/);
});

test('abort stops traversal; global resource failures are never swallowed', async () => {
    const controller = new AbortController();
    let requests = 0;
    await assert.rejects(parseXmlImport('/tmp/index.xml', index([`${host}/a.xml`, `${host}/b.xml`]), {allowRemote: true, signal: controller.signal}, async () => {
        requests += 1;
        controller.abort();
        return urlset(['/']);
    }), {name: 'AbortError'});
    assert.equal(requests, 1);
    await assert.rejects(parseXmlImport('/tmp/index.xml', index([`${host}/a.xml`]), {allowRemote: true}, async (_url, _origin, budget) => {
        budget.consumeBytes(XML_IMPORT_LIMITS.bytes + 1);
        return urlset(['/']);
    }), XmlImportLimitError);
});

test('request, byte, warning and synchronous time budgets are bounded', context => {
    const budget = new XmlImportBudget();
    for (let i = 0; i < XML_IMPORT_LIMITS.requests; i += 1) budget.request();
    assert.throws(() => budget.request(), XmlImportLimitError);
    budget.consumeBytes(XML_IMPORT_LIMITS.bytes);
    assert.throws(() => budget.consumeBytes(1), XmlImportLimitError);
    for (let i = 0; i < 200; i += 1) budget.warn('x'.repeat(3000));
    assert.equal(budget.warnings.length, 100);
    assert.equal(budget.warnings[0].length, 2000);
    const now = Date.now();
    context.mock.method(Date, 'now', () => now + XML_IMPORT_LIMITS.durationMs + 1);
    assert.throws(() => budget.check(), XmlImportLimitError);
});
