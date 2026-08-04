# Frontend Quick Start

## Prerequisites

- Node.js 20+
- Local Flask API on port 8000
- Supabase public URL and anon key

## Run

```bash
cd frontend
npm install
npm run dev
```

The client opens at `http://localhost:3000`, uses `/api/v1`, and proxies `/api` to `http://localhost:8000`.

Set these variables through the root `.env` or deployment environment:

```text
VITE_API_BASE_URL=/api/v1
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Registration and password recovery use the current browser origin for redirects. Keep the Supabase Site URL and Redirect URLs synchronized with supported local, preview, and production origins.

Password recovery callbacks are detected before HashRouter navigation and redirected to the new-password form. Production acceptance must exercise this through the fixed production domain.

## Check

```bash
npm run lint
npm run build
```
