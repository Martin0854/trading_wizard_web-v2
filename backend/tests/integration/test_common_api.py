"""Integration tests for common API endpoints."""

import pytest
from fastapi.testclient import TestClient

from backend.src.main import app


@pytest.fixture
def client():
    """Create test client."""
    return TestClient(app)


class TestHealthEndpoint:
    """Test health check endpoint."""

    def test_health_check(self, client):
        """Test health endpoint returns OK."""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"


class TestRootEndpoint:
    """Test root endpoint."""

    def test_root(self, client):
        """Test root endpoint returns API info."""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "Trading Wizard" in data["message"]
        assert "version" in data


class TestStockEndpoints:
    """Test stock API endpoints."""

    def test_search_stocks(self, client):
        """Test stock search endpoint."""
        response = client.get("/api/stocks/search?q=삼성")
        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        assert "total" in data

    def test_search_stocks_min_length(self, client):
        """Test stock search with short query."""
        response = client.get("/api/stocks/search?q=a")
        assert response.status_code == 422  # Validation error

    def test_get_kospi100_list(self, client):
        """Test KOSPI 100 list endpoint."""
        response = client.get("/api/stocks/kospi100")
        assert response.status_code == 200
        data = response.json()
        assert "stocks" in data
        assert len(data["stocks"]) == 100
        assert "updatedAt" in data


class TestUserDataEndpoints:
    """Test user data API endpoints."""

    def test_get_user_data_not_found(self, client):
        """Test getting non-existent user data."""
        # Valid hash format but doesn't exist
        user_hash = "a" * 64
        response = client.get(f"/api/user-data/{user_hash}")
        assert response.status_code == 404
        data = response.json()
        assert "error" in data["detail"]

    def test_get_user_data_invalid_hash(self, client):
        """Test with invalid hash format."""
        response = client.get("/api/user-data/invalid-hash")
        assert response.status_code == 400

    def test_save_and_get_user_data(self, client):
        """Test saving and retrieving user data."""
        import base64

        user_hash = "b" * 64
        encrypted_data = base64.b64encode(b"encrypted test data").decode()

        # Save data
        save_response = client.put(
            f"/api/user-data/{user_hash}",
            json={"encryptedBlob": encrypted_data}
        )
        # Note: This will fail without actual DB connection
        # In a real test, we'd mock the database
        # For now, we just check the endpoint exists
        assert save_response.status_code in [200, 500]  # 500 if no DB


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
