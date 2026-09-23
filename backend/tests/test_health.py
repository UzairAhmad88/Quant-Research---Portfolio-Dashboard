from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root_health():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["status"] == "ok"
    assert "version" in data["data"]

def test_v1_health():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["status"] == "ok"
    assert "environment" in data["data"]
