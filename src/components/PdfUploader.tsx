'use client';

import React, { useCallback, useRef, useState } from 'react';
import { isPdfFile } from '@/utils/pdfMerger';

interface PdfUploaderProps {
    onFileSelect: (files: File[]) => void;
    isLoading: boolean;
}

export default function PdfUploader({ onFileSelect, isLoading }: PdfUploaderProps) {
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFiles = useCallback(
        (files: FileList | File[]) => {
            const validFiles = Array.from(files).filter((file) => {
                if (!isPdfFile(file)) {
                    alert(`Skipped ${file.name}: Please upload a PDF file.`);
                    return false;
                }
                if (file.size > 20 * 1024 * 1024) {
                    alert(`Skipped ${file.name}: File size must be less than 20MB.`);
                    return false;
                }
                return true;
            });
            if (validFiles.length > 0) {
                onFileSelect(validFiles);
            }
        },
        [onFileSelect]
    );

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragOver(false);
            if (e.dataTransfer.files.length > 0) {
                handleFiles(e.dataTransfer.files);
            }
        },
        [handleFiles]
    );

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.target.files && e.target.files.length > 0) {
                handleFiles(e.target.files);
            }
        },
        [handleFiles]
    );

    return (
        <div className="upload-container">
            <div className="upload-hero">
                <div className="upload-hero-glow" />
                <h1 className="upload-title">
                    <span className="upload-title-gradient">PDF Editor</span>
                </h1>
                <p className="upload-subtitle">
                    Upload a PDF, add text &amp; images, export — all in your browser.
                </p>

                <div
                    className={`upload-zone ${isDragOver ? 'upload-zone--drag-over' : ''} ${isLoading ? 'upload-zone--loading' : ''}`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    role="button"
                    tabIndex={0}
                    aria-label="Upload PDF file"
                >
                    {isLoading ? (
                        <div className="upload-loading">
                            <div className="upload-spinner" />
                            <p>Loading PDF...</p>
                        </div>
                    ) : (
                        <>
                            <div className="upload-icon">
                                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                    <line x1="12" y1="18" x2="12" y2="12" />
                                    <line x1="9" y1="15" x2="12" y2="12" />
                                    <line x1="15" y1="15" x2="12" y2="12" />
                                </svg>
                            </div>
                            <p className="upload-text">
                                <strong>Drop your PDF files here</strong> or click to browse
                            </p>
                            <p className="upload-hint">Supports single or multiple PDF files up to 20MB</p>
                        </>
                    )}

                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".pdf,application/pdf"
                        onChange={handleInputChange}
                        className="upload-input-hidden"
                        aria-hidden="true"
                    />
                </div>

            </div>
        </div>
    );
}
