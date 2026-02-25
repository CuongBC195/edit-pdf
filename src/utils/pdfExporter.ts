/**
 * PDF Export utility using pdf-lib
 * Takes the original PDF and annotation metadata, produces a new PDF
 * with text and images embedded at the correct positions.
 * 
 * Vietnamese UTF-8 support: Uses a bundled Tinos font (Times New Roman compatible)
 * loaded from /fonts/times-new-roman.ttf for full Unicode text rendering.
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as fontkit from 'fontkit';
import { canvasToPdf } from './coordinateMapper';
import type { Annotation, TextAnnotation, ImageAnnotation } from '@/types';

/**
 * Export a modified PDF with all annotations embedded.
 * 
 * @param originalPdfBytes - The original PDF file as ArrayBuffer
 * @param annotations - All annotations across all pages
 * @param scale - The render scale used for display (to convert coords back)
 * @param customFontBytes - Optional custom font bytes for text rendering
 */
export async function exportPdf(
    originalPdfBytes: ArrayBuffer,
    annotations: Annotation[],
    scale: number,
    customFontBytes?: ArrayBuffer
): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(originalPdfBytes);

    // Register fontkit for custom font support (Vietnamese UTF-8)
    pdfDoc.registerFontkit(fontkit as never);

    // Load custom font for full Unicode support (Vietnamese, etc.)
    let customFont;
    if (customFontBytes) {
        try {
            customFont = await pdfDoc.embedFont(customFontBytes, { subset: false });
        } catch (e) {
            console.warn('Failed to embed custom font:', e);
        }
    }

    // Fall back to Helvetica (built-in, ASCII only) — used only if custom font fails
    const standardFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const pages = pdfDoc.getPages();

    // Group annotations by page
    const annotationsByPage = new Map<number, Annotation[]>();
    for (const ann of annotations) {
        const pageAnns = annotationsByPage.get(ann.page) || [];
        pageAnns.push(ann);
        annotationsByPage.set(ann.page, pageAnns);
    }

    // Process each page's annotations
    for (const [pageNum, pageAnnotations] of annotationsByPage) {
        const pageIndex = pageNum - 1;
        if (pageIndex < 0 || pageIndex >= pages.length) continue;

        const page = pages[pageIndex];
        const { height: pageHeight } = page.getSize();

        for (const annotation of pageAnnotations) {
            if (annotation.type === 'text') {
                await drawTextAnnotation(page, annotation, pageHeight, scale, customFont, standardFont);
            } else if (annotation.type === 'image') {
                await drawImageAnnotation(pdfDoc, page, annotation, pageHeight, scale);
            }
        }
    }

    return pdfDoc.save();
}

/**
 * Draw a text annotation on a PDF page.
 * Converts canvas coordinates to PDF coordinates and draws text.
 * Uses custom font for Unicode support; falls back to standard font for ASCII-only text.
 */
async function drawTextAnnotation(
    page: ReturnType<PDFDocument['getPages']>[0],
    annotation: TextAnnotation,
    pageHeight: number,
    scale: number,
    customFont: Awaited<ReturnType<PDFDocument['embedFont']>> | undefined,
    standardFont: Awaited<ReturnType<PDFDocument['embedFont']>>
) {
    const pdfCoords = canvasToPdf(
        {
            x: annotation.x,
            y: annotation.y,
            width: annotation.width,
            height: annotation.height,
        },
        pageHeight,
        scale
    );

    // Parse hex color to RGB values (0-1 range)
    const color = hexToRgb(annotation.color);
    const pdfFontSize = annotation.fontSize / scale;

    // Choose font: use custom font for Unicode text, standard for ASCII-only
    const hasNonAscii = /[^\x00-\x7F]/.test(annotation.content);
    let font = standardFont;

    if (customFont) {
        // Always prefer custom font when available (better Unicode support)
        font = customFont;
    } else if (hasNonAscii) {
        // No custom font but text has non-ASCII chars — strip unsupported chars
        console.warn('Custom font not available. Non-ASCII characters may not render correctly.');
    }

    // Split text into lines and draw each line
    const lines = annotation.content.split('\n');
    const lineHeight = pdfFontSize * 1.2;

    for (let i = 0; i < lines.length; i++) {
        let lineText = lines[i];

        // If using standard font (no custom font), filter out non-encodable chars
        if (!customFont && hasNonAscii) {
            lineText = lineText.replace(/[^\x00-\x7F]/g, '?');
        }

        try {
            page.drawText(lineText, {
                x: pdfCoords.x,
                // Position from top of text block, moving down per line
                y: pdfCoords.y + pdfCoords.height - pdfFontSize - (i * lineHeight),
                size: pdfFontSize,
                font,
                color: rgb(color.r, color.g, color.b),
            });
        } catch (e) {
            console.error('Failed to draw text line:', lineText, e);
            // Last resort: try with all non-ASCII stripped
            const safeText = lineText.replace(/[^\x20-\x7E]/g, '?');
            page.drawText(safeText, {
                x: pdfCoords.x,
                y: pdfCoords.y + pdfCoords.height - pdfFontSize - (i * lineHeight),
                size: pdfFontSize,
                font: standardFont,
                color: rgb(color.r, color.g, color.b),
            });
        }
    }
}

/**
 * Draw an image annotation on a PDF page.
 * Embeds the image and draws it at the correct position and size.
 */
async function drawImageAnnotation(
    pdfDoc: PDFDocument,
    page: ReturnType<PDFDocument['getPages']>[0],
    annotation: ImageAnnotation,
    pageHeight: number,
    scale: number
) {
    const pdfCoords = canvasToPdf(
        {
            x: annotation.x,
            y: annotation.y,
            width: annotation.width,
            height: annotation.height,
        },
        pageHeight,
        scale
    );

    // Determine image type and embed accordingly
    const imageData = annotation.imageData;
    let embeddedImage;

    try {
        if (imageData.includes('image/png')) {
            const base64 = imageData.split(',')[1];
            const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
            embeddedImage = await pdfDoc.embedPng(bytes);
        } else {
            // Assume JPEG for other formats
            const base64 = imageData.split(',')[1];
            const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
            embeddedImage = await pdfDoc.embedJpg(bytes);
        }

        page.drawImage(embeddedImage, {
            x: pdfCoords.x,
            y: pdfCoords.y,
            width: pdfCoords.width,
            height: pdfCoords.height,
        });
    } catch (e) {
        console.error('Failed to embed image:', e);
    }
}

/**
 * Convert hex color string to RGB values (0-1 range).
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return { r: 0, g: 0, b: 0 };

    return {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
    };
}
