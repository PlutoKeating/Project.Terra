# Terra 前端功能定义与后端 API 接口文档

> **本文档写给前端 coding agent**：本文档只描述功能行为与后端接口。
> **不包含任何 UI/UX 设计建议**（如颜色、布局、动画、字体、间距等）——这些由你自主决定。

---

## 1. 产品概述

Terra 是一个**面向全栈系统架构设计的可视化编辑工具**。用户通过 Web 界面在画布上放置代表系统模块的节点、用语义化连线描述模块间的协作关系，并将设计保存为结构化 YAML 文件纳入 Git 版本控制。

核心价值：在"自由绘图"（Excalidraw）和"文本建模"（Mermaid）之间提供第三种设计媒介。

### 1.1 用户角色

- **架构师**：创建和管理架构设计项目，定义系统拓扑与模块协作
- **开发工程师**：查看设计、理解上下游依赖和接口契约

### 1.2 技术前提

- 前端通过 RESTful API 与后端通信（全部 JSON 格式）
- 后端地址由环境变量 `VITE_API_BASE_URL` 指定，例如 `http://localhost:8000/api/v1`
- 后端提供 Swagger 交互式文档：`http://localhost:8000/docs`
- 前端技术栈不限，完全由你自主选择

---

## 2. 功能需求（用户视角）

### 2.1 项目管理

**2.1.1 项目列表页**

用户进入应用后看到已创建的项目列表。如果没有任何项目，显示引导提示。

- 展示每个项目的名称和描述
- 点击项目进入该项目的设计画布
- 提供新建项目的入口
- 支持删除项目（含确认）

**2.1.2 新建项目**

用户可通过两种方式创建项目：
- **空格创建**：输入项目名称和可选描述，得到空画布
- **YAML 导入**：粘贴 .terra.yaml 格式的 YAML 文本，后端解析后生成完整项目

### 2.2 设计画布（核心）

画布是三栏布局的中间区域，是用户的主要工作区。支持以下操作：

**2.2.1 节点操作**
- **新增节点**：用户可从节点类型面板拖拽或点击添加节点到画布。节点类型共 6 种：service, database, cache, queue, external, infrastructure
- **选择节点**：点击节点选中（高亮边框），再次点击空白区域取消选中
- **移动节点**：拖拽节点改变其位置（position.x, position.y）
- **编辑节点属性**：选中节点后通过属性面板编辑 label、description、properties
- **删除节点**：选中节点后按 Delete 键或点击删除按钮。后端会自动清理与该节点关联的所有连线

**2.2.2 连线操作**
- **新增连线**：从源节点的连接点拖拽到目标节点，创建一条有向连线
- **选择连线**：点击连线选中，高亮显示
- **编辑连线属性**：选中连线后可编辑通信模式、协议、数据载体、描述
- **删除连线**：选中连线后按 Delete 键或点击删除按钮

**2.2.3 画布操作**
- **平移**：拖拽空白区域或使用滚轮平移视图
- **缩放**：使用触控板双指缩放或滚轮+修饰键缩放
- 画布应该是无限或极大的可滚动区域

**2.2.4 键盘快捷键**
- `N` — 新增节点（弹出节点类型选择）
- `L` — 开始连线模式（从当前选中节点出发）
- `Delete` 或 `Backspace` — 删除当前选中的节点或连线
- `Escape` — 取消当前操作（连线模式、选择等）
- `Ctrl/Cmd + S` — 保存（触发后端更新）
- `Ctrl/Cmd + Z` — 撤销（前端自行实现状态管理）

### 2.3 属性面板

选中节点或连线后，侧边栏显示属性编辑表单：

**节点属性编辑：**
- `type`（只读，创建后不可更改）
- `label`（必填，节点名称）
- `description`（可选，自由文本描述）
- `properties`（可选，键值对，用于记录技术栈、版本等）

**连线属性编辑：**
- `source_node_id`（只读，源节点 ID）
- `target_node_id`（只读，目标节点 ID）
- `mode`（必选，下拉框，5 种通信模式）
- `protocol`（必选，下拉框，8 种协议）
- `data_carrier.format`（可选，数据载体格式）
- `data_carrier.inline_schema`（可选，内联 JSON Schema）
- `description`（可选，自由文本）

### 2.4 验证功能

用户点击"验证"按钮后，前端调用验证 API 获取结果列表，以可视化方式展示：
- 每条结果显示规则名称、严重度（error/warning）、消息文本、建议
- error 级别结果用红色标记，warning 级别用黄色标记
- 验证发现的实体 ID 可以高亮定位到画布上的对应节点/连线

### 2.5 导出功能

用户可导出当前项目为两种格式：
- **YAML 格式**：通过 `GET .../export?format=yaml` 获取，显示为可复制文本，或触发文件下载
- **JSON 格式**：通过 `GET .../export?format=json` 获取完整 JSON，用于调试或程序化处理

### 2.6 页面/视图定义

前端应包含以下页面（路由）：

| 路由 | 视图 | 描述 |
|------|------|------|
| `/` | 项目列表 | 展示所有项目，提供新建入口 |
| `/projects/:id` | 设计画布 | 三栏布局（左侧导航或节点面板 + 中间画布 + 右侧属性面板） |

---

## 3. 后端 API 完整参考

### 3.1 基础信息

- **Base URL**: `${VITE_API_BASE_URL}`，例如 `http://localhost:8000/api/v1`
- **Content-Type**: `application/json`（所有请求和响应）
- **Swagger**: `http://localhost:8000/docs`
- **OpenAPI Spec**: `http://localhost:8000/openapi.json`

### 3.2 端点列表总览

| Method | Path | 描述 |
|--------|------|------|
| GET | `/health` | 健康检查 |
| POST | `/projects` | 创建项目 |
| GET | `/projects` | 列出所有项目 |
| GET | `/projects/{project_id}` | 获取项目详情（含节点和连线） |
| PUT | `/projects/{project_id}` | 更新项目元数据 |
| DELETE | `/projects/{project_id}` | 删除项目及所有子资源 |
| GET | `/projects/{project_id}/export?format=yaml|json` | 导出项目 |
| POST | `/projects/{project_id}/nodes` | 创建节点 |
| GET | `/projects/{project_id}/nodes` | 列出所有节点 |
| GET | `/projects/{project_id}/nodes/{node_id}` | 获取单个节点 |
| PUT | `/projects/{project_id}/nodes/{node_id}` | 更新节点 |
| DELETE | `/projects/{project_id}/nodes/{node_id}` | 删除节点（级联清理连线） |
| POST | `/projects/{project_id}/connections` | 创建连线 |
| GET | `/projects/{project_id}/connections` | 列出所有连线 |
| GET | `/projects/{project_id}/connections/{connection_id}` | 获取单条连线 |
| PUT | `/projects/{project_id}/connections/{connection_id}` | 更新连线 |
| DELETE | `/projects/{project_id}/connections/{connection_id}` | 删除连线 |
| POST | `/projects/{project_id}/validate` | 执行验证 |

### 3.3 端点详细定义

---

#### `GET /health`

健康检查，用于确认后端是否在线。

**响应** `200`:
```json
{ "status": "ok" }
```

---

#### `POST /projects`

创建新项目。

**请求体**:
```json
{
  "name": "string (必填)",
  "description": "string | null (可选)",
  "yaml_content": "string | null (可选)"
}
```

- 如果提供 `yaml_content`，后端从 YAML 文本解析出完整项目（包括节点和连线）
- 如果不提供 `yaml_content`，创建空项目（nodes=[]，connections=[]）

**响应** `200` — 返回完整 Project 对象 (见 §4.1)

---

#### `GET /projects`

列出所有项目。

**响应** `200` — Project 对象数组:
```json
[
  { "id": "...", "name": "...", "description": "...", "version": "0.1.0", "nodes": [...], "connections": [...], "metadata": {} }
]
```

---

#### `GET /projects/{project_id}`

获取单个项目完整信息。

**路径参数**: `project_id` — 项目 UUID

**响应** `200` — Project 对象

**响应** `404` — 项目不存在

---

#### `PUT /projects/{project_id}`

更新项目元数据。

**请求体**:
```json
{
  "name": "string | null",
  "description": "string | null"
}
```

只传需要修改的字段。不传的字段保持不变。

**响应** `200` — 更新后的完整 Project 对象

**响应** `404` — 项目不存在

---

#### `DELETE /projects/{project_id}`

删除项目及其在磁盘上的持久化文件。

**响应** `200`:
```json
{ "status": "deleted" }
```

**响应** `404` — 项目不存在

---

#### `GET /projects/{project_id}/export`

导出项目。

**查询参数**: `format` — `"yaml"` (默认) 或 `"json"`

**YAML 格式响应** `200`:
```json
{
  "yaml": "project:\n  id: ...\n  name: ...\n..."
}
```

**JSON 格式响应** `200` — 直接返回完整 Project JSON 对象 (见 §4.1)

**响应** `404` — 项目不存在

---

#### `POST /projects/{project_id}/nodes`

在项目中创建新节点。

**路径参数**: `project_id` — 项目 UUID

**请求体** (Node 对象，id 字段可不传由后端生成):
```json
{
  "type": "service",
  "label": "API Gateway",
  "description": "统一入口，JWT 鉴权",
  "position": { "x": 100.0, "y": 200.0 },
  "properties": { "tech_stack": "Kong" },
  "metadata": {}
}
```

**响应** `200` — 新创建的 Node 对象（含后端生成的 id）

**响应** `404` — 项目不存在

---

#### `GET /projects/{project_id}/nodes`

列出项目中所有节点。

**响应** `200` — Node 对象数组

**响应** `404` — 项目不存在

---

#### `GET /projects/{project_id}/nodes/{node_id}`

获取单个节点详情。

**响应** `200` — Node 对象

**响应** `404` — 项目或节点不存在

---

#### `PUT /projects/{project_id}/nodes/{node_id}`

更新节点全部字段（整体替换）。

**请求体** — 完整 Node 对象:
```json
{
  "type": "service",
  "label": "Updated Label",
  "description": "...",
  "position": { "x": 300.0, "y": 400.0 },
  "properties": {},
  "metadata": {}
}
```

> 注意：`id` 字段由路径参数指定，不需要在请求体中传；如果传了也会被路径中的 id 覆盖。

**响应** `200` — 更新后的 Node 对象

**响应** `404` — 项目或节点不存在

---

#### `DELETE /projects/{project_id}/nodes/{node_id}`

删除节点。后端自动清理所有引用该节点 ID 的连线。

**响应** `200`:
```json
{ "status": "deleted" }
```

**响应** `404` — 项目或节点不存在

---

#### `POST /projects/{project_id}/connections`

创建连线。

**请求体** (Connection 对象):
```json
{
  "source_node_id": "n1-uuid",
  "target_node_id": "n2-uuid",
  "mode": "sync_request_response",
  "protocol": "http_rest",
  "data_carrier": {
    "format": "json_schema",
    "schema_ref": null,
    "inline_schema": { "type": "object", "properties": { "order_id": { "type": "string" } } }
  },
  "description": "网关转发创建订单请求",
  "metadata": {}
}
```

**响应** `200` — 新创建的 Connection 对象（含后端生成的 id）

**响应** `404` — 项目不存在

---

#### `GET /projects/{project_id}/connections`

列出所有连线。

**响应** `200` — Connection 对象数组

---

#### `GET /projects/{project_id}/connections/{connection_id}`

获取单条连线。

**响应** `200` — Connection 对象

**响应** `404` — 项目或连线不存在

---

#### `PUT /projects/{project_id}/connections/{connection_id}`

更新连线全部字段（整体替换）。规则同节点更新。

**响应** `200` — 更新后的 Connection 对象

**响应** `404` — 项目或连线不存在

---

#### `DELETE /projects/{project_id}/connections/{connection_id}`

删除连线。

**响应** `200`:
```json
{ "status": "deleted" }
```

---

#### `POST /projects/{project_id}/validate`

执行全部 4 条验证规则，返回结果列表。

**响应** `200` — ValidationResult 数组:
```json
[
  {
    "rule": "cycle_detector",
    "severity": "error",
    "message": "循环依赖: API Gateway → Order Service → API Gateway",
    "entities": ["n1-uuid", "n2-uuid"],
    "suggestion": "考虑引入消息队列或事件驱动来解耦此同步依赖"
  }
]
```

详细的规则说明见 §4.3。

---

## 4. 数据模型

### 4.1 Project（项目）

```json
{
  "id": "uuid (string)",
  "name": "string",
  "description": "string | null",
  "version": "string (semver, 默认 '0.1.0')",
  "nodes": "Node[]",
  "connections": "Connection[]",
  "metadata": "object (可扩展，默认 {})"
}
```

### 4.2 Node（节点）

```json
{
  "id": "uuid (string)",
  "type": "NodeType (枚举，见下文)",
  "label": "string (必填，节点显示名称)",
  "description": "string | null",
  "position": { "x": "float", "y": "float" },
  "properties": "object (键值对，存储类型特定属性)",
  "metadata": "object"
}
```

**NodeType 枚举**（6 种）:

| 值 | 含义 | 示例 |
|----|------|------|
| `service` | 微服务 / API 网关 / 前端应用 / 定时任务 | "Order Service", "API Gateway" |
| `database` | 关系数据库 / NoSQL / 搜索引擎 | "PostgreSQL", "MongoDB" |
| `cache` | 缓存服务 | "Redis", "Memcached" |
| `queue` | 消息队列 / 事件总线 | "Kafka", "RabbitMQ" |
| `external` | 第三方 API / 支付 / 认证 / 云服务 | "Stripe", "Auth0" |
| `infrastructure` | LB / CDN / DNS / K8s / VPC | "CloudFront", "Nginx" |

### 4.3 Connection（连线）

```json
{
  "id": "uuid (string)",
  "source_node_id": "uuid (源节点 ID)",
  "target_node_id": "uuid (目标节点 ID)",
  "mode": "CommunicationMode (枚举)",
  "protocol": "Protocol (枚举)",
  "data_carrier": "DataCarrier | null",
  "description": "string | null",
  "metadata": "object"
}
```

**CommunicationMode 枚举**（5 种）:

| 值 | 含义 |
|----|------|
| `sync_request_response` | 同步请求-响应（如 REST POST） |
| `async_message` | 异步消息（如发消息后不等待） |
| `one_way_notification` | 单向通知（fire-and-forget） |
| `publish_subscribe` | 发布-订阅（如 Kafka topic） |
| `event_broadcast` | 事件广播 |

**Protocol 枚举**（8 种）:

| 值 | 含义 |
|----|------|
| `http_rest` | HTTP REST API |
| `grpc` | gRPC |
| `graphql` | GraphQL |
| `websocket` | WebSocket 长连接 |
| `amqp` | AMQP 消息协议（如 RabbitMQ） |
| `kafka` | Kafka 消息协议 |
| `database` | 数据库协议（SQL/TCP） |
| `custom` | 自定义协议 |

### 4.4 DataCarrier（数据载体）

连线上承载的数据结构描述：

```json
{
  "format": "string (如 'json_schema', 'protobuf', 'graphql', 'avro', 'custom')",
  "schema_ref": "string | null (外部 schema 文件引用)",
  "inline_schema": "object | null (内联 JSON Schema 片段)"
}
```

### 4.5 ValidationResult（验证结果）

```json
{
  "rule": "string (规则名称)",
  "severity": "string ('error' | 'warning')",
  "message": "string (人类可读的验证消息)",
  "entities": ["uuid", ...] (涉及的节点/连线 ID 列表),
  "suggestion": "string | null (修复建议)"
}
```

**4 条验证规则：**

| 规则名 | 严重度 | 检测内容 |
|--------|--------|---------|
| `cycle_detector` | error | 调用图中是否存在环路（A→B→…→A） |
| `orphan_detector` | warning | 是否存在入度和出度均为零的孤立节点 |
| `completeness_checker` | error | 必填字段是否缺失、连线引用的节点是否存在 |
| `protocol_consistency` | warning | 连线协议是否与目标节点类型兼容（如 HTTP 调数据库、AMQP 调 HTTP 服务等） |

---

## 5. 前端与后端交互约定

### 5.1 数据刷新策略

- **创建/更新/删除操作后**，前端应重新获取项目数据以保持画布与后端同步
- 节点列表和连线列表可以从项目详情 (`GET /projects/{id}`) 中一次性获取，也可以分别调用 `GET .../nodes` 和 `GET .../connections`

### 5.2 错误处理

- 所有非 2xx 响应应向前端用户展示错误信息
- 404 表示资源不存在，应提示用户并可能返回列表页
- 网络错误（后端未启动）应有友好提示

### 5.3 乐观更新

前端可自行实现乐观更新策略（先更新 UI 再确认 API 成功），但需在 API 失败时回滚 UI 状态。

### 5.4 画布位置

- 节点位置 (position.x, position.y) 保存在后端，每次移动节点后通过 `PUT .../nodes/{id}` 更新
- 建议在拖拽结束时（而非拖拽过程中）发送更新请求

---

## 6. 非功能需求

- **性能**：画布应能流畅处理 50+ 节点和 100+ 连线（可接受渲染策略优化，如虚拟化）
- **响应式**：支持常见的桌面分辨率（1280×720 及以上）
- **状态管理**：前端自行管理撤销/重做栈（不依赖后端）
- **可访问性**：确保所有交互可通过键盘完成

---

## 7. 附录：示例数据

### 7.1 完整项目 JSON 示例

```json
{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "name": "E-Commerce Platform",
  "description": "微服务电商平台架构设计",
  "version": "0.1.0",
  "nodes": [
    {
      "id": "11111111-1111-1111-1111-111111111111",
      "type": "service",
      "label": "API Gateway",
      "description": "统一入口，JWT 鉴权，限流",
      "position": { "x": 300, "y": 140 },
      "properties": { "tech_stack": "Kong" },
      "metadata": {}
    },
    {
      "id": "22222222-2222-2222-2222-222222222222",
      "type": "service",
      "label": "Order Service",
      "description": "订单核心微服务",
      "position": { "x": 150, "y": 300 },
      "properties": {},
      "metadata": {}
    },
    {
      "id": "33333333-3333-3333-3333-333333333333",
      "type": "database",
      "label": "Order DB",
      "description": null,
      "position": { "x": 150, "y": 470 },
      "properties": { "engine": "PostgreSQL", "version": "16" },
      "metadata": {}
    },
    {
      "id": "44444444-4444-4444-4444-444444444444",
      "type": "queue",
      "label": "Event Bus",
      "description": null,
      "position": { "x": 600, "y": 200 },
      "properties": { "type": "Kafka", "topics": ["order.created", "order.paid"] },
      "metadata": {}
    }
  ],
  "connections": [
    {
      "id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      "source_node_id": "11111111-1111-1111-1111-111111111111",
      "target_node_id": "22222222-2222-2222-2222-222222222222",
      "mode": "sync_request_response",
      "protocol": "http_rest",
      "data_carrier": null,
      "description": "网关转发创建订单请求",
      "metadata": {}
    },
    {
      "id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      "source_node_id": "22222222-2222-2222-2222-222222222222",
      "target_node_id": "33333333-3333-3333-3333-333333333333",
      "mode": "sync_request_response",
      "protocol": "database",
      "data_carrier": null,
      "description": "订单持久化读写",
      "metadata": {}
    },
    {
      "id": "cccccccc-cccc-cccc-cccc-cccccccccccc",
      "source_node_id": "22222222-2222-2222-2222-222222222222",
      "target_node_id": "44444444-4444-4444-4444-444444444444",
      "mode": "publish_subscribe",
      "protocol": "kafka",
      "data_carrier": {
        "format": "json_schema",
        "schema_ref": null,
        "inline_schema": {
          "type": "object",
          "properties": { "order_id": { "type": "string" }, "amount": { "type": "number" } }
        }
      },
      "description": "订单创建后发布 order.created 事件",
      "metadata": {}
    }
  ],
  "metadata": {}
}
```

### 7.2 YAML 导出示例

调用 `GET /projects/{id}/export?format=yaml` 返回的 `yaml` 字段内容示例：

```yaml
project:
  id: f47ac10b-58cc-4372-a567-0e02b2c3d479
  name: E-Commerce Platform
  description: 微服务电商平台架构设计
  version: 0.1.0
nodes:
- id: '11111111-1111-1111-1111-111111111111'
  type: service
  label: API Gateway
  description: 统一入口，JWT 鉴权，限流
  properties:
    tech_stack: Kong
  metadata: {}
- id: '22222222-2222-2222-2222-222222222222'
  type: service
  label: Order Service
  description: 订单核心微服务
  properties: {}
  metadata: {}
- id: '33333333-3333-3333-3333-333333333333'
  type: database
  label: Order DB
  properties:
    engine: PostgreSQL
    version: '16'
  metadata: {}
- id: '44444444-4444-4444-4444-444444444444'
  type: queue
  label: Event Bus
  properties:
    type: Kafka
    topics:
    - order.created
    - order.paid
  metadata: {}
connections:
- id: aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa
  source_node_id: '11111111-1111-1111-1111-111111111111'
  target_node_id: '22222222-2222-2222-2222-222222222222'
  mode: sync_request_response
  protocol: http_rest
  data_carrier:
  description: 网关转发创建订单请求
  metadata: {}
- id: bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb
  source_node_id: '22222222-2222-2222-2222-222222222222'
  target_node_id: '33333333-3333-3333-3333-333333333333'
  mode: sync_request_response
  protocol: database
  data_carrier:
  description: 订单持久化读写
  metadata: {}
- id: cccccccc-cccc-cccc-cccc-cccccccccccc
  source_node_id: '22222222-2222-2222-2222-222222222222'
  target_node_id: '44444444-4444-4444-4444-444444444444'
  mode: publish_subscribe
  protocol: kafka
  data_carrier:
    format: json_schema
    schema_ref:
    inline_schema:
      type: object
      properties:
        order_id:
          type: string
        amount:
          type: number
  description: 订单创建后发布 order.created 事件
  metadata: {}
metadata: {}
node_positions:
  '11111111-1111-1111-1111-111111111111':
    x: 300.0
    y: 140.0
  '22222222-2222-2222-2222-222222222222':
    x: 150.0
    y: 300.0
  '33333333-3333-3333-3333-333333333333':
    x: 150.0
    y: 470.0
  '44444444-4444-4444-4444-444444444444':
    x: 600.0
    y: 200.0
```

---

*文档版本: 1.0 | 生成日期: 2025-07-02*
