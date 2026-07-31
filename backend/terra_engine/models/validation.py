from pydantic import BaseModel, Field
from typing import Optional


class ValidationResult(BaseModel):
    rule: str
    severity: str
    message: str
    entities: list[str] = Field(default_factory=list)
    suggestion: Optional[str] = None
