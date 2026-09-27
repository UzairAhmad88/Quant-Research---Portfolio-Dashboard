from fastapi.testclient import TestClient

def test_root_health(client: TestClient):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "quant-research-backend"
    assert "version" in data

def test_v1_health(client: TestClient):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "quant-research-backend"

def test_readiness_probe(client: TestClient):
    response = client.get("/health/ready")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ready"
    assert data["database"] == "connected"

def test_version_endpoint(client: TestClient):
    response = client.get("/version")
    assert response.status_code == 200
    data = response.json()
    assert data["version"] == "1.0.0"
    assert "build_id" in data
    assert "environment" in data
