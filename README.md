<div align="center">

# Terra

_A design medium for systems architecture — visual canvas, engineering precision._

[![Phase](https://img.shields.io/badge/phase-backend%20complete-2ea44f?style=flat-square)](https://github.com/your-org/terra)
[![Python](https://img.shields.io/badge/python-3.11+-blue?style=flat-square)](https://python.org)
[![FastAPI](https://img.shields.io/badge/api-FastAPI-009688?style=flat-square)](https://fastapi.tiangolo.com)
[![Tests](https://img.shields.io/badge/tests-64%2F64%20passing-2ea44f?style=flat-square)](https://github.com/your-org/terra)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)

[Overview](#overview) • [Features](#features) • [Getting Started](#getting-started) • [Usage](#usage) • [Architecture](#architecture) • [Roadmap](#roadmap)

</div>

## Overview

Every engineer has hit the same wall: **pseudo-code describes what happens inside one module, and architecture diagrams show what modules exist. Neither tells you how module A calls module B, under what conditions, with what protocol, carrying what data, and triggering what behavior in module C.**

Existing tools force you to choose:

| Tool | You get | You lose |
|------|---------|----------|
| Excalidraw, draw.io | Visual intuition, free-form expression | Semantic precision. It's just colored boxes. |
| Mermaid, PlantUML | Machine-readable, version-controllable specs | Visual editing. You're coding your diagrams. |

**Terra** fills this gap. It is not a diagramming tool and not a code generator — it is a **visual architecture description language**: every element on the canvas carries typed, structured metadata that a machine can read, validate, and trace to implementation.

```
    ┌──────────┐    sync / http_rest / {order_id, items}    ┌──────────────┐
    │ Service A │──────────────────────────────────────────▶│  Service B   │
    └──────────┘                                           └──────────────┘
          │
          │ async / kafka / publish_subscribe
          │ topic: order.created
          ▼
    ┌──────────┐
    │ Event Bus │
    └──────────┘
```

A connection in Terra is not just a line — **it is a typed API contract** with communication mode, wire protocol, data carrier schema, and validation rules.

## Features

### Now

- **6 node types** across the full stack: service, database, cache, queue, external API, infrastructure
- **5 communication modes**: sync request-response, async message, one-way notification, publish-subscribe, event broadcast
- **8 wire protocols**: HTTP REST, gRPC, GraphQL, WebSocket, AMQP, Kafka, database, custom
- **Typed data carriers** with inline JSON Schema, Protobuf refs, or GraphQL types
- **Validation engine**: cycle detection, orphan nodes, protocol consistency, completeness checks
- **Git-native persistence**: YAML-based storage format — diff, merge, and code-review your architecture
- **Headless REST API** with auto-generated Swagger docs (FastAPI)
- **YAML ⇄ API roundtrip**: create from YAML, edit via API, export back to YAML

### Planned

| Phase | Milestone |
|-------|-----------|
| P2 | Web canvas editor — drag, connect, and edit in the browser |
| P3 | ADR anchoring — attach design decisions to any node or connection |
| P4 | C4 layered views — drill from system context down to component level |
| P5 | Code generation — OpenAPI, asyncAPI, DB schemas from your design |
| P6 | Reverse sync — import Swagger/GraphQL/Protobuf back into the canvas |
| P7 | Collaboration & plugins — real-time editing, custom node types, CI/CD integration |

## Getting Started

### Prerequisites

- Python 3.11 or later

### 1. Clone and install

```bash
git clone https://github.com/your-org/terra.git
cd terra/backend

python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Start the engine

```bash
uvicorn terra_engine.main:app --reload --port 8000
```

Open **http://localhost:8000/docs** — you now have a live Swagger playground for the full API.

### 3. Run the tests

```bash
pytest tests/ -v
```

> [!TIP]
> The test suite covers 64 scenarios across models, validators, services, and the full REST API. Use it as a reference for how the engine behaves.

## Usage

### 30-second API walkthrough

```bash
# Create a project
curl -X POST http://localhost:8000/api/v1/projects \
  -H "Content-Type: application/json" \
  -d '{"name": "E-Commerce Platform"}'

# Add a service node
curl -X POST http://localhost:8000/api/v1/projects/{id}/nodes \
  -H "Content-Type: application/json" \
  -d '{
    "type": "service",
    "label": "API Gateway",
    "position": {"x": 300, "y": 140}
  }'

# Add a database node
curl -X POST http://localhost:8000/api/v1/projects/{id}/nodes \
  -H "Content-Type: application/json" \
  -d '{
    "type": "database",
    "label": "Order DB",
    "position": {"x": 150, "y": 470},
    "properties": {"engine": "PostgreSQL", "version": "16"}
  }'

# Connect them with a typed contract
curl -X POST http://localhost:8000/api/v1/projects/{id}/connections \
  -H "Content-Type: application/json" \
  -d '{
    "source_node_id": "<gateway-id>",
    "target_node_id": "<db-id>",
    "mode": "sync_request_response",
    "protocol": "database",
    "description": "Order persistence"
  }'

# Validate your design
curl -X POST http://localhost:8000/api/v1/projects/{id}/validate

# Export as YAML (git-diff friendly, shareable)
curl http://localhost:8000/api/v1/projects/{id}/export?format=yaml
```

### Validation in action

Create a circular dependency and catch it:

```bash
# Add a back-channel connection that creates a cycle
curl -X POST .../connections -d '{
  "source_node_id": "<order-service>",
  "target_node_id": "<api-gateway>",
  "mode": "sync_request_response",
  "protocol": "http_rest"
}'

# Validation catches it
curl -X POST .../validate
# → [{ "rule": "cycle_detector", "severity": "error",
#      "message": "循环依赖: API Gateway → Order Service → API Gateway" }]
```

## Architecture

```
┌───────────────────────────────────────────────────┐
│              Web UI (Phase 2)                      │
│  Canvas Editor  │  Property Panel  │  Navigation   │
└─────────────────────┬─────────────────────────────┘
                      │  REST + Swagger
┌─────────────────────▼─────────────────────────────┐
│            Terra Engine (FastAPI)                  │
│                                                    │
│  ┌──────────┐  ┌──────────┐  ┌────────────────┐   │
│  │  Models  │  │ Services │  │   Validators   │   │
│  │ (Pydantic)│  │  (CRUD)  │  │   (4 rules)    │   │
│  └──────────┘  └──────────┘  └────────────────┘   │
│                      │                             │
│  ┌───────────────────▼─────────────────────────┐   │
│  │         YAML Persistence Layer              │   │
│  │   .terra.yaml  ←  diff-friendly  →  Git    │   │
│  └─────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────┘
```

The backend is a layered FastAPI application:

- **API Layer** — RESTful routes with auto-generated OpenAPI docs
- **Service Layer** — business logic for project/node/connection CRUD, validation orchestration, YAML import/export
- **Model Layer** — Pydantic models with strict typing for all domain entities
- **Validation Layer** — pluggable rule engine (4 rules, extensible)

## Project Structure

```
terra/
├── backend/                    # FastAPI headless engine (Phase 1)
│   ├── terra_engine/
│   │   ├── models/             # Pydantic data models & enums
│   │   ├── services/           # Business logic & YAML persistence
│   │   ├── validators/         # Pluggable validation rules (4)
│   │   ├── api/                # REST route handlers
│   │   └── main.py             # App entry point
│   └── tests/                  # 64 unit + integration tests
├── frontend/                   # Web canvas editor (Phase 2)
├── docs/
│   ├── API.md                  # Quick API reference
│   ├── FRONTEND_REQUIREMENT.md # Complete frontend spec + API docs
│   └── compose/specs/          # Design specs
└── scripts/                    # Shared scripts
```

## Documentation

| Document | Audience | Content |
|----------|----------|---------|
| [`docs/API.md`](docs/API.md) | Backend developers | Quick API reference |
| [`docs/FRONTEND_REQUIREMENT.md`](docs/FRONTEND_REQUIREMENT.md) | Frontend developers | Complete functional spec with full API reference (19 endpoints) |
| [`docs/original-vision.md`](docs/原始问题背景与功能需求定义.md) | Everyone | Original problem statement and vision (Chinese) |
| [`docs/compose/specs/`](docs/compose/specs/) | Architects | Design specifications |
| http://localhost:8000/docs | Everyone | Interactive Swagger playground |

## Roadmap

| Phase | Status | Deliverable |
|-------|--------|-------------|
| P1 | ✅ Complete | Backend engine: data model, CRUD API, validation, YAML persistence, Swagger |
| P2 | ▶ Next | Web canvas editor with node/connection editing |
| P3 | Planned | Validation UI + Architecture Decision Records |
| P4 | Planned | C4 layered views + 200+ node canvas performance |
| P5 | Planned | Code generation (OpenAPI/AsyncAPI/DB schemas) + reverse sync |
| P6 | Planned | Multi-user collaboration + import/export ecosystem + VS Code extension |
| P7 | Planned | Plugin system + advanced logic flows (sagas, retry policies, timing constraints) |

## Why "Terra"?

**Terra** — Latin for _earth, ground, land_.

Architecture is the ground your software stands on. Every service, every database, every queue — none make sense in isolation. Terra gives you the vocabulary to describe that ground, the canvas to map it, and the tools to verify it stands on solid engineering.

It is also a nod to _terraform_ — the practice of shaping land for purpose. We shape architecture for the systems we build.
