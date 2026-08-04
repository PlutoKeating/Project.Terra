# Frontend Architecture

## Runtime

- React 19 rendered from `src/main.tsx`
- Vite build and development server
- HashRouter for static-host-compatible navigation
- Supabase browser client in `src/lib/supabase.js`
- Shared authenticated API wrapper in `src/apiFetch.ts`

`App.tsx` owns route protection and global layout. `ProjectsPage.tsx` owns project management and YAML import. `CanvasPage.tsx` owns topology editing, persistence, validation, history, and export.

The API derives project ownership from the authenticated Supabase session. The frontend never sends or chooses an `owner_id`, and a YAML import always receives a new database project ID.

The frontend never receives the Supabase service role key. Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are exposed at build time.

Production output is `frontend/dist` and is served by Vercel. Container deployment files and alternate application entry points are intentionally not part of the frontend architecture.
