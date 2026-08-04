# Terra Quick Start

## Prerequisites

- Python 3.11+
- Node.js 20+
- Supabase project

## Supabase

1. 在 Supabase SQL Editor 执行 `supabase/schema.sql`。
   已存在的项目还需按顺序执行 `supabase/migrations/` 中尚未应用的迁移。
2. 复制 `.env.example` 为 `.env`。
3. 填写 `SUPABASE_URL`、`SUPABASE_ANON_KEY`、`SUPABASE_SERVICE_ROLE_KEY`、`VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`。
4. 本地调试可保持 `SUPABASE_AUTH_REQUIRED=false`；生产必须设为 `true`。

项目没有本地文件数据库。缺少 Supabase 服务端配置时，数据接口会返回 503。

## API

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
flask --app api.app run --port 8000
```

验证：

```bash
curl http://localhost:8000/api/v1/health
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Vite 默认运行在 `http://localhost:3000`，并将 `/api` 代理到 `http://localhost:8000`。前端默认 API Base URL 为 `/api/v1`。

## Verification

```bash
.venv/bin/python -m pytest -q
cd frontend
npm run lint
npm run build
```

## Production

- Vercel Production 分支：`main`
- 固定域名：`https://terra.arr2018.dpdns.org`
- `vercel.json` 同时构建前端并路由 Python Function
- Supabase Site URL 使用固定域名
- Redirect URLs 包含固定域名、允许的 Vercel 预览域名和本地地址
- Custom SMTP 使用平台密钥保存授权信息；仓库中不记录真实凭据
- `terra_projects.owner_id` 和严格 RLS policy 已启用，API 访问按当前 Supabase 用户隔离

推送 `main` 后，等待 Vercel Production 部署成功，再通过固定域名验证根页面、`/api/v1/health` 和未授权接口的 401 行为。
