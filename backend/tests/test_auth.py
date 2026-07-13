import os
import tempfile
import pytest
from fastapi.testclient import TestClient
from terra_engine.main import app

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
def client(temp_data_dir):
    return TestClient(app)

def test_auth_flow(client):
    # 1. Access protected route without cookie -> 401
    res = client.get("/api/v1/projects")
    assert res.status_code == 401
    
    # 2. Register new user
    res = client.post("/api/v1/auth/register", json={"email": "tester@terra.io", "password": "password123"})
    assert res.status_code == 200
    
    # 3. Login with wrong password -> 401
    res = client.post("/api/v1/auth/login", json={"email": "tester@terra.io", "password": "wrong"})
    assert res.status_code == 401
    
    # 4. Login successfully -> sets cookie
    res = client.post("/api/v1/auth/login", json={"email": "tester@terra.io", "password": "password123"})
    assert res.status_code == 200
    assert "terra_session" in res.cookies
    
    # 5. Access protected route with cookie -> 200
    res = client.get("/api/v1/projects")
    assert res.status_code == 200
    
    # 6. Verify /me identity
    res = client.get("/api/v1/auth/me")
    assert res.status_code == 200
    assert res.json()["email"] == "tester@terra.io"
    
    # 7. Logout -> clears cookie
    res = client.post("/api/v1/auth/logout")
    assert res.status_code == 200
    # TestClient cookie jar deletion check
    assert "terra_session" not in res.cookies or not res.cookies["terra_session"]
