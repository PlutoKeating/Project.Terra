from fastapi import APIRouter, HTTPException
from terra_engine.models.project import Connection
from terra_engine.services import project_service

router = APIRouter(prefix="/projects/{project_id}/connections", tags=["connections"])


@router.post("", response_model=Connection)
def create_connection(project_id: str, connection: Connection):
    project = project_service.get_project(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    node_ids = {node.id for node in project.nodes}
    if connection.source_node_id not in node_ids or connection.target_node_id not in node_ids:
        raise HTTPException(status_code=422, detail="Connection references an unknown node")
    project = project_service.add_connection(project_id, connection)
    return project.connections[-1]


@router.get("", response_model=list[Connection])
def list_connections(project_id: str):
    project = project_service.get_project(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return project.connections


@router.get("/{connection_id}", response_model=Connection)
def get_connection(project_id: str, connection_id: str):
    project = project_service.get_project(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    for c in project.connections:
        if c.id == connection_id:
            return c
    raise HTTPException(status_code=404, detail="Connection not found")


@router.put("/{connection_id}", response_model=Connection)
def update_connection(project_id: str, connection_id: str, connection: Connection):
    current = project_service.get_project(project_id)
    if current is None:
        raise HTTPException(status_code=404, detail="Project not found")
    node_ids = {node.id for node in current.nodes}
    if connection.source_node_id not in node_ids or connection.target_node_id not in node_ids:
        raise HTTPException(status_code=422, detail="Connection references an unknown node")
    project = project_service.update_connection(project_id, connection_id, connection)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    for c in project.connections:
        if c.id == connection_id:
            return c
    raise HTTPException(status_code=404, detail="Connection not found")


@router.delete("/{connection_id}")
def delete_connection(project_id: str, connection_id: str):
    current = project_service.get_project(project_id)
    if current is None:
        raise HTTPException(status_code=404, detail="Project not found")
    if not any(connection.id == connection_id for connection in current.connections):
        raise HTTPException(status_code=404, detail="Connection not found")
    project = project_service.delete_connection(project_id, connection_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"status": "deleted"}
