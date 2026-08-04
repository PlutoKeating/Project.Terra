# Terra Frontend

The frontend is the production React client for Terra. It includes:

- Supabase sign-up, sign-in, password recovery, and session handling
- Project search plus functional notification and workspace-settings panels
- Protected project, library, community, and canvas routes
- Project creation, import, archive state, and deletion
- Node and connection editing with server persistence
- Race-free node selection/drag persistence and server-confirmed inspector saves
- Validation results and YAML/JSON export
- Mobile Palette / Canvas / Inspector switching without clipping the canvas

The active entry point is `src/main.tsx`; styling is loaded from `src/index.css`. Vite uses the single `vite.config.ts` configuration.
