from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from terra_engine.models.project import Project
from terra_engine.services import project_service
from terra_engine.services import export_service

router = APIRouter(prefix="/projects", tags=["projects"])


class ProjectCreateBody(BaseModel):
    name: str
    description: Optional[str] = None
    yaml_content: Optional[str] = None


class ProjectUpdateBody(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


@router.post("", response_model=Project)
def create_project(body: ProjectCreateBody):
    project = project_service.create_project(
        name=body.name,
        description=body.description,
        yaml_content=body.yaml_content,
    )
    return project


@router.get("", response_model=list[Project])
def list_projects():
    return project_service.list_projects()


@router.get("/{project_id}", response_model=Project)
def get_project(project_id: str):
    project = project_service.get_project(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.put("/{project_id}", response_model=Project)
def update_project(project_id: str, body: ProjectUpdateBody):
    project = project_service.update_project(
        project_id=project_id,
        name=body.name,
        description=body.description,
    )
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.delete("/{project_id}")
def delete_project(project_id: str):
    if not project_service.delete_project(project_id):
        raise HTTPException(status_code=404, detail="Project not found")
    return {"status": "deleted"}


@router.get("/{project_id}/export")
def export_project(project_id: str, format: str = Query("yaml")):
    project = project_service.get_project(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    if format == "yaml":
        return {"yaml": export_service.export_project_yaml(project)}
    return export_service.export_project_json(project)
