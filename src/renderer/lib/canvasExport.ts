import {createCanvasPdf} from './pdfDocument.ts';
import {layoutNodes, CARD_WIDTH, type LayoutDirection, type SitemapDocument} from './sitemap.ts';
import {DEFAULT_LOCALE, translations, type Locale} from './i18n/translations.ts';
import {MAX_PDF_EXPORT_DIMENSION, MAX_PDF_EXPORT_PIXELS} from '../../shared/export-policy.ts';

/** Export the document, not a screenshot of transient selection, search or zoom. */
export function sitemapToPdfBase64(
    document: SitemapDocument,
    direction: LayoutDirection,
    locale: Locale = DEFAULT_LOCALE,
): string {
    const t = (key: keyof typeof translations[typeof locale]) => translations[locale][key];
    const measure = createCanvasPdf(800, 800);
    const textWidth = CARD_WIDTH - 28;
    const cards = Object.fromEntries(document.nodes.map(node => {
        measure.setFont('helvetica', 'bold');
        measure.setFontSize(12);
        const title = measure.splitTextToSize(node.title || t('export.untitled'), textWidth) as string[];
        measure.setFont('helvetica', 'normal');
        measure.setFontSize(9);
        const slug = measure.splitTextToSize(node.slug || '/', textWidth) as string[];
        const description = node.description ? measure.splitTextToSize(node.description, textWidth) as string[] : [];
        const height = 58 + title.length * 15 + slug.length * 12 + description.length * 12;
        return [node.id, {title, slug, description, width: CARD_WIDTH, height}];
    }));
    const layout = layoutNodes(document.nodes, direction, cards);
    // Vector output needs no giant bitmap. Still keep PDF page dimensions within
    // supported bounds; preserve the whole hierarchy rather than rejecting it.
    const scale = Math.min(1, MAX_PDF_EXPORT_DIMENSION / layout.width, MAX_PDF_EXPORT_DIMENSION / layout.height,
        Math.sqrt(MAX_PDF_EXPORT_PIXELS / (layout.width * layout.height)));
    const width = Math.max(1, Math.floor(layout.width * scale));
    const height = Math.max(1, Math.floor(layout.height * scale));
    const pdf = createCanvasPdf(width, height);
    const at = (value: number) => value * scale;
    pdf.setProperties({title: document.project.name, subject: 'Sitemap', creator: 'Sitemap Builder'});
    pdf.setFillColor('#f4f6fb');
    pdf.rect(0, 0, width, height, 'F');
    pdf.setDrawColor('#b8c4d8');
    pdf.setLineWidth(at(1));
    for (const node of document.nodes) {
        const child = layout.positions[node.id];
        const parent = node.parentId ? layout.positions[node.parentId] : undefined;
        if (!parent || !node.parentId) continue;
        const from = direction === 'horizontal'
            ? {x: parent.x + CARD_WIDTH, y: parent.y + cards[node.parentId].height / 2}
            : {x: parent.x + CARD_WIDTH / 2, y: parent.y + cards[node.parentId].height};
        const to = direction === 'horizontal'
            ? {x: child.x, y: child.y + cards[node.id].height / 2}
            : {x: child.x + CARD_WIDTH / 2, y: child.y};
        const middle = direction === 'horizontal' ? (from.x + to.x) / 2 : (from.y + to.y) / 2;
        const points = direction === 'horizontal'
            ? [from, {x: middle, y: from.y}, {x: middle, y: to.y}, to]
            : [from, {x: from.x, y: middle}, {x: to.x, y: middle}, to];
        for (let i = 1; i < points.length; i++) {
            pdf.line(at(points[i - 1].x), at(points[i - 1].y), at(points[i].x), at(points[i].y));
        }
    }
    for (const node of document.nodes) {
        const position = layout.positions[node.id];
        const card = cards[node.id];
        pdf.setFillColor('#ffffff');
        pdf.setDrawColor('#d4ddea');
        pdf.roundedRect(at(position.x), at(position.y), at(CARD_WIDTH), at(card.height), at(6), at(6), 'FD');
        let y = position.y + 20;
        const text = (lines: string[], size: number, leading: number, color: string, bold = false) => {
            pdf.setFont('helvetica', bold ? 'bold' : 'normal');
            pdf.setFontSize(at(size));
            pdf.setTextColor(color);
            for (const line of lines) {
                pdf.text(line, at(position.x + 14), at(y));
                y += leading;
            }
        };
        text(card.title, 12, 15, '#1a2b4a', true);
        y += 3;
        text(card.slug, 9, 12, '#2368ff');
        y += 6;
        text(card.description, 9, 12, '#55618a');
        y = position.y + card.height - 14;
        const label = `${t(`pageType.${node.pageType}`)} · ${t(`pageStatus.${node.status}`)}${node.noIndex ? ` · ${t('export.noIndexLabel')}` : ''}`;
        text([label], 8, 12, '#55618a');
    }
    const dataUri = pdf.output('datauristring');
    return dataUri.slice(dataUri.indexOf(',') + 1);
}
