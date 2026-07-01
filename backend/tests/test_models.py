import pytest
from terra_engine.models.enums import NodeType, CommunicationMode, Protocol
from terra_engine.models.project import Position, DataCarrier, Node, Connection, Project


class TestEnums:
    def test_node_type_values(self):
        assert NodeType.SERVICE == "service"
        assert NodeType.DATABASE == "database"
        assert NodeType.QUEUE == "queue"

    def test_communication_mode_values(self):
        assert CommunicationMode.SYNC_REQUEST_RESPONSE == "sync_request_response"
        assert CommunicationMode.PUBLISH_SUBSCRIBE == "publish_subscribe"

    def test_protocol_values(self):
        assert Protocol.HTTP_REST == "http_rest"
        assert Protocol.KAFKA == "kafka"


class TestNode:
    def test_create_minimal_node(self):
        node = Node(type=NodeType.SERVICE, label="API Gateway")
        assert node.label == "API Gateway"
        assert node.type == NodeType.SERVICE
        assert node.id != ""
        assert node.position.x == 0.0

    def test_create_full_node(self):
        node = Node(
            type=NodeType.DATABASE,
            label="PostgreSQL",
            description="Order database",
            position=Position(x=100, y=200),
            properties={"engine": "PostgreSQL", "version": "16"},
        )
        assert node.position.x == 100
        assert node.properties["engine"] == "PostgreSQL"


class TestConnection:
    def test_create_connection(self):
        conn = Connection(
            source_node_id="n1",
            target_node_id="n2",
            mode=CommunicationMode.SYNC_REQUEST_RESPONSE,
            protocol=Protocol.HTTP_REST,
            description="Create order",
        )
        assert conn.source_node_id == "n1"
        assert conn.protocol == Protocol.HTTP_REST

    def test_connection_with_data_carrier(self):
        carrier = DataCarrier(format="json_schema", inline_schema={"type": "object"})
        conn = Connection(
            source_node_id="n1",
            target_node_id="n2",
            mode=CommunicationMode.ASYNC_MESSAGE,
            protocol=Protocol.KAFKA,
            data_carrier=carrier,
        )
        assert conn.data_carrier is not None
        assert conn.data_carrier.format == "json_schema"


class TestProject:
    def test_create_project(self):
        project = Project(name="Test Project")
        assert project.name == "Test Project"
        assert len(project.nodes) == 0
        assert len(project.connections) == 0
        assert project.version == "0.1.0"

    def test_project_with_nodes(self):
        node1 = Node(type=NodeType.SERVICE, label="Service A")
        node2 = Node(type=NodeType.DATABASE, label="DB")
        project = Project(name="Test", nodes=[node1, node2])
        assert len(project.nodes) == 2


class TestDataCarrier:
    def test_create_data_carrier(self):
        carrier = DataCarrier(
            format="json_schema",
            schema_ref="./schemas/order.proto",
        )
        assert carrier.schema_ref == "./schemas/order.proto"
