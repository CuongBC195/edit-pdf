// Types for PDF Editor annotations and state

export type Tool = 'select' | 'text' | 'image';

export interface TextAnnotation {
    id: string;
    page: number;
    type: 'text';
    content: string;
    x: number;
    y: number;
    fontSize: number;
    color: string;
    width: number;
    height: number;
}

export interface ImageAnnotation {
    id: string;
    page: number;
    type: 'image';
    imageData: string; // base64 data URL
    x: number;
    y: number;
    width: number;
    height: number;
    originalWidth: number;
    originalHeight: number;
}

export type Annotation = TextAnnotation | ImageAnnotation;

export interface PdfPage {
    pageNumber: number;
    width: number;
    height: number;
    imageData: string; // rendered page as data URL
    originalWidth: number;
    originalHeight: number;
}

export interface EditorState {
    file: File | null;
    pages: PdfPage[];
    annotations: Annotation[];
    currentPage: number;
    selectedTool: Tool;
    selectedAnnotationId: string | null;
    fontSize: number;
    fontColor: string;
    isExporting: boolean;
    isLoading: boolean;
    scale: number;
}
