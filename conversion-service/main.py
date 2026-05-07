import os
import tempfile
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile, Header
from fastapi.responses import Response

app = FastAPI(title="PDF to DOCX Conversion Service")

API_KEY = os.environ.get("API_KEY", "")


def verify_api_key(x_api_key: str = Header(default="")):
    if API_KEY and x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/convert/pdf-to-docx")
async def pdf_to_docx(
    file: UploadFile = File(...),
    x_api_key: str = Header(default=""),
):
    verify_api_key(x_api_key)

    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="File must be a PDF")

    with tempfile.TemporaryDirectory() as tmp_dir:
        input_path = Path(tmp_dir) / "input.pdf"
        output_path = Path(tmp_dir) / "output.docx"

        content = await file.read()
        input_path.write_bytes(content)

        try:
            from pdf2docx import Converter
            cv = Converter(str(input_path))
            cv.convert(str(output_path))
            cv.close()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")

        if not output_path.exists():
            raise HTTPException(status_code=500, detail="Conversion produced no output")

        output_name = file.filename.rsplit(".", 1)[0] + ".docx"
        safe_docx_name = output_name.encode("ascii", errors="ignore").decode("ascii") or "converted.docx"
        docx_bytes = output_path.read_bytes()

        return Response(
            content=docx_bytes,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={
                "Content-Disposition": f"attachment; filename=\"{safe_docx_name}\"",
            },
        )
