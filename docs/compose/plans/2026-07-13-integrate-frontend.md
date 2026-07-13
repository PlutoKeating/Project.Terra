# Frontend Integration and Mock Removal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use compose:subagent (recommended) or compose:execute to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate the expert-designed frontend codebase from `terra.zip` into the project repository under `frontend/`, replace the mock Node.js/Express server and JSON database with the real FastAPI backend, and configure proxying and CORS to establish seamless connectivity.

**Architecture:** We will copy the React components and configurations from `/tmp/terra_frontend` to `frontend/`, excluding the mock database (`projects-db.json`) and mock Express server (`server.ts`). Local development API requests will be proxied from Vite (port 3000) to the real FastAPI backend (port 8000) using Vite's development proxy. On the backend, we will add FastAPI `CORSMiddleware` to allow direct cross-origin browser communication.

**Tech Stack:** React 19, Vite 6, Tailwind CSS v4, React Router v7, Lucide Icons, FastAPI, Python 3.14.

---

### Task 1: Port Frontend Codebase and Exclude Mock Backend

**Covers:** §2.1, §2.2, §2.3, §2.4, §2.5, §2.6 (Complete Frontend requirements)

**Files:**
- Create/Overwrite: `frontend/index.html`
- Create/Overwrite: `frontend/package.json`
- Create/Overwrite: `frontend/package-lock.json`
- Create/Overwrite: `frontend/tsconfig.json`
- Create/Overwrite: `frontend/vite.config.ts`
- Create/Overwrite: `frontend/src/*` (App.tsx, main.tsx, types.ts, designSystem.ts, and all folders like components/ and pages/)
- Remove: `frontend/server.ts`
- Remove: `frontend/projects-db.json`

- [ ] **Step 1: Copy and merge files from the temporary directory to the repository's `frontend/` directory, excluding server.ts and projects-db.json**

Run:
```bash
cp -r /tmp/terra_frontend/index.html frontend/
cp -r /tmp/terra_frontend/package.json frontend/
cp -r /tmp/terra_frontend/package-lock.json frontend/
cp -r /tmp/terra_frontend/tsconfig.json frontend/
cp -r /tmp/terra_frontend/vite.config.ts frontend/
cp -r /tmp/terra_frontend/src frontend/
cp -r /tmp/terra_frontend/assets frontend/
```

- [ ] **Step 2: Clean up any mistakenly copied mock server or mock database files from the `frontend/` workspace**

Run:
```bash
rm -f frontend/server.ts
rm -f frontend/projects-db.json
```

- [ ] **Step 3: Commit porting changes**

```bash
git add frontend/
git commit -m "chore: import frontend assets and react source tree, excluding mock database and server"
```

---

### Task 2: Configure package.json and vite.config.ts for Standard Vite and Dev Proxy

**Covers:** §1.2, §3.1, §5.1 (Frontend requirements)

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/vite.config.ts`

- [ ] **Step 1: Update scripts and dependencies in `frontend/package.json`**

We will replace the mock development and server building scripts with standard React/Vite commands and remove dependencies used solely for the mock server (`express`, `@types/express`, `tsx`, `esbuild`).

Modify `frontend/package.json` to look as follows:
```json
{
  "name": "terra-frontend",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "@tailwindcss/vite": "^4.1.14",
    "@vitejs/plugin-react": "^5.0.4",
    "dotenv": "^17.2.3",
    "lucide-react": "^0.546.0",
    "react": "^19.0.1",
    "react-dom": "^19.0.1",
    "react-router-dom": "^7.18.1",
    "vite": "^6.2.3"
  },
  "devDependencies": {
    "@types/node": "^22.14.0",
    "autoprefixer": "^10.4.21",
    "tailwindcss": "^4.1.14",
    "typescript": "~5.8.2"
  }
}
```

- [ ] **Step 2: Update `frontend/vite.config.ts` to include a development proxy**

Add a proxy rule targeting `http://localhost:8000` for all `/api` endpoints so that React can use relative paths `/api/v1/...` while developing locally.

Modify `frontend/vite.config.ts` to look as follows:
```typescript
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
        },
      },
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
```

- [ ] **Step 3: Commit configuration updates**

```bash
git add frontend/package.json frontend/vite.config.ts
git commit -m "feat: configure frontend package.json scripts and add API proxy to vite.config.ts"
```

---

### Task 3: Enable CORS Middleware in the Python FastAPI Backend

**Covers:** §Technical (CORS compatibility between port 3000 and port 8000)

**Files:**
- Modify: `backend/terra_engine/main.py`

- [ ] **Step 1: Import and add FastAPI's `CORSMiddleware` to allow local cross-origin requests**

We will allow origins `http://localhost:3000`, `http://127.0.0.1:3000`, and all other potential local development client addresses to communicate with the FastAPI backend directly, bypassing browser security blocks.

Modify `backend/terra_engine/main.py`:
```python
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
```

- [ ] **Step 2: Commit backend CORS support**

```bash
git add backend/terra_engine/main.py
git commit -m "feat: add CORSMiddleware to FastAPI to resolve frontend cross-origin requests"
```

---

### Task 4: Install Dependencies and Verify TypeScript Typecheck and Build

**Covers:** §Technical (Verification & Standards)

**Files:**
- None (Verification task)

- [ ] **Step 1: Install frontend packages**

Run in `frontend/`:
```bash
npm install
```

- [ ] **Step 2: Verify typescript static analysis**

Run in `frontend/`:
```bash
npm run lint
```
Expected: PASS with no compilation or typing errors.

- [ ] **Step 3: Verify production build of SPA**

Run in `frontend/`:
```bash
npm run build
```
Expected: PASS with output files compiled into `frontend/dist/`.

---

### Task 4.5 (Optional / Recommended): Create Unified root-level Docker-compose

**Covers:** §Infrastructure

**Files:**
- Create: `docker-compose.yml`

- [ ] **Step 1: Write root docker-compose.yml to orchestrate both services**

Create `docker-compose.yml` in root directory:
```yaml
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - TERRA_DATA_DIR=/app/data
    volumes:
      - ./backend/data:/app/data

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend
```

- [ ] **Step 2: Commit unified docker-compose**

```bash
git add docker-compose.yml
git commit -m "feat: add root-level docker-compose.yml to orchestrate both backend and frontend together"
```
