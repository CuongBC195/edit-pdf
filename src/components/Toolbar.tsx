'use client';

import React, { useRef } from 'react';
import type { Tool } from '@/types';

interface ToolbarProps {
    selectedTool: Tool;
    onToolSelect: (tool: Tool) => void;
    fontSize: number;
    onFontSizeChange: (size: number) => void;
    fontColor: string;
    onFontColorChange: (color: string) => void;
    onImageUpload: (imageData: string, width: number, height: number) => void;
    onExport: () => void;
    isExporting: boolean;
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onReset: () => void;
}

export default function Toolbar({
    selectedTool,
    onToolSelect,
    fontSize,
    onFontSizeChange,
    fontColor,
    onFontColorChange,
    onImageUpload,
    onExport,
    isExporting,
    currentPage,
    totalPages,
    onPageChange,
    onReset,
}: ToolbarProps) {
    const imageInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please upload a PNG or JPG image.');
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.onload = () => {
                onImageUpload(reader.result as string, img.width, img.height);
            };
            img.src = reader.result as string;
        };
        reader.readAsDataURL(file);

        // Reset input so same file can be uploaded again
        e.target.value = '';
    };

    const handleImageToolClick = () => {
        if (selectedTool === 'image') {
            imageInputRef.current?.click();
        } else {
            onToolSelect('image');
            // Small delay to show tool selection, then open file picker
            setTimeout(() => imageInputRef.current?.click(), 100);
        }
    };

    return (
        <div className="toolbar">
            {/* Tool Selection */}
            <div className="toolbar-section">
                <span className="toolbar-section-label">Tools</span>
                <div className="toolbar-tools">
                    <button
                        className={`toolbar-btn ${selectedTool === 'select' ? 'toolbar-btn--active' : ''}`}
                        onClick={() => onToolSelect('select')}
                        title="Select & Move (V)"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
                        </svg>
                        <span>Select</span>
                    </button>
                    <button
                        className={`toolbar-btn ${selectedTool === 'text' ? 'toolbar-btn--active' : ''}`}
                        onClick={() => onToolSelect('text')}
                        title="Add Text (T)"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="4 7 4 4 20 4 20 7" />
                            <line x1="9" y1="20" x2="15" y2="20" />
                            <line x1="12" y1="4" x2="12" y2="20" />
                        </svg>
                        <span>Text</span>
                    </button>
                    <button
                        className={`toolbar-btn ${selectedTool === 'image' ? 'toolbar-btn--active' : ''}`}
                        onClick={handleImageToolClick}
                        title="Add Image (I)"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                        </svg>
                        <span>Image</span>
                    </button>
                </div>
            </div>

            {/* Text Properties */}
            {(selectedTool === 'text' || selectedTool === 'select') && (
                <div className="toolbar-section">
                    <span className="toolbar-section-label">Text Style</span>
                    <div className="toolbar-property">
                        <label className="toolbar-label" htmlFor="fontSize">Size</label>
                        <div className="toolbar-size-control">
                            <button
                                className="toolbar-size-btn"
                                onClick={() => onFontSizeChange(Math.max(8, fontSize - 2))}
                            >−</button>
                            <input
                                id="fontSize"
                                type="number"
                                className="toolbar-size-input"
                                value={fontSize}
                                onChange={(e) => onFontSizeChange(Math.max(8, parseInt(e.target.value) || 14))}
                                min={8}
                                max={120}
                            />
                            <button
                                className="toolbar-size-btn"
                                onClick={() => onFontSizeChange(Math.min(120, fontSize + 2))}
                            >+</button>
                        </div>
                    </div>
                    <div className="toolbar-property">
                        <label className="toolbar-label" htmlFor="fontColor">Color</label>
                        <div className="toolbar-color-control">
                            <input
                                id="fontColor"
                                type="color"
                                className="toolbar-color-input"
                                value={fontColor}
                                onChange={(e) => onFontColorChange(e.target.value)}
                            />
                            <span className="toolbar-color-hex">{fontColor}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Page Navigation */}
            <div className="toolbar-section">
                <span className="toolbar-section-label">Page</span>
                <div className="toolbar-pagination">
                    <button
                        className="toolbar-nav-btn"
                        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                        disabled={currentPage <= 1}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                    </button>
                    <span className="toolbar-page-info">
                        {currentPage} / {totalPages}
                    </span>
                    <button
                        className="toolbar-nav-btn"
                        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage >= totalPages}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="9 18 15 12 9 6" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Actions */}
            <div className="toolbar-section toolbar-section--actions">
                <button
                    className="toolbar-export-btn"
                    onClick={onExport}
                    disabled={isExporting}
                >
                    {isExporting ? (
                        <>
                            <div className="toolbar-export-spinner" />
                            Exporting...
                        </>
                    ) : (
                        <>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            Export PDF
                        </>
                    )}
                </button>
                <button className="toolbar-reset-btn" onClick={onReset} title="Upload a new PDF">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                        <path d="M3 3v5h5" />
                    </svg>
                    New PDF
                </button>
            </div>

            {/* Hidden image input */}
            <input
                ref={imageInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleImageChange}
                className="upload-input-hidden"
                aria-hidden="true"
            />
        </div>
    );
}
