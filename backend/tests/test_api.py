import os
import tempfile
import pytest
from fastapi.testclient import TestClient
from terra_engine.main import app
from terra_engine.models.enums import NodeType, CommunicationMode, Protocol


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


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def project(client):
    resp = client.post("/api/v1/projects", json={"name": "Test Project", "description": "Integration test"})
    assert resp.status_code == 200
    return resp.json()


class TestHealth:
    def test_health(self, client):
        resp = client.get("/api/v1/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"


class TestProjectAPI:
    def test_create_project(self, client):
        resp = client.post("/api/v1/projects", json={"name": "My Project"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["name"] == "My Project"
        assert "id" in data

    def test_create_project_from_yaml(self, client):
        yaml_content = """project:
  id: custom-id-123
  name: From YAML
  description: Imported
  version: "0.1.0"
nodes: []
connections: []
metadata: {}
"""
        resp = client.post("/api/v1/projects", json={"name": "From YAML", "yaml_content": yaml_content})
        assert resp.status_code == 200
        assert resp.json()["id"] == "custom-id-123"

    def test_list_projects(self, client, project):
        resp = client.get("/api/v1/projects")
        assert resp.status_code == 200
        assert len(resp.json()) >= 1

    def test_get_project(self, client, project):
        resp = client.get(f"/api/v1/projects/{project['id']}")
        assert resp.status_code == 200
        assert resp.json()["name"] == "Test Project"

    def test_get_nonexistent_project(self, client):
        resp = client.get("/api/v1/projects/nonexistent")
        assert resp.status_code == 404

    def test_update_project(self, client, project):
        resp = client.put(f"/api/v1/projects/{project['id']}", json={"name": "Updated"})
        assert resp.status_code == 200
        assert resp.json()["name"] == "Updated"

    def test_delete_project(self, client):
        resp = client.post("/api/v1/projects", json={"name": "To Delete"})
        pid = resp.json()["id"]
        resp2 = client.delete(f"/api/v1/projects/{pid}")
        assert resp2.status_code == 200
        resp3 = client.get(f"/api/v1/projects/{pid}")
        assert resp3.status_code == 404

    def test_export_yaml(self, client, project):
        resp = client.get(f"/api/v1/projects/{project['id']}/export?format=yaml")
        assert resp.status_code == 200
        assert "yaml" in resp.json()

    def test_export_json(self, client, project):
        resp = client.get(f"/api/v1/projects/{project['id']}/export")
        assert resp.status_code == 200


class TestNodeAPI:
    def test_create_node(self, client, project):
        resp = client.post(
            f"/api/v1/projects/{project['id']}/nodes",
            json={"type": "service", "label": "API Gateway", "position": {"x": 100, "y": 200}},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["label"] == "API Gateway"
        assert data["type"] == "service"

    def test_list_nodes(self, client, project):
        client.post(f"/api/v1/projects/{project['id']}/nodes",
                    json={"type": "service", "label": "S1"})
        client.post(f"/api/v1/projects/{project['id']}/nodes",
                    json={"type": "database", "label": "DB1"})
        resp = client.get(f"/api/v1/projects/{project['id']}/nodes")
        assert resp.status_code == 200
        assert len(resp.json()) == 2

    def test_get_node(self, client, project):
        resp = client.post(f"/api/v1/projects/{project['id']}/nodes",
                           json={"type": "service", "label": "Target"})
        nid = resp.json()["id"]
        resp2 = client.get(f"/api/v1/projects/{project['id']}/nodes/{nid}")
        assert resp2.status_code == 200
        assert resp2.json()["label"] == "Target"

    def test_get_nonexistent_node(self, client, project):
        resp = client.get(f"/api/v1/projects/{project['id']}/nodes/nonexistent")
        assert resp.status_code == 404

    def test_update_node(self, client, project):
        resp = client.post(f"/api/v1/projects/{project['id']}/nodes",
                           json={"type": "service", "label": "Old"})
        nid = resp.json()["id"]
        resp2 = client.put(
            f"/api/v1/projects/{project['id']}/nodes/{nid}",
            json={"type": "service", "label": "New", "position": {"x": 300, "y": 400}},
        )
        assert resp2.status_code == 200
        assert resp2.json()["label"] == "New"
        assert resp2.json()["position"]["x"] == 300

    def test_delete_node(self, client, project):
        resp = client.post(f"/api/v1/projects/{project['id']}/nodes",
                           json={"type": "service", "label": "DeleteMe"})
        nid = resp.json()["id"]
        resp2 = client.delete(f"/api/v1/projects/{project['id']}/nodes/{nid}")
        assert resp2.status_code == 200
        resp3 = client.get(f"/api/v1/projects/{project['id']}/nodes")
        assert len(resp3.json()) == 0


class TestConnectionAPI:
    def _setup_nodes(self, client, project):
        r1 = client.post(f"/api/v1/projects/{project['id']}/nodes",
                          json={"type": "service", "label": "S1"})
        r2 = client.post(f"/api/v1/projects/{project['id']}/nodes",
                          json={"type": "database", "label": "DB1"})
        return r1.json()["id"], r2.json()["id"]

    def test_create_connection(self, client, project):
        n1, n2 = self._setup_nodes(client, project)
        resp = client.post(
            f"/api/v1/projects/{project['id']}/connections",
            json={
                "source_node_id": n1,
                "target_node_id": n2,
                "mode": "sync_request_response",
                "protocol": "database",
                "description": "Query orders",
            },
        )
        assert resp.status_code == 200
        assert resp.json()["source_node_id"] == n1

    def test_list_connections(self, client, project):
        n1, n2 = self._setup_nodes(client, project)
        client.post(f"/api/v1/projects/{project['id']}/connections",
                    json={"source_node_id": n1, "target_node_id": n2,
                          "mode": "sync_request_response", "protocol": "database"})
        resp = client.get(f"/api/v1/projects/{project['id']}/connections")
        assert resp.status_code == 200
        assert len(resp.json()) == 1

    def test_get_connection(self, client, project):
        n1, n2 = self._setup_nodes(client, project)
        resp = client.post(f"/api/v1/projects/{project['id']}/connections",
                           json={"source_node_id": n1, "target_node_id": n2,
                                 "mode": "async_message", "protocol": "kafka"})
        cid = resp.json()["id"]
        resp2 = client.get(f"/api/v1/projects/{project['id']}/connections/{cid}")
        assert resp2.status_code == 200
        assert resp2.json()["protocol"] == "kafka"

    def test_update_connection(self, client, project):
        n1, n2 = self._setup_nodes(client, project)
        resp = client.post(f"/api/v1/projects/{project['id']}/connections",
                           json={"source_node_id": n1, "target_node_id": n2,
                                 "mode": "sync_request_response", "protocol": "http_rest"})
        cid = resp.json()["id"]
        resp2 = client.put(
            f"/api/v1/projects/{project['id']}/connections/{cid}",
            json={"source_node_id": n1, "target_node_id": n2,
                  "mode": "async_message", "protocol": "kafka"},
        )
        assert resp2.status_code == 200
        assert resp2.json()["protocol"] == "kafka"

    def test_delete_connection(self, client, project):
        n1, n2 = self._setup_nodes(client, project)
        resp = client.post(f"/api/v1/projects/{project['id']}/connections",
                           json={"source_node_id": n1, "target_node_id": n2,
                                 "mode": "sync_request_response", "protocol": "database"})
        cid = resp.json()["id"]
        resp2 = client.delete(f"/api/v1/projects/{project['id']}/connections/{cid}")
        assert resp2.status_code == 200
        resp3 = client.get(f"/api/v1/projects/{project['id']}/connections")
        assert len(resp3.json()) == 0


class TestValidationAPI:
    def test_validate_empty_project(self, client, project):
        resp = client.post(f"/api/v1/projects/{project['id']}/validate")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_validate_with_data(self, client, project):
        r1 = client.post(f"/api/v1/projects/{project['id']}/nodes",
                          json={"type": "service", "label": "S1"})
        r2 = client.post(f"/api/v1/projects/{project['id']}/nodes",
                          json={"type": "service", "label": "S2"})
        n1, n2 = r1.json()["id"], r2.json()["id"]

        client.post(f"/api/v1/projects/{project['id']}/connections",
                    json={"source_node_id": n1, "target_node_id": n2,
                          "mode": "sync_request_response", "protocol": "http_rest"})
        client.post(f"/api/v1/projects/{project['id']}/connections",
                    json={"source_node_id": n2, "target_node_id": n1,
                          "mode": "sync_request_response", "protocol": "http_rest"})

        resp = client.post(f"/api/v1/projects/{project['id']}/validate")
        assert resp.status_code == 200
        results = resp.json()
        assert any(r["rule"] == "cycle_detector" for r in results)

    def test_validate_nonexistent_project(self, client):
        resp = client.post("/api/v1/projects/nonexistent/validate")
        assert resp.status_code == 404

    def test_connection_rejects_unknown_node(self, client, project):
        resp = client.post(f"/api/v1/projects/{project['id']}/connections", json={
            "source_node_id": "missing", "target_node_id": "also-missing",
            "mode": "sync_request_response", "protocol": "http_rest"})
        assert resp.status_code == 422

    def test_export_rejects_unknown_format(self, client, project):
        resp = client.get(f"/api/v1/projects/{project['id']}/export?format=xml")
        assert resp.status_code == 400


class TestFullWorkflow:
    def test_ecommerce_scenario(self, client):
        # Create project
        resp = client.post("/api/v1/projects", json={"name": "E-Commerce"})
        assert resp.status_code == 200
        pid = resp.json()["id"]

        # Create nodes
        gw = client.post(f"/api/v1/projects/{pid}/nodes",
                         json={"type": "service", "label": "API Gateway",
                               "position": {"x": 120, "y": 80}})
        order = client.post(f"/api/v1/projects/{pid}/nodes",
                            json={"type": "service", "label": "Order Service",
                                  "position": {"x": 400, "y": 200}})
        db = client.post(f"/api/v1/projects/{pid}/nodes",
                         json={"type": "database", "label": "Order DB",
                               "position": {"x": 400, "y": 400},
                               "properties": {"engine": "PostgreSQL", "version": "16"}})
        queue = client.post(f"/api/v1/projects/{pid}/nodes",
                            json={"type": "queue", "label": "Event Bus",
                                  "position": {"x": 650, "y": 200},
                                  "properties": {"type": "Kafka",
                                                 "topics": ["order.created", "order.paid"]}})

        gid = gw.json()["id"]
        oid = order.json()["id"]
        did = db.json()["id"]
        qid = queue.json()["id"]

        # Create connections
        c1 = client.post(f"/api/v1/projects/{pid}/connections", json={
            "source_node_id": gid, "target_node_id": oid,
            "mode": "sync_request_response", "protocol": "http_rest",
            "description": "Gateway routes order creation",
        })
        assert c1.status_code == 200

        c2 = client.post(f"/api/v1/projects/{pid}/connections", json={
            "source_node_id": oid, "target_node_id": did,
            "mode": "sync_request_response", "protocol": "database",
            "description": "Order persistence",
        })
        assert c2.status_code == 200

        c3 = client.post(f"/api/v1/projects/{pid}/connections", json={
            "source_node_id": oid, "target_node_id": qid,
            "mode": "publish_subscribe", "protocol": "kafka",
            "description": "Publish order.created event",
        })
        assert c3.status_code == 200

        # Run validation
        val = client.post(f"/api/v1/projects/{pid}/validate")
        assert val.status_code == 200
        results = val.json()
        # Should NOT have orphan warnings (all connected), should NOT have cycle errors
        assert not any(r["rule"] == "orphan_detector" for r in results)
        assert not any(r["rule"] == "cycle_detector" for r in results)

        # Export YAML
        export = client.get(f"/api/v1/projects/{pid}/export?format=yaml")
        assert export.status_code == 200
        yaml_str = export.json()["yaml"]
        assert "API Gateway" in yaml_str
        assert "Order Service" in yaml_str
        assert "Event Bus" in yaml_str
        assert "order.created" in yaml_str
        assert "Kafka" in yaml_str

        # Export JSON
        export2 = client.get(f"/api/v1/projects/{pid}/export?format=json")
        assert export2.status_code == 200
        json_data = export2.json()
        assert json_data["name"] == "E-Commerce"
        assert len(json_data["nodes"]) == 4
        assert len(json_data["connections"]) == 3
