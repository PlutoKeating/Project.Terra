# Frontend Quick Start

## Prerequisites
- Node.js >= 20

## Setup
```bash
cd frontend
npm install
npm run dev
```

The client defaults to `/api/v1` for the Vercel deployment. Set `VITE_API_BASE_URL=http://localhost:8000/api/v1` for a separate local backend. When Supabase public variables are present, the client uses Supabase Auth and forwards the current session token to the API.

Sign-up confirmation uses the current browser origin as its redirect target. Keep the Supabase Auth Site URL and Redirect URLs synchronized with the production custom domain and any supported preview or local origins.
