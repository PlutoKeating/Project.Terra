import yaml
from uuid import uuid4
from terra_engine.models.project import Project, Node, Connection
from terra_engine.services import supabase_service

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
    if not data:
        return None
    positions = data.get("node_positions", {})
    nodes = []
    for raw_node in data.get("nodes", []):
        node = dict(raw_node)
        if "position" not in node and node.get("id") in positions:
            node["position"] = positions[node["id"]]
        nodes.append(Node.model_validate(node))
    project_data = data["project"]
    identity = {"id": project_data["id"]} if project_data.get("id") else {}
    return Project(
        **identity,
        name=project_data["name"],
        description=project_data.get("description"),
        version=project_data.get("version", "0.1.0"),
        nodes=nodes,
        connections=[Connection.model_validate(c) for c in data.get("connections", [])],
        metadata=data.get("metadata", {}),
    )


def create_project(
    name: str,
    description: str | None = None,
    yaml_content: str | None = None,
    metadata: dict | None = None,
    owner_id: str | None = None,
) -> Project:
    if yaml_content:
        data = yaml.safe_load(yaml_content)
        project = _dict_to_project(data)
        # Imported IDs are exchange-format identifiers, not database identities.
        # Always allocate a fresh project ID to prevent cross-owner overwrite collisions.
        project.id = str(uuid4())
    else:
        project = Project(name=name, description=description, metadata=metadata or {})
    _save_project(project, owner_id)
    return project


def get_project(project_id: str, owner_id: str | None = None) -> Project | None:
    data = supabase_service.get(project_id, owner_id)
    return _dict_to_project(data)


def list_projects(owner_id: str | None = None) -> list[Project]:
    return [_dict_to_project(data) for data in supabase_service.list_all(owner_id)]


def update_project(project_id: str, name: str | None = None, description: str | None = None, metadata: dict | None = None, owner_id: str | None = None) -> Project | None:
    project = get_project(project_id, owner_id)
    if project is None:
        return None
    if name is not None:
        project.name = name
    if description is not None:
        project.description = description
    if metadata is not None:
        project.metadata = metadata
    _save_project(project, owner_id)
    return project


def delete_project(project_id: str, owner_id: str | None = None) -> bool:
    if get_project(project_id, owner_id) is None:
        return False
    supabase_service.delete(project_id, owner_id)
    return True


def _save_project(project: Project, owner_id: str | None = None):
    supabase_service.save(_project_to_dict(project), owner_id)


def add_node(project_id: str, node: Node, owner_id: str | None = None) -> Project | None:
    project = get_project(project_id, owner_id)
    if project is None:
        return None
    project.nodes.append(node)
    _save_project(project, owner_id)
    return project


def update_node(project_id: str, node_id: str, node_data: Node, owner_id: str | None = None) -> Project | None:
    project = get_project(project_id, owner_id)
    if project is None:
        return None
    for i, n in enumerate(project.nodes):
        if n.id == node_id:
            node_data.id = node_id
            project.nodes[i] = node_data
            _save_project(project, owner_id)
            return project
    return None


def delete_node(project_id: str, node_id: str, owner_id: str | None = None) -> Project | None:
    project = get_project(project_id, owner_id)
    if project is None:
        return None
    project.nodes = [n for n in project.nodes if n.id != node_id]
    project.connections = [c for c in project.connections if c.source_node_id != node_id and c.target_node_id != node_id]
    _save_project(project, owner_id)
    return project


def add_connection(project_id: str, connection: Connection, owner_id: str | None = None) -> Project | None:
    project = get_project(project_id, owner_id)
    if project is None:
        return None
    project.connections.append(connection)
    _save_project(project, owner_id)
    return project


def update_connection(project_id: str, connection_id: str, connection_data: Connection, owner_id: str | None = None) -> Project | None:
    project = get_project(project_id, owner_id)
    if project is None:
        return None
    for i, c in enumerate(project.connections):
        if c.id == connection_id:
            connection_data.id = connection_id
            project.connections[i] = connection_data
            _save_project(project, owner_id)
            return project
    return None


def delete_connection(project_id: str, connection_id: str, owner_id: str | None = None) -> Project | None:
    project = get_project(project_id, owner_id)
    if project is None:
        return None
    project.connections = [c for c in project.connections if c.id != connection_id]
    _save_project(project, owner_id)
    return project
