# Terra Architecture

## Production topology

Terra 使用一个 Vercel 项目交付前后端：

```text
terra.arr2018.dpdns.org
├─ /, /assets/*     React/Vite static output
└─ /api/*           Vercel Python Function (Flask WSGI)
                         │
                         ├─ Supabase Auth token verification
                         └─ Supabase REST → terra_projects.document JSONB
```

`vercel.json` 先将 `/api/*` 路由到 `api/index.py`，再按静态文件优先、SPA 回退的顺序提供前端。`api/index.py` 只导出 `api.app.app`，业务逻辑位于 `core/terra_engine/`。

## Runtime boundaries

### Frontend

- React 19 + Vite 单页应用
- HashRouter 路由，避免静态托管刷新时产生路径 404
- Supabase Auth 管理注册、登录、恢复密码和 session
- `apiFetch` 自动向 API 附加当前 Bearer token
- `VITE_API_BASE_URL` 默认 `/api/v1`

### Serverless API

- Flask/W​​SGI 适配 Vercel Python Function
- `/api/v1/health` 不要求登录；生产环境其余接口要求 Supabase token
- Pydantic 负责领域输入验证
- 服务层负责编排项目、节点、连线、验证和导出
- Serverless 函数不依赖本地磁盘，也不保存进程内状态

### Persistence

- 唯一运行时持久化是 Supabase `terra_projects` 表
- 每个项目以 JSONB 文档保存，表结构和 RLS 在 `supabase/schema.sql`
- `SUPABASE_URL` 与 `SUPABASE_SERVICE_ROLE_KEY` 是服务端必填配置
- YAML 仅用于项目导入与导出，不作为数据库或本地回退
- 测试使用内存替身，避免访问生产 Supabase

### Authentication email

- Supabase Auth 使用自定义 SSL SMTP
- 发件凭据只保存在平台密钥配置中，不进入 Git
- Site URL 使用 `https://terra.arr2018.dpdns.org`
- 注册和密码恢复以当前浏览器 origin 作为回调目标

## Source layout

```text
api/                         Flask app and Vercel entry
core/terra_engine/
  models/                    Pydantic domain models
  services/                  Supabase persistence, CRUD, export, validation
  validators/                Four validation rules
frontend/                    React/Vite application
supabase/                    Schema and migrations
tests/                       Python unit and API tests
vercel.json                  Build and routing contract
```

## Deployment invariants

1. `main` 是 Vercel Production 分支。
2. 固定域名只指向 Production，不使用每次变化的预览 URL 作为用户入口。
3. 前端构建必须生成 `frontend/dist`，但该目录不提交 Git。
4. 服务端密钥不得出现在 `VITE_*` 变量、源码或文档中。
5. API 运行必须具备 Supabase 配置；缺失时返回明确的 503，而不是回退到本地文件。
