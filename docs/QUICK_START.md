# Terra Quick Start

## Prerequisites
- Python >= 3.11 (backend)
- Node.js >= 20 (frontend)

## Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn terra_engine.main:app --reload --port 8000
```

## Frontend
```bash
cd frontend
npm install
npm run dev
```
