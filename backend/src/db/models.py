"""Database models for Trading Wizard."""


from sqlalchemy import (
    BigInteger,
    Column,
    Date,
    DateTime,
    Float,
    Index,
    LargeBinary,
    String,
    func,
)
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


class UserData(Base):
    """User data model for storing encrypted blobs.

    The server cannot decrypt the blob - only the client with
    the user's password/PEM can decrypt it.
    """

    __tablename__ = "user_data"

    # SHA-256 hash of user's password/PEM (64 hex characters)
    user_id_hash = Column(String(64), primary_key=True, index=True)

    # AES-GCM encrypted JSON blob
    encrypted_blob = Column(LargeBinary, nullable=False)

    # Timestamps
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    def __repr__(self) -> str:
        return f"<UserData(user_id_hash={self.user_id_hash[:8]}...)>"


class StockPriceHistory(Base):
    """OHLCV price history data for persistent caching.

    Stores daily price data fetched from yfinance to reduce API calls
    and survive server restarts.
    """

    __tablename__ = "stock_price_history"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    symbol = Column(String(20), nullable=False, index=True)
    trade_date = Column(Date, nullable=False)
    open = Column(Float, nullable=False)
    high = Column(Float, nullable=False)
    low = Column(Float, nullable=False)
    close = Column(Float, nullable=False)
    volume = Column(BigInteger, nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    __table_args__ = (
        Index("ix_stock_price_history_symbol_date", "symbol", "trade_date", unique=True),
    )

    def __repr__(self) -> str:
        return f"<StockPriceHistory(symbol={self.symbol}, date={self.trade_date})>"


class StockCacheMetadata(Base):
    """Cache metadata for tracking data freshness.

    Tracks when each symbol's data was last fetched and what period
    is covered, enabling smart refresh decisions.
    """

    __tablename__ = "stock_cache_metadata"

    symbol = Column(String(20), primary_key=True)
    last_fetched_at = Column(DateTime(timezone=True), nullable=False)
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    def __repr__(self) -> str:
        return f"<StockCacheMetadata(symbol={self.symbol}, last_fetched={self.last_fetched_at})>"
