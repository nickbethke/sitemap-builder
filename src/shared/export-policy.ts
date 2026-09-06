export const MAX_PDF_EXPORT_DIMENSION = 8_192;
export const MAX_PDF_EXPORT_PIXELS = 16_000_000;

export function validatePdfExportDimensions(width: number, height: number): void {
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
        throw new Error('Ungültige PDF-Exportgröße.');
    }
    if (width > MAX_PDF_EXPORT_DIMENSION || height > MAX_PDF_EXPORT_DIMENSION || width * height > MAX_PDF_EXPORT_PIXELS) {
        throw new Error('PDF-Exportfläche ist zu groß. Filtere Seiten oder teile Sitemap vor Export auf.');
    }
}
