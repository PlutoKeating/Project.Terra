from terra_engine.models.project import Project
from terra_engine.models.validation import ValidationResult


def check_completeness(project: Project) -> list[ValidationResult]:
    results = []
    for node in project.nodes:
        if not node.label.strip():
            results.append(ValidationResult(
                rule="completeness_checker",
                severity="error",
                message=f"节点缺少 label",
                entities=[node.id],
            ))

    node_ids = {n.id for n in project.nodes}
    for conn in project.connections:
        if not conn.mode:
            results.append(ValidationResult(
                rule="completeness_checker",
                severity="error",
                message=f"连线缺少 communication_mode",
                entities=[conn.id],
            ))
        if not conn.protocol:
            results.append(ValidationResult(
                rule="completeness_checker",
                severity="error",
                message=f"连线缺少 protocol",
                entities=[conn.id],
            ))
        if conn.source_node_id not in node_ids:
            results.append(ValidationResult(
                rule="completeness_checker",
                severity="error",
                message=f"连线引用了不存在的源节点",
                entities=[conn.id, conn.source_node_id],
            ))
        if conn.target_node_id not in node_ids:
            results.append(ValidationResult(
                rule="completeness_checker",
                severity="error",
                message=f"连线引用了不存在的目标节点",
                entities=[conn.id, conn.target_node_id],
            ))

    return results
