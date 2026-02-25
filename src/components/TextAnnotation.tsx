'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { Text, Transformer } from 'react-konva';
import type { TextAnnotation as TextAnnotationType } from '@/types';
import Konva from 'konva';

interface TextAnnotationProps {
    annotation: TextAnnotationType;
    isSelected: boolean;
    onSelect: (id: string) => void;
    onChange: (id: string, updates: Partial<TextAnnotationType>) => void;
    onDelete: (id: string) => void;
}

export default function TextAnnotation({
    annotation,
    isSelected,
    onSelect,
    onChange,
    onDelete,
}: TextAnnotationProps) {
    const textRef = useRef<Konva.Text>(null);
    const trRef = useRef<Konva.Transformer>(null);

    useEffect(() => {
        if (isSelected && trRef.current && textRef.current) {
            trRef.current.nodes([textRef.current]);
            trRef.current.getLayer()?.batchDraw();
        }
    }, [isSelected]);

    const handleDragEnd = useCallback(
        (e: Konva.KonvaEventObject<DragEvent>) => {
            onChange(annotation.id, {
                x: e.target.x(),
                y: e.target.y(),
            });
        },
        [annotation.id, onChange]
    );

    const handleTransformEnd = useCallback(() => {
        const node = textRef.current;
        if (!node) return;

        const scaleX = node.scaleX();
        const scaleY = node.scaleY();

        // Reset scale and apply to width/height
        node.scaleX(1);
        node.scaleY(1);

        onChange(annotation.id, {
            x: node.x(),
            y: node.y(),
            width: Math.max(20, node.width() * scaleX),
            height: Math.max(20, node.height() * scaleY),
            fontSize: Math.max(8, annotation.fontSize * scaleY),
        });
    }, [annotation.id, annotation.fontSize, onChange]);

    /**
     * Double-click to edit: creates a textarea positioned exactly over
     * the Konva text node inside the stage wrapper container.
     */
    const handleDblClick = useCallback(() => {
        const node = textRef.current;
        if (!node) return;

        const stage = node.getStage();
        if (!stage) return;

        // Get the stage wrapper container (the element that wraps the Konva canvas)
        const stageContainer = stage.container();
        const stageWrapper = stageContainer.closest('.pdf-stage-wrapper') as HTMLElement;
        if (!stageWrapper) return;

        // Get the absolute transform of the text node (includes stage scale)
        const absTransform = node.getAbsoluteTransform();
        const absPos = absTransform.point({ x: 0, y: 0 });

        // The stage scale is applied, so absPos already includes it
        const stageScale = stage.scaleX();
        const scaledFontSize = annotation.fontSize * stageScale;
        const scaledWidth = Math.max(annotation.width * stageScale, 120);
        const scaledHeight = Math.max((annotation.height || annotation.fontSize * 1.5) * stageScale, 30);

        // Hide the Konva text node while editing
        node.visible(false);
        node.getLayer()?.batchDraw();

        // Create textarea inside the stage wrapper, positioned absolutely
        const textarea = document.createElement('textarea');
        stageWrapper.style.position = 'relative';
        stageWrapper.appendChild(textarea);

        textarea.value = annotation.content;
        textarea.style.position = 'absolute';
        textarea.style.top = `${absPos.y}px`;
        textarea.style.left = `${absPos.x}px`;
        textarea.style.width = `${scaledWidth}px`;
        textarea.style.minHeight = `${scaledHeight}px`;
        textarea.style.fontSize = `${scaledFontSize}px`;
        textarea.style.fontFamily = '"Times New Roman", Times, serif';
        textarea.style.color = annotation.color;
        textarea.style.border = '2px solid #6366f1';
        textarea.style.borderRadius = '3px';
        textarea.style.padding = '0 2px';
        textarea.style.margin = '0';
        textarea.style.background = 'rgba(255, 255, 255, 0.95)';
        textarea.style.outline = 'none';
        textarea.style.resize = 'both';
        textarea.style.overflow = 'hidden';
        textarea.style.zIndex = '10';
        textarea.style.lineHeight = '1.2';
        textarea.style.boxSizing = 'border-box';
        textarea.style.transformOrigin = 'left top';

        textarea.focus();
        textarea.select();

        // Auto-grow height
        const autoResize = () => {
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        };
        textarea.addEventListener('input', autoResize);
        autoResize();

        const cleanup = () => {
            const newContent = textarea.value;
            onChange(annotation.id, { content: newContent });
            node.visible(true);
            node.getLayer()?.batchDraw();
            if (stageWrapper.contains(textarea)) {
                stageWrapper.removeChild(textarea);
            }
        };

        const handleBlur = () => {
            cleanup();
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                textarea.blur();
            }
            // Allow Enter for newlines (don't stop propagation)
            e.stopPropagation();
        };

        textarea.addEventListener('blur', handleBlur);
        textarea.addEventListener('keydown', handleKeyDown);
    }, [annotation, onChange]);

    // Handle keyboard delete
    useEffect(() => {
        if (!isSelected) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Delete' || e.key === 'Backspace') {
                // Only delete if not editing text (no textarea focused)
                if (document.activeElement?.tagName !== 'TEXTAREA') {
                    onDelete(annotation.id);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isSelected, annotation.id, onDelete]);

    return (
        <>
            <Text
                ref={textRef}
                id={annotation.id}
                x={annotation.x}
                y={annotation.y}
                text={annotation.content}
                fontSize={annotation.fontSize}
                fontFamily='"Times New Roman", Times, serif'
                fill={annotation.color}
                width={annotation.width}
                draggable
                onClick={() => onSelect(annotation.id)}
                onTap={() => onSelect(annotation.id)}
                onDragEnd={handleDragEnd}
                onTransformEnd={handleTransformEnd}
                onDblClick={handleDblClick}
                onDblTap={handleDblClick}
                perfectDrawEnabled={false}
            />
            {isSelected && (
                <Transformer
                    ref={trRef}
                    rotateEnabled={false}
                    borderStroke="#6366f1"
                    anchorFill="#6366f1"
                    anchorStroke="#4f46e5"
                    anchorSize={8}
                    anchorCornerRadius={2}
                    boundBoxFunc={(oldBox, newBox) => {
                        if (newBox.width < 20 || newBox.height < 20) return oldBox;
                        return newBox;
                    }}
                />
            )}
        </>
    );
}
