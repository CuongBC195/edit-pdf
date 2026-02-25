/**
 * Coordinate mapping utilities for canvas ↔ PDF coordinate conversion.
 * 
 * pdf.js renders with origin at TOP-LEFT (y increases downward)
 * PDF spec uses origin at BOTTOM-LEFT (y increases upward)
 * 
 * All annotations store positions in canvas coordinates.
 * Conversion to PDF coordinates happens only at export time.
 */

interface CanvasCoords {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface PdfCoords {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * Convert canvas coordinates to PDF coordinates.
 * Flips Y-axis and scales from render resolution to PDF points.
 * 
 * @param canvas - Position and size in canvas pixels
 * @param pageHeight - PDF page height in points
 * @param scale - Render scale factor (canvas pixels / PDF points)
 */
export function canvasToPdf(
    canvas: CanvasCoords,
    pageHeight: number,
    scale: number
): PdfCoords {
    const pdfWidth = canvas.width / scale;
    const pdfHeight = canvas.height / scale;
    const pdfX = canvas.x / scale;
    // Flip Y: PDF origin is bottom-left, canvas origin is top-left
    // The top of the element in canvas becomes (pageHeight - canvasY/scale)
    // But we need the bottom-left corner for PDF, so subtract element height
    const pdfY = pageHeight - (canvas.y / scale) - pdfHeight;

    return { x: pdfX, y: pdfY, width: pdfWidth, height: pdfHeight };
}

/**
 * Convert PDF coordinates to canvas coordinates.
 * Used when loading existing annotations (future feature).
 */
export function pdfToCanvas(
    pdf: PdfCoords,
    pageHeight: number,
    scale: number
): CanvasCoords {
    const canvasWidth = pdf.width * scale;
    const canvasHeight = pdf.height * scale;
    const canvasX = pdf.x * scale;
    const canvasY = (pageHeight - pdf.y - pdf.height) * scale;

    return { x: canvasX, y: canvasY, width: canvasWidth, height: canvasHeight };
}
