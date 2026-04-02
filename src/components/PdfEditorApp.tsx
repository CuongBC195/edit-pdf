'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import PdfUploader from '@/components/PdfUploader';
import Toolbar from '@/components/Toolbar';
import PageThumbnails from '@/components/PageThumbnails';
import { loadPdfPages } from '@/utils/pdfRenderer';
import { exportPdf } from '@/utils/pdfExporter';
import {
    savePdfFile,
    loadSavedPdfFile,
    saveAnnotations,
    loadSavedAnnotations,
    saveSettings,
    loadSavedSettings,
    clearSession,
} from '@/utils/sessionStorage';
import type { Annotation, ImageAnnotation as ImageAnnotationType, PdfPage, Tool } from '@/types';

// Dynamically import PdfViewer (uses Konva which requires window)
const PdfViewer = dynamic(() => import('@/components/PdfViewer'), {
    ssr: false,
    loading: () => (
        <div className="pdf-viewer-loading">
            <div className="upload-spinner" />
            <p>Loading editor...</p>
        </div>
    ),
});

const RENDER_SCALE = 1.5;

export default function PdfEditorApp() {
    const [file, setFile] = useState<File | null>(null);
    const [pages, setPages] = useState<PdfPage[]>([]);
    const [annotations, setAnnotations] = useState<Annotation[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedTool, setSelectedTool] = useState<Tool>('select');
    const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
    const [fontSize, setFontSize] = useState(20);
    const [fontColor, setFontColor] = useState('#000000');
    const [isLoading, setIsLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isRestoring, setIsRestoring] = useState(true); // Start true to check session
    const fileRef = useRef<File | null>(null);
    const hasRestoredRef = useRef(false);

    // ── Restore saved session on mount ──
    useEffect(() => {
        if (hasRestoredRef.current) return;
        hasRestoredRef.current = true;

        async function restoreSession() {
            try {
                const savedFile = await loadSavedPdfFile();
                if (!savedFile) {
                    setIsRestoring(false);
                    return;
                }

                // Re-render the saved PDF
                const pdfPages = await loadPdfPages(savedFile, RENDER_SCALE);

                // Restore annotations
                const savedAnnotations = loadSavedAnnotations() as Annotation[] | null;
                const savedSettings = loadSavedSettings();

                setFile(savedFile);
                fileRef.current = savedFile;
                setPages(pdfPages);
                setAnnotations(savedAnnotations || []);
                setCurrentPage(savedSettings?.currentPage || 1);
                setFontSize(savedSettings?.fontSize || 20);
                setFontColor(savedSettings?.fontColor || '#000000');
                setSelectedTool('select');

                console.log('Session restored:', savedFile.name);
            } catch (e) {
                console.warn('Failed to restore session:', e);
            } finally {
                setIsRestoring(false);
            }
        }

        restoreSession();
    }, []);

    // ── Auto-save annotations whenever they change ──
    useEffect(() => {
        if (isRestoring || !file) return;
        saveAnnotations(annotations);
    }, [annotations, isRestoring, file]);

    // ── Auto-save settings whenever they change ──
    useEffect(() => {
        if (isRestoring || !file) return;
        saveSettings({
            currentPage,
            fontSize,
            fontColor,
            fileName: file.name,
        });
    }, [currentPage, fontSize, fontColor, isRestoring, file]);

    // Handle PDF file upload
    const handleFileSelect = useCallback(async (selectedFile: File) => {
        setIsLoading(true);
        try {
            const pdfPages = await loadPdfPages(selectedFile, RENDER_SCALE);
            setFile(selectedFile);
            fileRef.current = selectedFile;
            setPages(pdfPages);
            setCurrentPage(1);
            setAnnotations([]);
            setSelectedAnnotationId(null);
            setSelectedTool('select');

            // Save PDF to IndexedDB for session persistence
            await savePdfFile(selectedFile);
        } catch (error) {
            console.error('Failed to load PDF:', error);
            alert('Failed to load PDF. Please try another file.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Add a new annotation
    const handleAnnotationAdd = useCallback((annotation: Annotation) => {
        setAnnotations((prev) => [...prev, annotation]);
        setSelectedAnnotationId(annotation.id);
        if (annotation.type === 'text') {
            setSelectedTool('select');
        }
    }, []);

    // Select an annotation
    const handleAnnotationSelect = useCallback((id: string | null) => {
        setSelectedAnnotationId(id);
    }, []);

    // Update an annotation
    const handleAnnotationChange = useCallback((id: string, updates: Record<string, unknown>) => {
        setAnnotations((prev) =>
            prev.map((ann) => {
                if (ann.id !== id) return ann;
                if (ann.type === 'text') {
                    return { ...ann, ...updates } as Annotation;
                }
                return { ...ann, ...updates } as Annotation;
            })
        );
    }, []);

    // Delete an annotation
    const handleAnnotationDelete = useCallback((id: string) => {
        setAnnotations((prev) => prev.filter((ann) => ann.id !== id));
        setSelectedAnnotationId(null);
    }, []);

    // Handle image upload from toolbar
    const handleImageUpload = useCallback(
        (imageData: string, width: number, height: number) => {
            // Scale image to a reasonable initial size (max 200px wide)
            const maxWidth = 200;
            const scale = width > maxWidth ? maxWidth / width : 1;
            const displayWidth = width * scale;
            const displayHeight = height * scale;

            const newImage: ImageAnnotationType = {
                id: `ann_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                page: currentPage,
                type: 'image',
                imageData,
                x: 50,
                y: 50,
                width: displayWidth,
                height: displayHeight,
                originalWidth: width,
                originalHeight: height,
            };
            handleAnnotationAdd(newImage);
            setSelectedTool('select');
        },
        [currentPage, handleAnnotationAdd]
    );

    // Export PDF with all annotations
    const handleExport = useCallback(async () => {
        if (!fileRef.current) return;
        setIsExporting(true);

        try {
            const arrayBuffer = await fileRef.current.arrayBuffer();

            // Try to load custom font for Vietnamese support
            let fontBytes: ArrayBuffer | undefined;
            try {
                const fontResponse = await fetch('/fonts/times-new-roman.ttf');
                if (fontResponse.ok) {
                    fontBytes = await fontResponse.arrayBuffer();
                }
            } catch {
                console.warn('Custom font not available, using standard font');
            }

            const pdfBytes = await exportPdf(arrayBuffer, annotations, RENDER_SCALE, fontBytes);

            // Trigger download — use slice to ensure clean ArrayBuffer
            // (pdfBytes.buffer may be a view into a larger buffer)
            const cleanBytes = new Uint8Array(pdfBytes);
            const blob = new Blob([cleanBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `edited_${fileRef.current.name}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export PDF. Please try again.');
        } finally {
            setIsExporting(false);
        }
    }, [annotations]);

    // Reset to upload screen and clear saved session
    const handleReset = useCallback(async () => {
        setFile(null);
        fileRef.current = null;
        setPages([]);
        setAnnotations([]);
        setCurrentPage(1);
        setSelectedAnnotationId(null);
        setSelectedTool('select');

        // Clear all saved data
        await clearSession();
    }, []);

    const currentPageData = pages.find((p) => p.pageNumber === currentPage);

    // Show loading state while restoring session
    if (isRestoring) {
        return (
            <div className="pdf-viewer-loading" style={{ minHeight: '100vh' }}>
                <div className="upload-spinner" />
                <p>Restoring session...</p>
            </div>
        );
    }

    // Show upload screen if no file loaded
    if (!file || pages.length === 0) {
        return <PdfUploader onFileSelect={handleFileSelect} isLoading={isLoading} />;
    }

    return (
        <div className="editor-layout">
            {/* Left Sidebar: Page Thumbnails */}
            <aside className="editor-sidebar">
                <PageThumbnails
                    pages={pages}
                    currentPage={currentPage}
                    onPageSelect={setCurrentPage}
                />
            </aside>

            {/* Center: PDF Viewer */}
            <main className="editor-main">
                {currentPageData && (
                    <PdfViewer
                        page={currentPageData}
                        annotations={annotations}
                        selectedAnnotationId={selectedAnnotationId}
                        selectedTool={selectedTool}
                        fontSize={fontSize}
                        fontColor={fontColor}
                        currentPage={currentPage}
                        totalPages={pages.length}
                        onAnnotationAdd={handleAnnotationAdd}
                        onAnnotationSelect={handleAnnotationSelect}
                        onAnnotationChange={handleAnnotationChange}
                        onAnnotationDelete={handleAnnotationDelete}
                        onPageChange={setCurrentPage}
                    />
                )}
            </main>

            {/* Right Sidebar: Toolbar */}
            <aside className="editor-toolbar">
                <Toolbar
                    selectedTool={selectedTool}
                    onToolSelect={setSelectedTool}
                    fontSize={fontSize}
                    onFontSizeChange={setFontSize}
                    fontColor={fontColor}
                    onFontColorChange={setFontColor}
                    onImageUpload={handleImageUpload}
                    onExport={handleExport}
                    isExporting={isExporting}
                    currentPage={currentPage}
                    totalPages={pages.length}
                    onPageChange={setCurrentPage}
                    onReset={handleReset}
                />
            </aside>
        </div>
    );
}
