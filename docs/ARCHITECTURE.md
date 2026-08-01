# Terra Architecture Overview

生产部署采用 Vercel 单项目双根路径：前端静态资源位于 `/`，Flask/W​​SGI Python Serverless Function 位于 `/api/*`，通过 `vercel.json` 统一路由。Supabase 提供 PostgreSQL JSONB 持久化和 Auth；Auth 邮件通过外部 SSL SMTP 服务投递，避免依赖 Supabase 内置测试邮件服务。本地未配置 Supabase 时自动回退到 YAML 文件存储。

See `core/` and `api/app.py` for backend detail.
See `docs/FRONTEND_REQUIREMENT.md` for frontend specification.
