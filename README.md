# PDF Editor — Client-Side Web App

A premium SaaS-style PDF editor built with Next.js. Upload PDFs, add text & images with drag-and-drop, and export — **100% client-side, your files never leave the browser**.

## Features

- 📄 **Upload PDF** — Drag & drop or click to upload (up to 20MB)
- ✏️ **Add Text** — Click to place, double-click to edit, drag to reposition, resize handles
- 🖼️ **Add Images** — Upload PNG/JPG, drag & resize with aspect ratio lock
- 📑 **Multi-page** — Page thumbnails sidebar, page navigation
- 📥 **Export PDF** — Download modified PDF with annotations at correct positions
- 🔒 **Private** — All processing happens in your browser, no server uploads

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| Next.js 16 (App Router) | Framework |
| pdfjs-dist v5 | PDF rendering |
| pdf-lib | PDF export/modification |
| Konva.js + react-konva | Drag & drop annotations |
| fontkit | Custom font embedding (Vietnamese UTF-8) |

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm

### Installation

```bash
cd edit_pdf
npm install
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm start
```

### Deploy to Vercel

```bash
npx vercel
```

## How to Use

1. **Upload**: Drop a PDF file on the upload zone or click to browse
2. **Navigate**: Click page thumbnails in the left sidebar to switch pages
3. **Add Text**: Select the **Text** tool → click on the PDF → text appears with "Double-click to edit"
4. **Edit Text**: Double-click any text to edit its content, use toolbar to change font size & color
5. **Add Image**: Click **Image** tool → select a PNG/JPG → image appears on the canvas
6. **Move & Resize**: Drag annotations to reposition, use corner handles to resize
7. **Delete**: Select an annotation and press `Delete` or `Backspace`
8. **Export**: Click **Export PDF** → modified PDF downloads automatically

## Vietnamese Font Support

To enable Vietnamese text in exported PDFs, place a Times New Roman `.ttf` file at:

```
public/fonts/times-new-roman.ttf
```

Without this font, the app falls back to the built-in Times Roman font (ASCII only).

## Project Structure

```
src/
├── app/
│   ├── globals.css          # Premium dark theme CSS
│   ├── layout.tsx           # Root layout with fonts
│   └── page.tsx             # Entry point (dynamic import)
├── components/
│   ├── PdfEditorApp.tsx     # Main editor orchestrator
│   ├── PdfUploader.tsx      # Upload screen
│   ├── PdfViewer.tsx        # Konva Stage + PDF rendering
│   ├── TextAnnotation.tsx   # Draggable text nodes
│   ├── ImageAnnotation.tsx  # Draggable image nodes
│   ├── PageThumbnails.tsx   # Page navigation sidebar
│   └── Toolbar.tsx          # Tools & properties panel
├── utils/
│   ├── pdfRenderer.ts       # pdf.js page rendering
│   ├── pdfExporter.ts       # pdf-lib export with coord mapping
│   └── coordinateMapper.ts  # Canvas ↔ PDF coordinate conversion
└── types/
    ├── index.ts             # Type definitions
    └── fontkit.d.ts         # fontkit type declarations
```
