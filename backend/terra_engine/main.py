from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from terra_engine.api.projects import router as projects_router
from terra_engine.api.nodes import router as nodes_router
from terra_engine.api.connections import router as connections_router
from terra_engine.api.validation import router as validation_router
from terra_engine.api.auth import router as auth_router
from terra_engine.api.dependencies import get_current_user

app = FastAPI(
    title="Terra Engine",
    description="Visual Architecture Description Language — Backend Engine",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# Configure CORS Middleware with explicit credentials allowance
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Unprotected endpoints
app.include_router(auth_router, prefix="/api/v1")

@app.get("/api/v1/health")
def health():
    return {"status": "ok"}

# Protected endpoints (require 30-day session cookies)
app.include_router(projects_router, prefix="/api/v1", dependencies=[Depends(get_current_user)])
app.include_router(nodes_router, prefix="/api/v1", dependencies=[Depends(get_current_user)])
app.include_router(connections_router, prefix="/api/v1", dependencies=[Depends(get_current_user)])
app.include_router(validation_router, prefix="/api/v1", dependencies=[Depends(get_current_user)])
