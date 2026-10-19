import {jsPDF} from 'jspdf';
import {validatePdfExportDimensions} from '../../shared/export-policy.ts';

export function createCanvasPdf(width: number, height: number): jsPDF {
    validatePdfExportDimensions(width, height);
    return new jsPDF({
        unit: 'px',
        compress: true,
        format: [width, height],
        orientation: width > height ? 'landscape' : 'portrait',
    });
}
