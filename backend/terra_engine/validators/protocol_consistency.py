from terra_engine.models.project import Project, Node
from terra_engine.models.enums import NodeType, Protocol
from terra_engine.models.validation import ValidationResult


_DATABASE_PROTOCOLS = {Protocol.DATABASE}
_QUEUE_PROTOCOLS = {Protocol.AMQP, Protocol.KAFKA}


def check_protocol_consistency(project: Project) -> list[ValidationResult]:
    results = []
    node_map = {n.id: n for n in project.nodes}

    for conn in project.connections:
        target = node_map.get(conn.target_node_id)

        if target and target.type in (NodeType.DATABASE, NodeType.CACHE) and conn.protocol not in _DATABASE_PROTOCOLS:
            results.append(ValidationResult(
                rule="protocol_consistency",
                severity="warning",
                message=f"连线 {_node_label(node_map, conn.source_node_id)} → {target.label}: 数据库节点应使用 database 协议，当前为 {conn.protocol.value}",
                entities=[conn.id, conn.source_node_id, conn.target_node_id],
                suggestion="考虑将 protocol 改为 database",
            ))

        if target and target.type == NodeType.QUEUE and conn.protocol not in _QUEUE_PROTOCOLS:
            results.append(ValidationResult(
                rule="protocol_consistency",
                severity="warning",
                message=f"连线 {_node_label(node_map, conn.source_node_id)} → {target.label}: 消息队列节点应使用 amqp/kafka 协议，当前为 {conn.protocol.value}",
                entities=[conn.id, conn.source_node_id, conn.target_node_id],
                suggestion="考虑将 protocol 改为 amqp 或 kafka",
            ))

        if target and target.type in (NodeType.CACHE, NodeType.DATABASE) and conn.mode in ("publish_subscribe", "event_broadcast"):
            results.append(ValidationResult(
                rule="protocol_consistency",
                severity="warning",
                message=f"连线 {_node_label(node_map, conn.source_node_id)} → {target.label}: 数据存储节点不支持发布/订阅模式",
                entities=[conn.id, conn.source_node_id, conn.target_node_id],
            ))

    return results


def _node_label(node_map: dict[str, Node], node_id: str) -> str:
    node = node_map.get(node_id)
    return node.label if node else node_id
