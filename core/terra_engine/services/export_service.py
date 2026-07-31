import yaml
from terra_engine.models.project import Project


def export_project_yaml(project: Project) -> str:
    data = {
        "project": {
            "id": project.id,
            "name": project.name,
            "description": project.description,
            "version": project.version,
        },
        "nodes": [n.model_dump(mode="json", exclude={"position": True}) for n in project.nodes],
        "connections": [c.model_dump(mode="json") for c in project.connections],
        "metadata": project.metadata,
    }
    if project.nodes:
        data["node_positions"] = {
            n.id: {"x": n.position.x, "y": n.position.y} for n in project.nodes
        }
    return yaml.dump(data, allow_unicode=True, sort_keys=False)


def export_project_json(project: Project) -> dict:
    return project.model_dump(mode="json")
