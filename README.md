<div align="center">

# Terra

_面向系统架构的设计媒介：可视化画布，工程级语义。_

[![Python](https://img.shields.io/badge/python-3.11+-blue?style=flat-square)](https://python.org)
[![API](https://img.shields.io/badge/api-Vercel%20Serverless-000000?style=flat-square)](https://vercel.com/)
[![Tests](https://img.shields.io/badge/tests-45%2F45%20passing-2ea44f?style=flat-square)](https://github.com/PlutoKeating/Project.Terra)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)

</div>

Terra 是一种可视化架构描述语言。画布中的节点和连线都带有结构化元数据，可被保存、验证、导入和导出，而不只是像素或自由文本。

## 已实现

- 6 种节点类型：服务、数据库、缓存、消息队列、外部 API、基础设施
- 5 种通信模式和 8 种传输协议
- 节点与连线增删改、属性编辑、画布定位和 SVG 关系渲染
- 循环依赖、孤立节点、完整性和协议一致性验证
- YAML/JSON 导入与导出
- Supabase Auth、按用户隔离的 PostgreSQL JSONB 持久化和自定义 SMTP 邮件
- Vercel 单项目部署：React 静态前端位于 `/`，Flask Serverless API 位于 `/api/*`

YAML 是交换和版本控制格式，不是运行时数据库。生产与本地开发都使用 Supabase 保存项目。

## 快速开始

前置要求：Python 3.11+、Node.js 20+、一个已执行 [`supabase/schema.sql`](supabase/schema.sql) 的 Supabase 项目。

```bash
git clone git@github.com:PlutoKeating/Project.Terra.git
cd Project.Terra
cp .env.example .env

python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

cd frontend
npm install
cd ..
```

在 `.env` 中填写 Supabase 服务端和前端公开变量后，分别启动 API 与前端：

```bash
source .venv/bin/activate
flask --app api.app run --port 8000
```

```bash
cd frontend
npm run dev
```

API 健康检查：`http://localhost:8000/api/v1/health`。完整启动与部署说明见 [`docs/QUICK_START.md`](docs/QUICK_START.md)。

## 架构

```text
Browser
  ├─ React + Vite SPA
  ├─ Supabase Auth session
  └─ Bearer token
          │
          ▼
Vercel /api/* → Flask WSGI API → Terra domain services
                                      │
                                      ▼
                         Supabase PostgreSQL JSONB
```

- `frontend/`：React 19、Vite、Supabase Auth 客户端
- `api/`：Vercel Python Function 与 Flask REST 路由
- `core/terra_engine/`：领域模型、服务、验证器和导出逻辑
- `supabase/`：数据库 schema 与迁移
- `tests/`：模型、服务、验证和 API 测试
- `vercel.json`：生产构建与路由

详细说明见 [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)，接口见 [`docs/API.md`](docs/API.md)。

## 验证

```bash
.venv/bin/python -m pytest -q
cd frontend && npm run lint && npm run build
```

当前基线为 46 项 Python 测试通过，前端 TypeScript 检查和 Vite 生产构建通过。

## 生产

固定访问域名：<https://terra.arr2018.dpdns.org>

`main` 推送触发 Vercel Production 部署，固定域名始终指向最新成功的生产部署。Supabase Auth 的 Site URL 和 Redirect URLs 必须包含该域名，避免邮件回调落到本地地址。

## 路线图

- ADR 决策锚定与验证结果定位
- C4 分层视图与大画布性能优化
- OpenAPI、AsyncAPI、GraphQL、Protobuf 导入与代码生成
- 多人协作、插件与 CI 集成

## License

MIT
