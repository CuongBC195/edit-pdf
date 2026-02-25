'use client';

import React from 'react';
import type { PdfPage } from '@/types';

interface PageThumbnailsProps {
    pages: PdfPage[];
    currentPage: number;
    onPageSelect: (pageNumber: number) => void;
}

export default function PageThumbnails({ pages, currentPage, onPageSelect }: PageThumbnailsProps) {
    return (
        <div className="thumbnails-container">
            <div className="thumbnails-header">
                <span className="thumbnails-title">Pages</span>
                <span className="thumbnails-count">{pages.length}</span>
            </div>
            <div className="thumbnails-list">
                {pages.map((page) => (
                    <button
                        key={page.pageNumber}
                        className={`thumbnail-item ${page.pageNumber === currentPage ? 'thumbnail-item--active' : ''}`}
                        onClick={() => onPageSelect(page.pageNumber)}
                        aria-label={`Go to page ${page.pageNumber}`}
                    >
                        <div className="thumbnail-preview">
                            <img
                                src={page.imageData}
                                alt={`Page ${page.pageNumber}`}
                                className="thumbnail-image"
                                draggable={false}
                            />
                        </div>
                        <span className="thumbnail-label">{page.pageNumber}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
