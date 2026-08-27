import {toPng} from 'html-to-image';
import {jsPDF} from 'jspdf';

export async function captureCanvasAsPdfBase64(node: HTMLElement, width: number, height: number): Promise<string> {
    const dataUrl = await toPng(node, {
        width,
        height,
        pixelRatio: 1,
        style: {transform: 'scale(1)'},
    });

    const pdf = new jsPDF({
        unit: 'px',
        format: [width, height],
    });
    pdf.addImage(dataUrl, 'PNG', 0, 0, width, height);

    const dataUri = pdf.output('datauristring');
    return dataUri.slice(dataUri.indexOf(',') + 1);
}
