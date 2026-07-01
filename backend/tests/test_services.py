import pytest
import os
import tempfile
from terra_engine.models.enums import NodeType, CommunicationMode, Protocol
from terra_engine.models.project import Node, Connection, Project
from terra_engine.services import project_service


@pytest.fixture(autouse=True)
def temp_data_dir():
    with tempfile.TemporaryDirectory() as tmpdir:
        old = os.environ.get("TERRA_DATA_DIR")
        os.environ["TERRA_DATA_DIR"] = tmpdir
        yield tmpdir
        if old:
            os.environ["TERRA_DATA_DIR"] = old
        else:
            del os.environ["TERRA_DATA_DIR"]


class TestProjectCRUD:
    def test_create_and_get(self):
        project = project_service.create_project("Test Project", "Description")
        fetched = project_service.get_project(project.id)
        assert fetched is not None
        assert fetched.name == "Test Project"
        assert fetched.description == "Description"

    def test_list_projects(self):
        project_service.create_project("P1")
        project_service.create_project("P2")
        projects = project_service.list_projects()
        assert len(projects) >= 2

    def test_update_project(self):
        p = project_service.create_project("Old Name")
        updated = project_service.update_project(p.id, name="New Name")
        assert updated is not None
        assert updated.name == "New Name"

    def test_delete_project(self):
        p = project_service.create_project("To Delete")
        assert project_service.delete_project(p.id)
        assert project_service.get_project(p.id) is None

    def test_delete_nonexistent(self):
        assert not project_service.delete_project("nonexistent")

    def test_get_nonexistent(self):
        assert project_service.get_project("nonexistent") is None


class TestNodeCRUD:
    def test_add_node(self):
        p = project_service.create_project("P")
        node = Node(type=NodeType.SERVICE, label="API Gateway")
        updated = project_service.add_node(p.id, node)
        assert updated is not None
        assert len(updated.nodes) == 1
        assert updated.nodes[0].label == "API Gateway"

    def test_add_node_to_nonexistent_project(self):
        node = Node(type=NodeType.SERVICE, label="X")
        assert project_service.add_node("nonexistent", node) is None

    def test_update_node(self):
        p = project_service.create_project("P")
        node = Node(id="n1", type=NodeType.SERVICE, label="Old")
        project_service.add_node(p.id, node)

        updated_node = Node(id="n1", type=NodeType.SERVICE, label="New")
        result = project_service.update_node(p.id, "n1", updated_node)
        assert result is not None
        fetched = project_service.get_project(p.id)
        assert fetched.nodes[0].label == "New"

    def test_delete_node_cleans_connections(self):
        p = project_service.create_project("P")
        n1 = Node(id="n1", type=NodeType.SERVICE, label="A")
        n2 = Node(id="n2", type=NodeType.SERVICE, label="B")
        project_service.add_node(p.id, n1)
        project_service.add_node(p.id, n2)

        conn = Connection(id="c1", source_node_id="n1", target_node_id="n2",
                          mode=CommunicationMode.SYNC_REQUEST_RESPONSE, protocol=Protocol.HTTP_REST)
        project_service.add_connection(p.id, conn)

        project_service.delete_node(p.id, "n1")
        fetched = project_service.get_project(p.id)
        assert len(fetched.nodes) == 1
        assert len(fetched.connections) == 0


class TestConnectionCRUD:
    def test_add_connection(self):
        p = project_service.create_project("P")
        project_service.add_node(p.id, Node(id="n1", type=NodeType.SERVICE, label="S1"))
        project_service.add_node(p.id, Node(id="n2", type=NodeType.DATABASE, label="D1"))

        conn = Connection(source_node_id="n1", target_node_id="n2",
                          mode=CommunicationMode.SYNC_REQUEST_RESPONSE, protocol=Protocol.DATABASE)
        updated = project_service.add_connection(p.id, conn)
        assert len(updated.connections) == 1

    def test_update_connection(self):
        p = project_service.create_project("P")
        project_service.add_node(p.id, Node(id="n1", type=NodeType.SERVICE, label="S1"))
        project_service.add_node(p.id, Node(id="n2", type=NodeType.DATABASE, label="D1"))

        conn = Connection(id="c1", source_node_id="n1", target_node_id="n2",
                          mode=CommunicationMode.SYNC_REQUEST_RESPONSE, protocol=Protocol.HTTP_REST)
        project_service.add_connection(p.id, conn)

        updated = Connection(id="c1", source_node_id="n1", target_node_id="n2",
                             mode=CommunicationMode.ASYNC_MESSAGE, protocol=Protocol.KAFKA)
        result = project_service.update_connection(p.id, "c1", updated)
        assert result is not None
        fetched = project_service.get_project(p.id)
        assert fetched.connections[0].mode == CommunicationMode.ASYNC_MESSAGE

    def test_delete_connection(self):
        p = project_service.create_project("P")
        project_service.add_node(p.id, Node(id="n1", type=NodeType.SERVICE, label="S1"))
        project_service.add_node(p.id, Node(id="n2", type=NodeType.DATABASE, label="D1"))
        conn = Connection(id="c1", source_node_id="n1", target_node_id="n2",
                          mode=CommunicationMode.SYNC_REQUEST_RESPONSE, protocol=Protocol.DATABASE)
        project_service.add_connection(p.id, conn)

        result = project_service.delete_connection(p.id, "c1")
        assert result is not None
        assert len(result.connections) == 0


class TestValidatorService:
    def test_validate_empty_project(self):
        from terra_engine.services.validator_service import validate_project
        p = Project(name="Empty")
        results = validate_project(p)
        assert isinstance(results, list)

    def test_validate_with_data(self):
        from terra_engine.services.validator_service import validate_project
        p = Project(
            name="Test",
            nodes=[
                Node(id="a", type=NodeType.SERVICE, label="A"),
                Node(id="b", type=NodeType.SERVICE, label="B"),
            ],
            connections=[
                Connection(id="c1", source_node_id="a", target_node_id="b",
                           mode=CommunicationMode.SYNC_REQUEST_RESPONSE, protocol=Protocol.HTTP_REST),
                Connection(id="c2", source_node_id="b", target_node_id="a",
                           mode=CommunicationMode.SYNC_REQUEST_RESPONSE, protocol=Protocol.HTTP_REST),
            ],
        )
        results = validate_project(p)
        assert any(r.rule == "cycle_detector" for r in results)


class TestExportService:
    def test_export_yaml(self):
        from terra_engine.services.export_service import export_project_yaml
        p = Project(
            name="Test",
            nodes=[Node(id="n1", type=NodeType.SERVICE, label="API")],
            connections=[],
        )
        yaml_str = export_project_yaml(p)
        assert "project:" in yaml_str
        assert "API" in yaml_str

    def test_export_json(self):
        from terra_engine.services.export_service import export_project_json
        p = Project(name="Test")
        json_data = export_project_json(p)
        assert json_data["name"] == "Test"
