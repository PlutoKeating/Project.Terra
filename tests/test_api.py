from api.index import app


class AuthResponse:
    is_success = True

    def __init__(self, user_id):
        self.user_id = user_id

    def json(self):
        return {"id": self.user_id}


def test_health():
    assert app.test_client().get("/api/v1/health").json == {"status": "ok"}


def test_project_and_node_workflow():
    client = app.test_client()
    project = client.post("/api/v1/projects", json={"name": "Serverless"}).get_json()
    node = client.post(f"/api/v1/projects/{project['id']}/nodes", json={"type": "service", "label": "API"})
    assert node.status_code == 200
    assert client.get(f"/api/v1/projects/{project['id']}").status_code == 200


def test_project_metadata_can_be_created_and_updated():
    client = app.test_client()
    created = client.post("/api/v1/projects", json={"name": "Workspace", "metadata": {"active": True}})
    assert created.status_code == 200
    project = created.get_json()
    assert project["metadata"] == {"active": True}
    updated = client.put(f"/api/v1/projects/{project['id']}", json={"metadata": {"active": False}})
    assert updated.status_code == 200
    assert updated.get_json()["metadata"] == {"active": False}


def test_projects_are_isolated_by_authenticated_user(monkeypatch):
    monkeypatch.setenv("SUPABASE_AUTH_REQUIRED", "true")
    monkeypatch.setenv("SUPABASE_URL", "https://example.supabase.co")
    monkeypatch.setenv("SUPABASE_ANON_KEY", "anon")
    monkeypatch.setattr(
        "api.app.httpx.get",
        lambda _url, headers, timeout: AuthResponse(headers["Authorization"].removeprefix("Bearer ")),
    )
    client = app.test_client()
    alice = {"Authorization": "Bearer 11111111-1111-1111-1111-111111111111"}
    bob = {"Authorization": "Bearer 22222222-2222-2222-2222-222222222222"}

    created = client.post("/api/v1/projects", json={"name": "Alice only"}, headers=alice)
    project_id = created.get_json()["id"]

    assert client.get("/api/v1/projects", headers=alice).get_json()[0]["id"] == project_id
    assert client.get("/api/v1/projects", headers=bob).get_json() == []
    assert client.get(f"/api/v1/projects/{project_id}", headers=bob).status_code == 404
    assert client.delete(f"/api/v1/projects/{project_id}", headers=bob).status_code == 404
