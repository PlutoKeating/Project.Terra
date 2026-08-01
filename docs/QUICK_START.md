# Terra Quick Start

## Prerequisites
- Python >= 3.11 (backend)
- Node.js >= 20 (frontend)

## Vercel API
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
flask --app api.app run --port 8000
```

## Frontend
```bash
cd frontend
npm install
npm run dev
```

前端默认访问 `/api/v1`；本地 Vite 开发时可通过 `VITE_API_BASE_URL=http://localhost:8000/api/v1` 指向后端。生产使用 `vercel.json` 将 `/` 指向前端、`/api/*` 指向 Python Serverless Function。

## Supabase

复制 `.env.example`，配置 `SUPABASE_URL`、`SUPABASE_ANON_KEY`、`SUPABASE_SERVICE_ROLE_KEY`，并在 Supabase SQL Editor 执行 `supabase/schema.sql`。服务端只使用 service role key，绝不提交到仓库；浏览器只使用 anon key。生产环境将 `SUPABASE_AUTH_REQUIRED=true`，API 会通过 Supabase Auth 校验 Bearer token。

Supabase Auth 的 Site URL 必须设置为正式访问域名（当前为 `https://terra.arr2018.dpdns.org`），Redirect URLs 需要覆盖正式域名、Vercel 预览域名和本地开发地址。前端注册请求会同时使用当前页面 origin 作为 `emailRedirectTo`，避免确认邮件回退到 Supabase 默认的 localhost 地址。

### Production Auth email

生产环境必须在 Supabase Authentication 设置中启用 Custom SMTP，并配置支持 SSL 的外部 SMTP 服务。当前部署使用端口 `465`，发件地址必须与 SMTP 账号一致；SMTP 授权码仅保存在平台密钥配置中，不写入仓库或 `.env.example`。

建议保留以下限制：

- 每个地址的连续邮件请求至少间隔 60 秒。
- 项目邮件总速率按实际用户规模设置；当前生产基线为每小时 30 封。
- 注册确认与密码恢复链接必须回到 `https://terra.arr2018.dpdns.org/`。
