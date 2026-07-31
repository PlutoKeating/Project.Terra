# Backend Architecture

Three-layer architecture:
- **API Layer** (FastAPI routes) — RESTful endpoints with Swagger docs
- **Service Layer** — business logic: project CRUD, validation, export
- **Model Layer** (Pydantic) — data models with YAML serialization

See root `docs/ARCHITECTURE.md` for system-level architecture.

Deployment adapter: `api/index.py` exposes the FastAPI app as a Vercel Python Function. `services/project_service.py` selects Supabase REST/JSONB persistence when `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are configured, otherwise it uses local YAML files.
