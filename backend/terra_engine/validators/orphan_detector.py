from terra_engine.models.project import Project
from terra_engine.models.validation import ValidationResult


def check_orphans(project: Project) -> list[ValidationResult]:
    connected_ids: set[str] = set()
    for c in project.connections:
        connected_ids.add(c.source_node_id)
        connected_ids.add(c.target_node_id)

    results = []
    for node in project.nodes:
        if node.id not in connected_ids:
            results.append(ValidationResult(
                rule="orphan_detector",
                severity="warning",
                message=f"节点 '{node.label}' 未连接，可能是遗漏",
                entities=[node.id],
                suggestion="请检查该节点是否需要与其他模块建立连接",
            ))
    return results
