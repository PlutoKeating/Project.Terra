## [S1] 产品定位

Terra 是一个**面向全栈系统架构设计的可视化描述语言 (Visual Architecture Description Language) 及其交互式编辑环境**。

它定位在"自由绘图工具"与"文本建模工具"之间的空白地带：

| 工具类型 | 代表 | 优势 | 局限 |
|---------|------|------|------|
| 可视化绘图 | Excalidraw, Lucidchart, draw.io | 直观、自由 | 无语义关联、无法承载协作逻辑 |
| 文本化建模 | Mermaid, Structurizr, PlantUML | 语义精确、可版本控制 | 丧失可视化编辑的直观性 |
| **Terra** | — | **图形直观 + 逻辑语义精确 + 工程可追踪** | — |

## [S2] 目标用户

- **系统架构师**：设计多服务系统拓扑，定义模块间协作契约
- **Tech Lead**：评审架构决策，追踪设计演进，校验实现一致性
- **开发工程师**：理解服务在整体架构中的位置、上下游依赖、接口契约
- **SRE/DevOps**：了解部署拓扑、故障域边界、数据流向

## [S3] 产品功能边界（7 大模块）

### 模块 1：可视化设计画布

| 功能 | Phase |
|------|-------|
| 自由二维画布：拖拽、缩放、平移 | P2 |
| 6 种内置节点类型 + 自定义扩展 | P2 |
| 节点间语义化连线，承载协作模式/协议/数据载体 | P2 |
| 草图模式 ↔ 精确模式平滑切换 | P2 |
| 键盘驱动效率：命令面板、快捷键、批量操作 | P2 |
| 智能布局、分组折叠、焦点高亮、搜索过滤 | P4 |
| 虚拟化渲染：200+ 节点 60fps | P4 |

### 模块 2：语义化连接模型

| 功能 | Phase |
|------|-------|
| 5 种通信模式 (sync/async/notify/pub-sub/broadcast) | ✅ P1 |
| 8 种协议 (REST/gRPC/GraphQL/WS/AMQP/Kafka/DB/Custom) | ✅ P1 |
| 数据载体定义 (JSON Schema/Protobuf/GraphQL/Avro) | ✅ P1 |
| 条件分支、异常路径、重试策略、熔断机制 | P7 |

### 模块 3：C4 分层抽象

| 功能 | Phase |
|------|-------|
| System Context → Container → Component 三级下钻 | P4 |
| 跨层引用一致性 | P4 |
| 每层独立编辑，保持映射关系 | P4 |

### 模块 4：设计决策锚定 (ADR)

| 功能 | Phase |
|------|-------|
| 节点/连线上附加 ADR（决策背景、权衡、备选方案） | P3 |
| ADR 与架构元素关联（非独立文档） | P3 |

### 模块 5：高级逻辑链路

| 功能 | Phase |
|------|-------|
| 并发执行、Saga 分布式事务、轮询、回调可视化 | P7 |
| 状态与数据流追踪（跨模块数据变换、生命周期） | P7 |
| 时序约束与并发边界表达 | P7 |

### 模块 6：与工程实现的桥梁

| 功能 | Phase |
|------|-------|
| 代码生成 (OpenAPI/AsyncAPI/DB Schema/消息 Topic) | P5 |
| 反向同步 (Swagger/GraphQL/Protobuf → 架构图) | P5 |
| 静态验证 (循环依赖/接口不匹配/未处理异常路径) | ✅ P1 |

### 模块 7：生态与扩展

| 功能 | Phase |
|------|-------|
| 导入导出 (C4-PlantUML/Mermaid/Draw.io/OpenAPI/AsyncAPI) | P6 |
| VS Code 插件 + LSP | P6 |
| 插件系统 (自定义节点/验证规则/导出器) | P7 |
| 多人协作 (实时编辑/评论批注/变更建议) | P6 |

## [S4] 数据模型

```
Project
├── id, name, description, version, metadata
├── nodes: Node[]
│   ├── id, type (NodeType), label, description
│   ├── position: {x, y}
│   ├── properties: dict (type-specific)
│   └── metadata: dict
└── connections: Connection[]
    ├── id, source_node_id, target_node_id
    ├── mode (CommunicationMode), protocol (Protocol)
    ├── data_carrier?: {format, schema_ref?, inline_schema?}
    ├── description?
    └── metadata: dict
```

### 枚举值

- **NodeType**: service, database, cache, queue, external, infrastructure
- **CommunicationMode**: sync_request_response, async_message, one_way_notification, publish_subscribe, event_broadcast
- **Protocol**: http_rest, grpc, graphql, websocket, amqp, kafka, database, custom

## [S5] API 设计

全部 `/api/v1/` 前缀，Swagger 自动文档。

| Method | Path | Description |
|--------|------|-------------|
| POST | `/projects` | 创建项目（空格或 YAML 导入） |
| GET | `/projects` | 列出项目 |
| GET | `/projects/{pid}` | 获取项目（含节点+连线） |
| PUT | `/projects/{pid}` | 更新项目元数据 |
| DELETE | `/projects/{pid}` | 删除项目及子资源 |
| GET | `/projects/{pid}/export?format=yaml\|json` | 导出 |
| POST | `/projects/{pid}/nodes` | 创建节点 |
| GET | `/projects/{pid}/nodes` | 列出节点 |
| GET | `/projects/{pid}/nodes/{nid}` | 获取节点 |
| PUT | `/projects/{pid}/nodes/{nid}` | 更新节点（含位置） |
| DELETE | `/projects/{pid}/nodes/{nid}` | 删除节点（级联清理连线） |
| POST | `/projects/{pid}/connections` | 创建连线 |
| GET | `/projects/{pid}/connections` | 列出连线 |
| GET | `/projects/{pid}/connections/{cid}` | 获取连线 |
| PUT | `/projects/{pid}/connections/{cid}` | 更新连线 |
| DELETE | `/projects/{pid}/connections/{cid}` | 删除连线 |
| POST | `/projects/{pid}/validate` | 执行验证规则 |

## [S6] 验证规则

| 规则 | 严重度 | 描述 |
|------|--------|------|
| cycle_detector | error | DFS 检测节点间循环依赖 |
| orphan_detector | warning | 检测入度+出度=0 的孤立节点 |
| completeness_checker | error | 必填属性缺失、引用完整性 |
| protocol_consistency | warning | 协议与目标节点类型兼容性 |

## [S7] 持久化格式

YAML 存储 + JSON API。设计原则：
- 节点与连线分离排列（独立 diff 不互相干扰）
- 扁平列表（避免嵌套导致的深层 diff 噪声）
- UUID 引用（增删不引起数组索引漂移）
- 支持 YAML 注释（记录设计意图和决策背景）

## [S8] 系统架构

```
┌─────────────────────────────────────────┐
│  Web SPA (React + Canvas/SVG)           │  ← Phase 2 已落地
│  ┌──────────┐ ┌──────────┐ ┌─────────┐ │
│  │ Canvas   │ │ Property │ │ Tree    │ │
│  │ Engine   │ │ Panel    │ │ Nav     │ │
│  └────┬─────┘ └────┬─────┘ └────┬────┘ │
│       └────────────┼─────────────┘       │
│               REST API                   │
├─────────────────────────────────────────┤
│  Terra Engine (FastAPI)                  │  ← Phase 1 ✅
│  Models / Services / Validators          │
│  YAML Persistence / Export              │
├─────────────────────────────────────────┤
│  .terra.yaml files (Git-native)         │
│  + Optional Cloud Sync (Phase 6)        │
└─────────────────────────────────────────┘
```

## [S9] 前端设计要点

Phase 2 前端已覆盖：

- **Canvas 渲染引擎**：选择 Canvas API 或 SVG 方案，处理节点拖拽、连线渲染、视口平移缩放
- **交互模式**：草图模式（快速低保真）与精确模式（完整属性校验）
- **属性面板**：选中节点/连线后展示可编辑的属性表单（类型、协议、数据载体等）
- **树形导航**：项目内节点/连线列表，支持搜索和筛选
- **键盘快捷键**：命令面板 (Cmd+K)，常用操作快捷键（N=新节点，L=连线，Delete=删除）
- **视觉风格**：借鉴 Excalidraw 手绘感降低"过早承诺"焦虑

## [S10] 开发路线图

| Phase | 名称 | 核心交付 | 状态 |
|-------|------|---------|------|
| P1 | 后端引擎 | 数据模型 + API + 验证 + YAML 持久化 | ✅ 完成 |
| P2 | Web UI MVP | Canvas 渲染 + 节点连线编辑 + 属性面板 | ✅ 已完成 |
| P3 | 验证 UI + ADR | 验证结果展示 + 设计决策锚定 + 版本历史 | 规划中 |
| P4 | C4 分层 | 三级下钻 + 画布性能优化 | 规划中 |
| P5 | 代码生成 | OpenAPI/AsyncAPI 生成 + 反向同步 | 规划中 |
| P6 | 协作 + 生态 | 多人编辑 + 导入导出 + VS Code 插件 | 规划中 |
| P7 | 插件系统 | 自定义扩展 + 高级逻辑链路 | 规划中 |
