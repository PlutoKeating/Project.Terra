# Terra Frontend

The frontend is the production React client for Terra. It includes:

- Supabase sign-up, sign-in, password recovery, and session handling
- Protected project, library, community, and canvas routes
- Project creation, import, archive state, and deletion
- Node and connection editing with server persistence
- Validation results and YAML/JSON export

The active entry point is `src/main.tsx`; styling is loaded from `src/index.css`. Vite uses the single `vite.config.ts` configuration.
