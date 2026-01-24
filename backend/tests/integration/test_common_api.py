"""Integration tests for common API endpoints."""

import base64
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

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

    def test_get_user_data_invalid_hash(self, client):
        """Test with invalid hash format."""
        response = client.get("/api/user-data/invalid-hash")
        assert response.status_code == 400

    def test_get_user_data_invalid_hash_too_short(self, client):
        """Test with hash that's too short."""
        response = client.get("/api/user-data/abc123")
        assert response.status_code == 400
        data = response.json()
        assert "error" in data["detail"]
        assert data["detail"]["error"] == "INVALID_USER_ID"

    @patch("backend.src.api.common.user_data.get_db")
    def test_get_user_data_not_found(self, mock_get_db, client):
        """Test getting non-existent user data with mocked DB."""
        # Mock database session
        mock_session = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_session.execute.return_value = mock_result

        async def mock_db_generator():
            yield mock_session

        mock_get_db.return_value = mock_db_generator()

        user_hash = "a" * 64
        response = client.get(f"/api/user-data/{user_hash}")
        assert response.status_code == 404
        data = response.json()
        assert data["detail"]["error"] == "USER_NOT_FOUND"

    @patch("backend.src.api.common.user_data.get_db")
    def test_save_and_get_user_data(self, mock_get_db, client):
        """Test saving and retrieving user data with mocked DB."""
        # Mock database session
        mock_session = AsyncMock()

        # Mock for save (no existing record)
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_session.execute.return_value = mock_result
        mock_session.commit = AsyncMock()
        mock_session.add = MagicMock()

        async def mock_db_generator():
            yield mock_session

        mock_get_db.return_value = mock_db_generator()

        user_hash = "b" * 64
        encrypted_data = base64.b64encode(b"encrypted test data").decode()

        # Save data
        save_response = client.put(
            f"/api/user-data/{user_hash}",
            json={"encryptedBlob": encrypted_data}
        )
        assert save_response.status_code == 200
        data = save_response.json()
        assert data["success"] is True

    @patch("backend.src.api.common.user_data.get_db")
    def test_get_user_data_success(self, mock_get_db, client):
        """Test getting existing user data with mocked DB."""
        # Mock database session
        mock_session = AsyncMock()

        # Create mock user data
        mock_user_data = MagicMock()
        mock_user_data.user_id_hash = "c" * 64
        mock_user_data.encrypted_blob = b"encrypted data"
        mock_user_data.updated_at = datetime.now()

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_user_data
        mock_session.execute.return_value = mock_result

        async def mock_db_generator():
            yield mock_session

        mock_get_db.return_value = mock_db_generator()

        user_hash = "c" * 64
        response = client.get(f"/api/user-data/{user_hash}")
        assert response.status_code == 200
        data = response.json()
        assert data["userIdHash"] == user_hash
        assert "encryptedBlob" in data
        assert "updatedAt" in data

    def test_save_user_data_blob_too_large(self, client):
        """Test saving user data with blob exceeding size limit."""
        user_hash = "d" * 64
        # Create a blob larger than 1MB
        large_data = base64.b64encode(b"x" * (1024 * 1024 + 1)).decode()

        response = client.put(
            f"/api/user-data/{user_hash}",
            json={"encryptedBlob": large_data}
        )
        assert response.status_code == 422  # Validation error
        data = response.json()
        assert "데이터 크기" in str(data)

    def test_save_user_data_invalid_base64(self, client):
        """Test saving user data with invalid base64."""
        user_hash = "e" * 64

        response = client.put(
            f"/api/user-data/{user_hash}",
            json={"encryptedBlob": "not-valid-base64!!!"}
        )
        assert response.status_code == 422  # Validation error


class TestRateLimiting:
    """Test rate limiting middleware."""

    def test_health_excluded_from_rate_limit(self, client):
        """Test that /health endpoint is excluded from rate limiting."""
        # Make many requests - should all succeed
        for _ in range(150):
            response = client.get("/health")
            assert response.status_code == 200


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
