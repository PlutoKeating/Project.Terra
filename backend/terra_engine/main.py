import os

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from terra_engine.api.projects import router as projects_router
from terra_engine.api.nodes import router as nodes_router
from terra_engine.api.connections import router as connections_router
from terra_engine.api.validation import router as validation_router
from terra_engine.auth import verify_bearer_token

app = FastAPI(
    title="Terra Engine",
    description="Visual Architecture Description Language — Backend Engine",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def supabase_auth_guard(request: Request, call_next):
    protected = request.url.path.startswith("/api/v1/") and request.url.path != "/api/v1/health"
    if protected and os.getenv("SUPABASE_AUTH_REQUIRED", "false").lower() == "true":
        if not await verify_bearer_token(request.headers.get("authorization")):
            return JSONResponse(status_code=401, content={"detail": "Authentication required"})
    return await call_next(request)

app.include_router(projects_router, prefix="/api/v1")
app.include_router(nodes_router, prefix="/api/v1")
app.include_router(connections_router, prefix="/api/v1")
app.include_router(validation_router, prefix="/api/v1")


@app.get("/api/v1/health")
def health():
    return {"status": "ok"}
