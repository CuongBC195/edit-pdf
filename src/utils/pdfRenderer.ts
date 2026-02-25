/**
 * PDF rendering utility using pdf.js
 * Loads a PDF file and renders pages to canvas for display.
 */

import * as pdfjsLib from 'pdfjs-dist';

// Configure pdf.js worker — use local copy since v5 isn't on CDN yet
if (typeof window !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

import type { PdfPage } from '@/types';

/**
 * Load and render all pages of a PDF file.
 * Returns page data including rendered images and dimensions.
 */
export async function loadPdfPages(
    file: File,
    scale: number = 1.5
): Promise<PdfPage[]> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pages: PdfPage[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale });

        // Create offscreen canvas to render the page
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const ctx = canvas.getContext('2d')!;
        await page.render({ canvas: null, canvasContext: ctx, viewport }).promise;

        pages.push({
            pageNumber: i,
            width: viewport.width,
            height: viewport.height,
            imageData: canvas.toDataURL('image/png'),
            originalWidth: page.getViewport({ scale: 1 }).width,
            originalHeight: page.getViewport({ scale: 1 }).height,
        });
    }

    return pages;
}

/**
 * Render a single page thumbnail at lower resolution.
 */
export async function renderThumbnail(
    file: File,
    pageNumber: number,
    scale: number = 0.3
): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const ctx = canvas.getContext('2d')!;
    await page.render({ canvas: null, canvasContext: ctx, viewport }).promise;

    return canvas.toDataURL('image/jpeg', 0.6);
}
