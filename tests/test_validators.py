import pytest
from terra_engine.models.enums import NodeType, CommunicationMode, Protocol
from terra_engine.models.project import Node, Connection, Project
from terra_engine.validators.cycle_detector import check_cycles
from terra_engine.validators.orphan_detector import check_orphans
from terra_engine.validators.completeness_checker import check_completeness
from terra_engine.validators.protocol_consistency import check_protocol_consistency


def make_node(id: str, label: str, ntype: NodeType = NodeType.SERVICE):
    return Node(id=id, type=ntype, label=label)


def make_conn(id: str, source: str, target: str, mode=None, protocol=None):
    return Connection(
        id=id,
        source_node_id=source,
        target_node_id=target,
        mode=mode or CommunicationMode.SYNC_REQUEST_RESPONSE,
        protocol=protocol or Protocol.HTTP_REST,
    )


class TestCycleDetector:
    def test_no_cycles(self):
        project = Project(
            name="Test",
            nodes=[make_node("a", "A"), make_node("b", "B"), make_node("c", "C")],
            connections=[make_conn("c1", "a", "b"), make_conn("c2", "b", "c")],
        )
        results = check_cycles(project)
        assert len(results) == 0

    def test_simple_cycle(self):
        project = Project(
            name="Test",
            nodes=[make_node("a", "A"), make_node("b", "B")],
            connections=[make_conn("c1", "a", "b"), make_conn("c2", "b", "a")],
        )
        results = check_cycles(project)
        assert len(results) >= 1
        assert results[0].severity == "error"
        assert "循环依赖" in results[0].message

    def test_triangle_cycle(self):
        project = Project(
            name="Test",
            nodes=[make_node("a", "A"), make_node("b", "B"), make_node("c", "C")],
            connections=[
                make_conn("c1", "a", "b"),
                make_conn("c2", "b", "c"),
                make_conn("c3", "c", "a"),
            ],
        )
        results = check_cycles(project)
        assert len(results) >= 1


class TestOrphanDetector:
    def test_no_orphans(self):
        project = Project(
            name="Test",
            nodes=[make_node("a", "A"), make_node("b", "B")],
            connections=[make_conn("c1", "a", "b")],
        )
        assert len(check_orphans(project)) == 0

    def test_orphan_node(self):
        project = Project(
            name="Test",
            nodes=[make_node("a", "A"), make_node("b", "B"), make_node("c", "C")],
            connections=[make_conn("c1", "a", "b")],
        )
        results = check_orphans(project)
        assert len(results) == 1
        assert results[0].severity == "warning"

    def test_all_orphans(self):
        project = Project(
            name="Test",
            nodes=[make_node("a", "A"), make_node("b", "B")],
            connections=[],
        )
        assert len(check_orphans(project)) == 2


class TestCompletenessChecker:
    def test_valid_project(self):
        project = Project(
            name="Test",
            nodes=[make_node("a", "A"), make_node("b", "B")],
            connections=[make_conn("c1", "a", "b")],
        )
        assert len(check_completeness(project)) == 0

    def test_missing_label(self):
        node = Node(id="a", type=NodeType.SERVICE, label="")
        project = Project(name="Test", nodes=[node])
        results = check_completeness(project)
        assert any("缺少 label" in r.message for r in results)

    def test_broken_reference(self):
        project = Project(
            name="Test",
            nodes=[make_node("a", "A")],
            connections=[make_conn("c1", "a", "nonexistent")],
        )
        results = check_completeness(project)
        assert any("不存在" in r.message for r in results)


class TestProtocolConsistency:
    def test_http_to_database(self):
        project = Project(
            name="Test",
            nodes=[
                make_node("a", "API", NodeType.SERVICE),
                make_node("b", "DB", NodeType.DATABASE),
            ],
            connections=[make_conn("c1", "a", "b", protocol=Protocol.HTTP_REST)],
        )
        results = check_protocol_consistency(project)
        assert len(results) >= 1
        assert "database" in results[0].message.lower()

    def test_valid_database_connection(self):
        project = Project(
            name="Test",
            nodes=[
                make_node("a", "API", NodeType.SERVICE),
                make_node("b", "DB", NodeType.DATABASE),
            ],
            connections=[make_conn("c1", "a", "b", protocol=Protocol.DATABASE)],
        )
        results = check_protocol_consistency(project)
        assert len(results) == 0

    def test_http_to_queue(self):
        project = Project(
            name="Test",
            nodes=[
                make_node("a", "API", NodeType.SERVICE),
                make_node("b", "Kafka", NodeType.QUEUE),
            ],
            connections=[make_conn("c1", "a", "b", protocol=Protocol.HTTP_REST)],
        )
        results = check_protocol_consistency(project)
        assert len(results) >= 1
