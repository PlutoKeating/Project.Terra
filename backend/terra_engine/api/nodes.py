from fastapi import APIRouter, HTTPException
from terra_engine.models.project import Node
from terra_engine.services import project_service

router = APIRouter(prefix="/projects/{project_id}/nodes", tags=["nodes"])


@router.post("", response_model=Node)
def create_node(project_id: str, node: Node):
    project = project_service.add_node(project_id, node)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return project.nodes[-1]


@router.get("", response_model=list[Node])
def list_nodes(project_id: str):
    project = project_service.get_project(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return project.nodes


@router.get("/{node_id}", response_model=Node)
def get_node(project_id: str, node_id: str):
    project = project_service.get_project(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    for n in project.nodes:
        if n.id == node_id:
            return n
    raise HTTPException(status_code=404, detail="Node not found")


@router.put("/{node_id}", response_model=Node)
def update_node(project_id: str, node_id: str, node: Node):
    project = project_service.update_node(project_id, node_id, node)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    for n in project.nodes:
        if n.id == node_id:
            return n
    raise HTTPException(status_code=404, detail="Node not found")


@router.delete("/{node_id}")
def delete_node(project_id: str, node_id: str):
    project = project_service.delete_node(project_id, node_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"status": "deleted"}
