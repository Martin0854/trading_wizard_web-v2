"""Database models for Trading Wizard."""


from sqlalchemy import Column, DateTime, LargeBinary, String, func
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
