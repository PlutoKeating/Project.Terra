import os
import yaml
from terra_engine.models.project import Project, Node, Connection


DATA_DIR = os.environ.get("TERRA_DATA_DIR", "./data")


def _ensure_data_dir():
    os.makedirs(DATA_DIR, exist_ok=True)


def _project_path(project_id: str) -> str:
    return os.path.join(DATA_DIR, f"{project_id}.yaml")


def _project_to_dict(project: Project) -> dict:
    return {
        "project": {
            "id": project.id,
            "name": project.name,
            "description": project.description,
            "version": project.version,
        },
        "nodes": [n.model_dump(mode="json") for n in project.nodes],
        "connections": [c.model_dump(mode="json") for c in project.connections],
        "metadata": project.metadata,
    }


def _dict_to_project(data: dict) -> Project:
    return Project(
        id=data["project"]["id"],
        name=data["project"]["name"],
        description=data["project"].get("description"),
        version=data["project"].get("version", "0.1.0"),
        nodes=[Node.model_validate(n) for n in data.get("nodes", [])],
        connections=[Connection.model_validate(c) for c in data.get("connections", [])],
        metadata=data.get("metadata", {}),
    )


def create_project(name: str, description: str | None = None, yaml_content: str | None = None) -> Project:
    _ensure_data_dir()
    if yaml_content:
        data = yaml.safe_load(yaml_content)
        project = _dict_to_project(data)
    else:
        project = Project(name=name, description=description)
    _save_project(project)
    return project


def get_project(project_id: str) -> Project | None:
    path = _project_path(project_id)
    if not os.path.exists(path):
        return None
    with open(path, "r") as f:
        data = yaml.safe_load(f)
    return _dict_to_project(data)


def list_projects() -> list[Project]:
    _ensure_data_dir()
    projects = []
    for fname in os.listdir(DATA_DIR):
        if fname.endswith(".yaml"):
            pid = fname[:-5]
            proj = get_project(pid)
            if proj:
                projects.append(proj)
    return projects


def update_project(project_id: str, name: str | None = None, description: str | None = None) -> Project | None:
    project = get_project(project_id)
    if project is None:
        return None
    if name is not None:
        project.name = name
    if description is not None:
        project.description = description
    _save_project(project)
    return project


def delete_project(project_id: str) -> bool:
    path = _project_path(project_id)
    if os.path.exists(path):
        os.remove(path)
        return True
    return False


def _save_project(project: Project):
    _ensure_data_dir()
    path = _project_path(project.id)
    with open(path, "w") as f:
        yaml.dump(_project_to_dict(project), f, allow_unicode=True, sort_keys=False)


def add_node(project_id: str, node: Node) -> Project | None:
    project = get_project(project_id)
    if project is None:
        return None
    project.nodes.append(node)
    _save_project(project)
    return project


def update_node(project_id: str, node_id: str, node_data: Node) -> Project | None:
    project = get_project(project_id)
    if project is None:
        return None
    for i, n in enumerate(project.nodes):
        if n.id == node_id:
            node_data.id = node_id
            project.nodes[i] = node_data
            _save_project(project)
            return project
    return None


def delete_node(project_id: str, node_id: str) -> Project | None:
    project = get_project(project_id)
    if project is None:
        return None
    project.nodes = [n for n in project.nodes if n.id != node_id]
    project.connections = [c for c in project.connections if c.source_node_id != node_id and c.target_node_id != node_id]
    _save_project(project)
    return project


def add_connection(project_id: str, connection: Connection) -> Project | None:
    project = get_project(project_id)
    if project is None:
        return None
    project.connections.append(connection)
    _save_project(project)
    return project


def update_connection(project_id: str, connection_id: str, connection_data: Connection) -> Project | None:
    project = get_project(project_id)
    if project is None:
        return None
    for i, c in enumerate(project.connections):
        if c.id == connection_id:
            connection_data.id = connection_id
            project.connections[i] = connection_data
            _save_project(project)
            return project
    return None


def delete_connection(project_id: str, connection_id: str) -> Project | None:
    project = get_project(project_id)
    if project is None:
        return None
    project.connections = [c for c in project.connections if c.id != connection_id]
    _save_project(project)
    return project
