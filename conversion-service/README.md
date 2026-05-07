# PDF to DOCX Conversion Service

Lightweight FastAPI microservice for high-quality PDF to DOCX conversion using [pdf2docx](https://github.com/ArtifexSoftware/pdf2docx).

Preserves layout, tables, images, and text formatting.

## Deploy to Railway

### Option 1: Railway CLI

```bash
npm install -g @railway/cli
railway login
cd conversion-service
railway init
railway variables set API_KEY=your-secret-key-here
railway up
```

### Option 2: GitHub (recommended)

1. Push repo to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Set root directory to `conversion-service`
4. Add variable: `API_KEY` = your secret key
5. Railway auto-detects Dockerfile and deploys

### After deploy

Copy the Railway public URL (e.g. `https://your-app.railway.app`) and set it as `CONVERSION_SERVICE_URL` in your Vercel environment variables.

## Local Development

```bash
# With Docker
docker build -t pdf-converter .
docker run -p 8000:8000 pdf-converter

# Without Docker (requires Python 3.11+)
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## API

### POST /api/convert/pdf-to-docx

Upload a PDF file, receive DOCX back.

```bash
curl -X POST -F "file=@document.pdf" \
  -H "X-API-Key: your-key" \
  http://localhost:8000/api/convert/pdf-to-docx \
  --output document.docx
```

### GET /health

Health check endpoint.
