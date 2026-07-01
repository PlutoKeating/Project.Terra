# Backend Architecture

Three-layer architecture:
- **API Layer** (FastAPI routes) — RESTful endpoints with Swagger docs
- **Service Layer** — business logic: project CRUD, validation, export
- **Model Layer** (Pydantic) — data models with YAML serialization

See root `docs/ARCHITECTURE.md` for system-level architecture.
