from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from terra_engine.api.projects import router as projects_router
from terra_engine.api.nodes import router as nodes_router
from terra_engine.api.connections import router as connections_router
from terra_engine.api.validation import router as validation_router

app = FastAPI(
    title="Terra Engine",
    description="Visual Architecture Description Language — Backend Engine",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For local development ease, allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects_router, prefix="/api/v1")
app.include_router(nodes_router, prefix="/api/v1")
app.include_router(connections_router, prefix="/api/v1")
app.include_router(validation_router, prefix="/api/v1")


@app.get("/api/v1/health")
def health():
    return {"status": "ok"}
