from fastapi import APIRouter, HTTPException
from terra_engine.models.validation import ValidationResult
from terra_engine.services import project_service
from terra_engine.services import validator_service

router = APIRouter(prefix="/projects/{project_id}", tags=["validation"])


@router.post("/validate", response_model=list[ValidationResult])
def validate_project(project_id: str):
    project = project_service.get_project(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return validator_service.validate_project(project)
