import { PDFDocument } from 'pdf-lib';

export function isPdfFile(file: File) {
    return file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
}

export async function appendPdfFiles(baseFile: File, filesToAppend: File[]) {
    const mergedPdf = await PDFDocument.create();
    const allFiles = [baseFile, ...filesToAppend];

    for (const file of allFiles) {
        const sourcePdf = await PDFDocument.load(await file.arrayBuffer());
        const copiedPages = await mergedPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    return mergedPdf.save();
}
