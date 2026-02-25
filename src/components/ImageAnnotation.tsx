'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Image as KonvaImage, Transformer } from 'react-konva';
import type { ImageAnnotation as ImageAnnotationType } from '@/types';
import Konva from 'konva';

interface ImageAnnotationProps {
    annotation: ImageAnnotationType;
    isSelected: boolean;
    onSelect: (id: string) => void;
    onChange: (id: string, updates: Partial<ImageAnnotationType>) => void;
    onDelete: (id: string) => void;
}

export default function ImageAnnotation({
    annotation,
    isSelected,
    onSelect,
    onChange,
    onDelete,
}: ImageAnnotationProps) {
    const imageRef = useRef<Konva.Image>(null);
    const trRef = useRef<Konva.Transformer>(null);
    const [image, setImage] = useState<HTMLImageElement | null>(null);

    // Load the image from base64 data
    useEffect(() => {
        const img = new window.Image();
        img.src = annotation.imageData;
        img.onload = () => setImage(img);
    }, [annotation.imageData]);

    useEffect(() => {
        if (isSelected && trRef.current && imageRef.current) {
            trRef.current.nodes([imageRef.current]);
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
        const node = imageRef.current;
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
        });
    }, [annotation.id, onChange]);

    // Handle keyboard delete
    useEffect(() => {
        if (!isSelected) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (document.activeElement?.tagName !== 'TEXTAREA' && document.activeElement?.tagName !== 'INPUT') {
                    onDelete(annotation.id);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isSelected, annotation.id, onDelete]);

    if (!image) return null;

    return (
        <>
            <KonvaImage
                ref={imageRef}
                id={annotation.id}
                x={annotation.x}
                y={annotation.y}
                width={annotation.width}
                height={annotation.height}
                image={image}
                draggable
                onClick={() => onSelect(annotation.id)}
                onTap={() => onSelect(annotation.id)}
                onDragEnd={handleDragEnd}
                onTransformEnd={handleTransformEnd}
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
                    keepRatio={true}
                    boundBoxFunc={(oldBox, newBox) => {
                        if (newBox.width < 20 || newBox.height < 20) return oldBox;
                        return newBox;
                    }}
                />
            )}
        </>
    );
}
