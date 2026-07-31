from api.index import app


def test_health():
    assert app.test_client().get("/api/v1/health").json == {"status": "ok"}


def test_project_and_node_workflow(tmp_path, monkeypatch):
    monkeypatch.setenv("TERRA_DATA_DIR", str(tmp_path))
    client = app.test_client()
    project = client.post("/api/v1/projects", json={"name": "Serverless"}).get_json()
    node = client.post(f"/api/v1/projects/{project['id']}/nodes", json={"type": "service", "label": "API"})
    assert node.status_code == 200
    assert client.get(f"/api/v1/projects/{project['id']}").status_code == 200


def test_project_metadata_can_be_created_and_updated(tmp_path, monkeypatch):
    monkeypatch.setenv("TERRA_DATA_DIR", str(tmp_path))
    client = app.test_client()
    created = client.post("/api/v1/projects", json={"name": "Workspace", "metadata": {"active": True}})
    assert created.status_code == 200
    project = created.get_json()
    assert project["metadata"] == {"active": True}
    updated = client.put(f"/api/v1/projects/{project['id']}", json={"metadata": {"active": False}})
    assert updated.status_code == 200
    assert updated.get_json()["metadata"] == {"active": False}
