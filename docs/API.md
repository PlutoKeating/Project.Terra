# Terra Serverless API

## Base URLs

- Production: `https://terra.arr2018.dpdns.org/api/v1`
- Local: `http://localhost:8000/api/v1`

除 `GET /health` 外，生产接口要求 `Authorization: Bearer <supabase-access-token>`。请求和响应使用 JSON，本文件是接口契约。

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | 健康检查 |
| GET, POST | `/projects` | 列表、创建项目 |
| GET, PUT, DELETE | `/projects/{project_id}` | 读取、更新、删除项目 |
| GET | `/projects/{project_id}/export?format=yaml\|json` | 导出项目 |
| GET, POST | `/projects/{project_id}/nodes` | 列表、创建节点 |
| GET, PUT, DELETE | `/projects/{project_id}/nodes/{node_id}` | 读取、更新、删除节点 |
| GET, POST | `/projects/{project_id}/connections` | 列表、创建连线 |
| GET, PUT, DELETE | `/projects/{project_id}/connections/{connection_id}` | 读取、更新、删除连线 |
| POST | `/projects/{project_id}/validate` | 执行四条验证规则 |

## Examples

健康检查：

```bash
curl https://terra.arr2018.dpdns.org/api/v1/health
```

创建空项目：

```http
POST /api/v1/projects
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Commerce Platform",
  "description": "Service topology",
  "metadata": {"isActiveWorkspace": true}
}
```

也可在创建时传入 `yaml_content`。YAML 会被解析为项目并写入 Supabase；若 YAML 中没有项目 ID，服务端自动生成。

创建节点：

```json
{
  "type": "service",
  "label": "API Gateway",
  "description": "Edge entry",
  "position": {"x": 300, "y": 140},
  "properties": {"runtime": "Python"},
  "metadata": {}
}
```

创建连线：

```json
{
  "source_node_id": "source-id",
  "target_node_id": "target-id",
  "mode": "sync_request_response",
  "protocol": "http_rest",
  "description": "Request flow"
}
```

## Status codes

- `200`：成功
- `400`：不支持的导出格式
- `401`：缺少或无效的 Supabase session
- `404`：项目、节点或连线不存在
- `422`：模型、YAML 或连接引用校验失败
- `503`：服务端缺少 Supabase 配置或持久化服务不可用

完整前端行为和数据模型见 [`FRONTEND_REQUIREMENT.md`](FRONTEND_REQUIREMENT.md)。
