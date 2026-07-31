<div align="center">

# Terra

_面向系统架构的设计媒介 — 可视化画布，工程级精度。_

[![Phase](https://img.shields.io/badge/phase-P2%20MVP-2ea44f?style=flat-square)](https://github.com/your-org/terra)
[![Python](https://img.shields.io/badge/python-3.11+-blue?style=flat-square)](https://python.org)
[![API](https://img.shields.io/badge/api-Vercel%20Serverless-000000?style=flat-square)](https://vercel.com/)
[![Tests](https://img.shields.io/badge/tests-43%2F43%20passing-2ea44f?style=flat-square)](https://github.com/your-org/terra)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)

[概述](#概述) • [功能特性](#功能特性) • [快速开始](#快速开始) • [使用示例](#使用示例) • [架构设计](#架构设计) • [路线图](#路线图)

</div>

## 概述

每个工程师都撞过同一堵墙：**伪代码能描述单个模块内部的执行流程，架构图能呈现系统由哪些模块组成。但两者都无法精确表达"模块 A 在何种条件下、通过何种协议、携载何种数据、触发模块 C 的何种行为"这类工程化细节。**

现有工具迫使你二选一：

| 工具 | 你得到了 | 你失去了 |
|------|---------|----------|
| Excalidraw, draw.io | 直观的可视化表达，自由布局 | 语义精度。它只是涂了颜色的方框。 |
| Mermaid, PlantUML | 机器可读、可版本控制的规格 | 可视化编辑的直观性。你在用代码画图。 |

**Terra** 填补了这个空白。它不是绘图工具，也不是代码生成器——它是一种**可视化架构描述语言**：画布上的每一个元素都携带着带类型的、结构化的元数据，机器可以读取、验证，并追溯到具体实现。

```
    ┌──────────┐    sync / http_rest / {order_id, items}    ┌──────────────┐
    │ Service A │──────────────────────────────────────────▶│  Service B   │
    └──────────┘                                           └──────────────┘
          │
          │ async / kafka / publish_subscribe
          │ topic: order.created
          ▼
    ┌──────────┐
    │ Event Bus │
    └──────────┘
```

Terra 中的连线不只是一条线——**它是一份带类型的 API 契约**，包含通信模式、传输协议、数据载体 schema 和验证规则。

## 功能特性

### 已实现

- **6 种节点类型**覆盖全栈技术组件：服务、数据库、缓存、消息队列、外部 API、基础设施
- **5 种通信模式**：同步请求-响应、异步消息、单向通知、发布-订阅、事件广播
- **8 种传输协议**：HTTP REST、gRPC、GraphQL、WebSocket、AMQP、Kafka、数据库协议、自定义
- **带类型的数据载体**：内联 JSON Schema、Protobuf 引用、GraphQL 类型
- **验证引擎**：循环依赖检测、孤立节点、协议兼容性、完整性校验
- **双模式持久化**：本地使用 YAML，Vercel 使用 Supabase PostgreSQL JSONB
- **Vercel Serverless API**：`/api/*` 独立承载 Flask/W​​SGI Python Function
- **Supabase Auth 接入**：前端 session 自动向 API 传递 Bearer token
- **YAML ⇄ API 双向转换**：从 YAML 创建，通过 API 编辑，导出回 YAML
- **完整 Web 画布**：项目创建/选择/删除、节点与连线增删改、SVG 连线、属性面板、验证结果和 YAML/JSON 导出

### 工程部署形态

| 阶段 | 里程碑 |
|------|--------|
| P2 | Web 画布编辑器——在浏览器中拖拽、连接和编辑 |
| P3 | ADR 决策锚定——将设计决策附加到任意节点或连线 |
| P4 | C4 分层视图——从系统上下文下钻到组件级别 |
| P5 | 代码生成——从设计生成 OpenAPI、AsyncAPI、数据库 schema |
| P6 | 反向同步——将 Swagger/GraphQL/Protobuf 导回画布 |
| P7 | 协作与插件——实时编辑、自定义节点类型、CI/CD 集成 |

## 快速开始

### 前置要求

- Python 3.11 或更高版本

### 1. 克隆并安装

```bash
git clone https://github.com/your-org/terra.git
cd terra
cp .env.example .env

python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 2. 启动引擎

```bash
flask --app api.app run --port 8000
```

打开 **http://localhost:8000/docs** — 你现在拥有了一个完整的 Swagger 交互式 API 调试环境。

### 3. 运行测试

```bash
pytest tests/ -v
```

> [!TIP]
> 测试套件覆盖了 43 个场景，涵盖模型、验证器、服务和完整的 Serverless REST API。可以将其作为理解引擎行为的参考。

## 使用示例

### 30 秒 API 快速上手

```bash
# 创建项目
curl -X POST http://localhost:8000/api/v1/projects \
  -H "Content-Type: application/json" \
  -d '{"name": "电商平台"}'

# 添加服务节点
curl -X POST http://localhost:8000/api/v1/projects/{id}/nodes \
  -H "Content-Type: application/json" \
  -d '{
    "type": "service",
    "label": "API Gateway",
    "position": {"x": 300, "y": 140}
  }'

# 添加数据库节点
curl -X POST http://localhost:8000/api/v1/projects/{id}/nodes \
  -H "Content-Type: application/json" \
  -d '{
    "type": "database",
    "label": "Order DB",
    "position": {"x": 150, "y": 470},
    "properties": {"engine": "PostgreSQL", "version": "16"}
  }'

# 用带类型的契约连接它们
curl -X POST http://localhost:8000/api/v1/projects/{id}/connections \
  -H "Content-Type: application/json" \
  -d '{
    "source_node_id": "<gateway-id>",
    "target_node_id": "<db-id>",
    "mode": "sync_request_response",
    "protocol": "database",
    "description": "订单持久化读写"
  }'

# 验证你的设计
curl -X POST http://localhost:8000/api/v1/projects/{id}/validate

# 导出 YAML（Git 可 diff，便于分享）
curl http://localhost:8000/api/v1/projects/{id}/export?format=yaml
```

### 实战验证

创建循环依赖并即时捕获：

```bash
# 添加一条反向连接，制造环路
curl -X POST .../connections -d '{
  "source_node_id": "<order-service>",
  "target_node_id": "<api-gateway>",
  "mode": "sync_request_response",
  "protocol": "http_rest"
}'

# 验证引擎立即捕获
curl -X POST .../validate
# → [{ "rule": "cycle_detector", "severity": "error",
#      "message": "循环依赖: API Gateway → Order Service → API Gateway" }]
```

## 架构设计

```
┌───────────────────────────────────────────────────┐
│              Web UI（P2）                          │
│  画布编辑器  │  属性面板  │  导航  │  连线与导出    │
└─────────────────────┬─────────────────────────────┘
                      │  REST + Swagger
┌─────────────────────▼─────────────────────────────┐
│            Terra Core + Serverless API             │
│                                                    │
│  ┌──────────┐  ┌──────────┐  ┌────────────────┐   │
│  │  Models  │  │ Services │  │   Validators   │   │
│  │ (Pydantic)│  │  (CRUD)  │  │   (4 条规则)   │   │
│  └──────────┘  └──────────┘  └────────────────┘   │
│                      │                             │
│  ┌───────────────────▼─────────────────────────┐   │
│  │         YAML 持久化层                        │   │
│  │   .terra.yaml  ←  可 diff  →  Git          │   │
│  └─────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────┘
```

后端采用领域核心与 Serverless 适配器分层：

- **API 层** — Flask/W​​SGI RESTful Serverless 路由
- **Service 层** — 项目/节点/连线 CRUD 业务逻辑、验证编排、YAML 导入导出
- **Model 层** — Pydantic 模型，对全部领域实体进行严格类型约束
- **Validation 层** — 可插拔规则引擎（4 条规则，可扩展）

## 项目结构

```
terra/
├── api/index.py                # Vercel Python Serverless 入口（/api/*）
├── core/                       # 领域模型、服务和验证器
│   ├── terra_engine/
│   │   ├── models/             # Pydantic 数据模型与枚举
│   │   ├── services/           # 业务逻辑与 YAML 持久化
│   │   ├── validators/         # 可插拔验证规则（4 条）
│   │   ├── api/                # REST 路由处理
│   │   └── main.py             # 应用入口
├── api/                        # Vercel Serverless API
├── tests/                      # 43 个单元与集成测试
├── frontend/                   # React + SVG Web 画布编辑器（Vercel 静态输出）
├── supabase/schema.sql         # Supabase 表与 RLS 策略
├── vercel.json                 # 前端根路径 + 后端 /api 路由
├── docs/
│   ├── API.md                  # API 快速参考
│   ├── FRONTEND_REQUIREMENT.md # 完整前端规格 + API 文档
│   └── compose/specs/          # 设计规格文档
└── scripts/                    # 共享脚本
```

## 文档

| 文档 | 面向读者 | 内容 |
|------|---------|------|
| [`docs/API.md`](docs/API.md) | 后端开发者 | API 快速参考 |
| [`docs/FRONTEND_REQUIREMENT.md`](docs/FRONTEND_REQUIREMENT.md) | 前端开发者 | 完整功能规格及全部 API 参考（19 个端点） |
| [`docs/原始问题背景与功能需求定义.md`](docs/原始问题背景与功能需求定义.md) | 所有人 | 原始问题陈述与产品愿景 |
| [`docs/compose/specs/`](docs/compose/specs/) | 架构师 | 设计规格文档 |
| http://localhost:8000/docs | 所有人 | 交互式 Swagger 调试环境 |

## 路线图

| 阶段 | 状态 | 交付内容 |
|------|------|---------|
| P1 | ✅ 已完成 | 后端引擎：数据模型、CRUD API、验证引擎、YAML 持久化、Swagger |
| P2 | ✅ 已完成 | Web 画布编辑器：项目、节点、连线、属性、验证与导出 |
| P3 | 规划中 | 验证结果可视化 + 架构决策记录（ADR） |
| P4 | 规划中 | C4 分层视图 + 200+ 节点画布性能优化 |
| P5 | 规划中 | 代码生成（OpenAPI/AsyncAPI/数据库 schema）+ 反向同步 |
| P6 | 规划中 | 多人协作 + 导入导出生态 + VS Code 插件 |
| P7 | 规划中 | 插件系统 + 高级逻辑流（Saga、重试策略、时序约束） |

## 为什么叫 "Terra"？

**Terra** — 拉丁语，意为*大地、地基、土地*。

架构是软件所站立的地基。每一个服务、每一个数据库、每一个消息队列——脱离整体来看都毫无意义。Terra 为你提供描述这片地基的语言、绘制它的画布，以及验证它是否建立在坚实工程之上的工具。

它也向 *terraform* 致敬——塑造土地以服务于目的的行为。我们塑造架构，以服务于我们构建的系统。
