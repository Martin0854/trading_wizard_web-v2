"""Rate limiting middleware for API endpoints.

Implements token bucket rate limiting per IP address.
"""

import time
from collections import defaultdict
from collections.abc import Callable
from threading import Lock

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse


class TokenBucket:
    """Token bucket for rate limiting."""

    def __init__(self, max_tokens: int = 100, refill_rate: float = 10.0):
        """Initialize token bucket.

        Args:
            max_tokens: Maximum tokens in the bucket
            refill_rate: Tokens added per second
        """
        self.max_tokens = max_tokens
        self.refill_rate = refill_rate
        self.tokens = max_tokens
        self.last_refill = time.time()
        self.lock = Lock()

    def acquire(self, tokens: int = 1) -> bool:
        """Attempt to acquire tokens.

        Args:
            tokens: Number of tokens to acquire

        Returns:
            True if tokens acquired, False if rate limited
        """
        with self.lock:
            now = time.time()
            elapsed = now - self.last_refill
            self.tokens = min(self.max_tokens, self.tokens + elapsed * self.refill_rate)
            self.last_refill = now

            if self.tokens >= tokens:
                self.tokens -= tokens
                return True
            return False


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware.

    Limits requests per IP address using token bucket algorithm.
    """

    def __init__(
        self,
        app,
        requests_per_minute: int = 60,
        burst_size: int = 100,
        exclude_paths: list[str] | None = None,
    ):
        """Initialize rate limit middleware.

        Args:
            app: FastAPI application
            requests_per_minute: Base request rate per minute
            burst_size: Maximum burst size (bucket capacity)
            exclude_paths: Paths to exclude from rate limiting (e.g., ["/health"])
        """
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.refill_rate = requests_per_minute / 60.0  # tokens per second
        self.burst_size = burst_size
        self.exclude_paths = exclude_paths or ["/health", "/docs", "/openapi.json"]
        self.buckets: dict[str, TokenBucket] = defaultdict(
            lambda: TokenBucket(max_tokens=burst_size, refill_rate=self.refill_rate)
        )
        self.buckets_lock = Lock()

    def _get_client_ip(self, request: Request) -> str:
        """Get client IP address from request."""
        # Check for forwarded headers (reverse proxy)
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()

        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip

        # Fall back to direct connection
        if request.client:
            return request.client.host
        return "unknown"

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request with rate limiting."""
        # Skip rate limiting for excluded paths
        if any(request.url.path.startswith(path) for path in self.exclude_paths):
            return await call_next(request)

        client_ip = self._get_client_ip(request)

        # Get or create bucket for this IP
        with self.buckets_lock:
            bucket = self.buckets[client_ip]

        # Check rate limit
        if not bucket.acquire():
            return JSONResponse(
                status_code=429,
                content={
                    "error": "RATE_LIMITED",
                    "message": "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.",
                },
                headers={"Retry-After": "60"},
            )

        return await call_next(request)
