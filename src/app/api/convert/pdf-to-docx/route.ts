import { NextRequest, NextResponse } from 'next/server';

const CONVERSION_SERVICE_URL = process.env.CONVERSION_SERVICE_URL || 'http://localhost:8000';
const CONVERSION_API_KEY = process.env.CONVERSION_API_KEY || '';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        if (file.type !== 'application/pdf') {
            return NextResponse.json({ error: 'File must be a PDF' }, { status: 400 });
        }

        const serviceForm = new FormData();
        serviceForm.append('file', file, file.name);

        const headers: Record<string, string> = {};
        if (CONVERSION_API_KEY) {
            headers['X-API-Key'] = CONVERSION_API_KEY;
        }

        const response = await fetch(`${CONVERSION_SERVICE_URL}/api/convert/pdf-to-docx`, {
            method: 'POST',
            headers,
            body: serviceForm,
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error('Conversion service error:', response.status, errText);
            return NextResponse.json(
                { error: `Conversion error (${response.status}): ${errText.slice(0, 300)}` },
                { status: 502 }
            );
        }

        const docxBuffer = await response.arrayBuffer();
        const originalName = file.name.replace(/\.pdf$/i, '.docx');
        const safeDocxName = originalName.replace(/[^\x00-\x7F]/g, '_');

        return new NextResponse(docxBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': `attachment; filename="${safeDocxName}"; filename*=UTF-8''${encodeURIComponent(originalName)}`,
            },
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('PDF to DOCX conversion error:', message);

        if (message.includes('ECONNREFUSED') || message.includes('fetch failed')) {
            return NextResponse.json(
                { error: 'Cannot connect to conversion service. Please check CONVERSION_SERVICE_URL.' },
                { status: 503 }
            );
        }

        return NextResponse.json(
            { error: `Conversion error: ${message}` },
            { status: 500 }
        );
    }
}
