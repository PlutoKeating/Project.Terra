from uuid import uuid4
from typing import Optional
from pydantic import BaseModel, Field
from terra_engine.models.enums import NodeType, CommunicationMode, Protocol


class Position(BaseModel):
    x: float = 0.0
    y: float = 0.0


class DataCarrier(BaseModel):
    format: str = "json_schema"
    schema_ref: Optional[str] = None
    inline_schema: Optional[dict] = None


class Node(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    type: NodeType
    label: str
    description: Optional[str] = None
    position: Position = Field(default_factory=Position)
    properties: dict = Field(default_factory=dict)
    metadata: dict = Field(default_factory=dict)


class Connection(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    source_node_id: str
    target_node_id: str
    mode: CommunicationMode
    protocol: Protocol
    data_carrier: Optional[DataCarrier] = None
    description: Optional[str] = None
    metadata: dict = Field(default_factory=dict)


class Project(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    name: str
    description: Optional[str] = None
    version: str = "0.1.0"
    nodes: list[Node] = Field(default_factory=list)
    connections: list[Connection] = Field(default_factory=list)
    metadata: dict = Field(default_factory=dict)
