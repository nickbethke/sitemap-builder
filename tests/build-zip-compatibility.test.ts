import assert from 'node:assert/strict';
import test from 'node:test';
import {createRequire} from 'node:module';
import {mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

// Resolve the exact dependency used by the CLI without importing cmake.js
// (that module may download/install tools as a side effect).
const requireFromCli = createRequire(new URL('../node_modules/@mobrowser/cli/cmake.js', import.meta.url));
const AdmZip = requireFromCli('adm-zip');

test('patched CLI ZIP dependency supports CMake-style nested extraction and overwrite', async () => {
    assert.equal(requireFromCli('adm-zip/package.json').version, '0.6.0');
    const directory = await mkdtemp(join(tmpdir(), 'sitemap-build-zip-'));
    try {
        const zip = new AdmZip();
        const binary = Buffer.from([0, 1, 2, 255, 128]);
        zip.addFile('cmake/bin/cmake.exe', binary);
        zip.addFile('cmake/share/cmake/Modules/example.cmake', Buffer.from('set(AUDIT_OK TRUE)\n'));
        const archive = join(directory, 'cmake.zip');
        await writeFile(archive, zip.toBuffer());
        const output = join(directory, 'extracted');
        // Same constructor/method/arguments as @mobrowser/cli/cmake.js.
        new AdmZip(archive).extractAllTo(output, true);
        assert.deepEqual(await readFile(join(output, 'cmake/bin/cmake.exe')), binary);
        await writeFile(join(output, 'cmake/bin/cmake.exe'), 'stale');
        new AdmZip(archive).extractAllTo(output, true);
        assert.deepEqual(await readFile(join(output, 'cmake/bin/cmake.exe')), binary);
        assert.equal(await readFile(join(output, 'cmake/share/cmake/Modules/example.cmake'), 'utf8'), 'set(AUDIT_OK TRUE)\n');
    } finally {
        await rm(directory, {recursive: true, force: true});
    }
});
