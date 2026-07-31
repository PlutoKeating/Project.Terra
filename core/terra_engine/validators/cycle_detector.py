from terra_engine.models.project import Project
from terra_engine.models.validation import ValidationResult


def check_cycles(project: Project) -> list[ValidationResult]:
    adj: dict[str, list[str]] = {n.id: [] for n in project.nodes}
    for c in project.connections:
        if c.source_node_id in adj:
            adj[c.source_node_id].append(c.target_node_id)

    cycles = _find_all_cycles(adj)
    results = []
    for cycle in cycles:
        cycle_str = " → ".join(_node_label(project, nid) for nid in cycle)
        results.append(ValidationResult(
            rule="cycle_detector",
            severity="error",
            message=f"循环依赖: {cycle_str}",
            entities=cycle,
            suggestion="考虑引入消息队列或事件驱动来解耦此同步依赖",
        ))
    return results


def _node_label(project: Project, node_id: str) -> str:
    for n in project.nodes:
        if n.id == node_id:
            return n.label
    return node_id


def _find_all_cycles(adj: dict[str, list[str]]) -> list[list[str]]:
    cycles: list[list[str]] = []
    visited: set[str] = set()
    stack: list[str] = []
    on_stack: set[str] = set()

    def dfs(node: str):
        visited.add(node)
        on_stack.add(node)
        stack.append(node)
        for neighbor in adj.get(node, []):
            if neighbor not in visited:
                dfs(neighbor)
            elif neighbor in on_stack:
                idx = stack.index(neighbor)
                cycle = stack[idx:] + [neighbor]
                cycles.append(cycle)
        stack.pop()
        on_stack.discard(node)

    for node in adj:
        if node not in visited:
            dfs(node)

    return cycles
