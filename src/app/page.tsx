'use client';

import dynamic from 'next/dynamic';

const PdfEditorApp = dynamic(() => import('@/components/PdfEditorApp'), {
  ssr: false,
  loading: () => (
    <div className="pdf-viewer-loading" style={{ minHeight: '100vh' }}>
      <div className="upload-spinner" />
      <p>Loading PDF Editor...</p>
    </div>
  ),
});

export default function Home() {
  return <PdfEditorApp />;
}
