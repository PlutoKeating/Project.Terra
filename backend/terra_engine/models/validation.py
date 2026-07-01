from pydantic import BaseModel
from typing import Optional


class ValidationResult(BaseModel):
    rule: str
    severity: str
    message: str
    entities: list[str] = []
    suggestion: Optional[str] = None
