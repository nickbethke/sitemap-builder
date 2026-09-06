import assert from 'node:assert/strict';
import test from 'node:test';
import {MAX_PDF_EXPORT_DIMENSION, MAX_PDF_EXPORT_PIXELS, validatePdfExportDimensions} from '../src/shared/export-policy.ts';

test('accepts bounded PDF export dimensions', () => {
    assert.doesNotThrow(() => validatePdfExportDimensions(2_000, 3_000));
});

test('rejects invalid, oversized, and memory-heavy PDF exports', () => {
    assert.throws(() => validatePdfExportDimensions(0, 100));
    assert.throws(() => validatePdfExportDimensions(MAX_PDF_EXPORT_DIMENSION + 1, 100));
    assert.throws(() => validatePdfExportDimensions(5_000, Math.floor(MAX_PDF_EXPORT_PIXELS / 5_000) + 1));
});
