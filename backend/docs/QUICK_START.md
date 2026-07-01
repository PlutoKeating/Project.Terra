# Backend Quick Start

## Prerequisites
- Python >= 3.11

## Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Run
```bash
uvicorn terra_engine.main:app --reload --port 8000
```

## Test
```bash
pytest tests/ -v
```

## API
Swagger: http://localhost:8000/docs
OpenAPI: http://localhost:8000/openapi.json
