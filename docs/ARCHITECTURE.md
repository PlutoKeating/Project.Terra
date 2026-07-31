# Terra Architecture Overview

生产部署采用 Vercel 单项目双根路径：前端静态资源位于 `/`，Python FastAPI Serverless Function 位于 `/api/*`，通过 `vercel.json` 统一路由。Supabase 提供 PostgreSQL JSONB 持久化和 Auth；本地未配置 Supabase 时自动回退到 YAML 文件存储。

See `backend/docs/ARCHITECTURE.md` for backend detail.
See `docs/FRONTEND_REQUIREMENT.md` for frontend specification.
