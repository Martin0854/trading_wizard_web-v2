"""FastAPI application entry point."""

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.src.api.common import stocks, user_data
from backend.src.config.settings import get_settings
from backend.src.middleware.rate_limit import RateLimitMiddleware

settings = get_settings()


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan events."""
    # Startup
    print(f"Starting Trading Wizard API on {settings.api_host}:{settings.api_port}")
    yield
    # Shutdown
    print("Shutting down Trading Wizard API")


# Create FastAPI application
app = FastAPI(
    title="Trading Wizard API",
    description="Trading Wizard 웹 인터페이스 API",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure rate limiting (60 requests/min per IP, burst up to 100)
app.add_middleware(
    RateLimitMiddleware,
    requests_per_minute=60,
    burst_size=100,
    exclude_paths=["/health", "/docs", "/openapi.json", "/redoc"],
)

# Include routers
app.include_router(
    user_data.router,
    prefix="/api/user-data",
    tags=["User Data"]
)
app.include_router(
    stocks.router,
    prefix="/api/stocks",
    tags=["Stock"]
)


@app.get("/health")
async def health_check() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "healthy"}


@app.get("/")
async def root() -> dict[str, str]:
    """Root endpoint."""
    return {
        "message": "Trading Wizard API",
        "version": "1.0.0",
        "docs": "/docs"
    }
