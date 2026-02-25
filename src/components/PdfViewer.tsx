'use client';

import React, { useRef, useCallback, useEffect, useState } from 'react';
import { Stage, Layer, Image as KonvaImage } from 'react-konva';
import Konva from 'konva';
import TextAnnotation from './TextAnnotation';
import ImageAnnotation from './ImageAnnotation';
import type { Annotation, TextAnnotation as TextAnnotationType, ImageAnnotation as ImageAnnotationType, PdfPage, Tool } from '@/types';

interface PdfViewerProps {
    page: PdfPage;
    annotations: Annotation[];
    selectedAnnotationId: string | null;
    selectedTool: Tool;
    fontSize: number;
    fontColor: string;
    onAnnotationAdd: (annotation: Annotation) => void;
    onAnnotationSelect: (id: string | null) => void;
    onAnnotationChange: (id: string, updates: Record<string, unknown>) => void;
    onAnnotationDelete: (id: string) => void;
}

export default function PdfViewer({
    page,
    annotations,
    selectedAnnotationId,
    selectedTool,
    fontSize,
    fontColor,
    onAnnotationAdd,
    onAnnotationSelect,
    onAnnotationChange,
    onAnnotationDelete,
}: PdfViewerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
    const [stageSize, setStageSize] = useState({ width: page.width, height: page.height });
    const [displayScale, setDisplayScale] = useState(1);

    // Load the page background image
    useEffect(() => {
        const img = new window.Image();
        img.src = page.imageData;
        img.onload = () => setBgImage(img);
    }, [page.imageData]);

    // Fit stage to container while maintaining aspect ratio
    useEffect(() => {
        const updateSize = () => {
            if (!containerRef.current) return;
            const containerWidth = containerRef.current.clientWidth - 48; // padding
            const containerHeight = containerRef.current.clientHeight - 48;

            const pageAspect = page.width / page.height;
            let newWidth = containerWidth;
            let newHeight = containerWidth / pageAspect;

            if (newHeight > containerHeight) {
                newHeight = containerHeight;
                newWidth = containerHeight * pageAspect;
            }

            const scale = newWidth / page.width;
            setDisplayScale(scale);
            setStageSize({ width: newWidth, height: newHeight });
        };

        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, [page.width, page.height]);

    // Generate unique ID
    const generateId = () => `ann_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Handle click on stage to add new annotations
    const handleStageClick = useCallback(
        (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
            // If clicking on an annotation, don't add new
            const clickedOnEmpty = e.target === e.target.getStage() ||
                e.target.getClassName() === 'Image' && !e.target.id();

            if (!clickedOnEmpty && e.target.id()) {
                return; // Clicked on an annotation, handled by annotation component
            }

            if (selectedTool === 'text') {
                const pos = e.target.getStage()!.getPointerPosition()!;
                // Scale position back to the page coordinate system
                const x = pos.x / displayScale;
                const y = pos.y / displayScale;

                const newText: TextAnnotationType = {
                    id: generateId(),
                    page: page.pageNumber,
                    type: 'text',
                    content: 'Double-click to edit',
                    x,
                    y,
                    fontSize,
                    color: fontColor,
                    width: 200,
                    height: fontSize * 1.5,
                };
                onAnnotationAdd(newText);
            } else if (selectedTool === 'select') {
                // Deselect when clicking on empty area
                onAnnotationSelect(null);
            }
        },
        [selectedTool, fontSize, fontColor, page.pageNumber, onAnnotationAdd, onAnnotationSelect, displayScale]
    );

    const pageAnnotations = annotations.filter((a) => a.page === page.pageNumber);

    return (
        <div className="pdf-viewer" ref={containerRef}>
            <div
                className="pdf-stage-wrapper"
                style={{ width: stageSize.width, height: stageSize.height }}
            >
                <Stage
                    width={stageSize.width}
                    height={stageSize.height}
                    onClick={handleStageClick}
                    onTap={handleStageClick}
                    scaleX={displayScale}
                    scaleY={displayScale}
                    style={{ cursor: selectedTool === 'text' ? 'crosshair' : 'default' }}
                >
                    {/* Background layer - PDF page image */}
                    <Layer listening={false}>
                        {bgImage && (
                            <KonvaImage
                                image={bgImage}
                                width={page.width}
                                height={page.height}
                                perfectDrawEnabled={false}
                            />
                        )}
                    </Layer>

                    {/* Annotation layer */}
                    <Layer>
                        {pageAnnotations.map((ann) => {
                            if (ann.type === 'text') {
                                return (
                                    <TextAnnotation
                                        key={ann.id}
                                        annotation={ann as TextAnnotationType}
                                        isSelected={ann.id === selectedAnnotationId}
                                        onSelect={onAnnotationSelect}
                                        onChange={onAnnotationChange as unknown as (id: string, updates: Partial<TextAnnotationType>) => void}
                                        onDelete={onAnnotationDelete}
                                    />
                                );
                            } else {
                                return (
                                    <ImageAnnotation
                                        key={ann.id}
                                        annotation={ann as ImageAnnotationType}
                                        isSelected={ann.id === selectedAnnotationId}
                                        onSelect={onAnnotationSelect}
                                        onChange={onAnnotationChange as unknown as (id: string, updates: Partial<ImageAnnotationType>) => void}
                                        onDelete={onAnnotationDelete}
                                    />
                                );
                            }
                        })}
                    </Layer>
                </Stage>
            </div>
        </div>
    );
}
