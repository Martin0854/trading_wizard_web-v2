"""User data API endpoints.

Handles encrypted blob storage and retrieval.
Server cannot decrypt the data - only stores it.
"""

import base64
import re
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, field_validator
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.src.db.database import get_db
from backend.src.db.models import UserData

router = APIRouter()

# User ID hash pattern: 64 hex characters (SHA-256)
USER_ID_HASH_PATTERN = re.compile(r"^[a-f0-9]{64}$")


class UserDataResponse(BaseModel):
    """Response model for user data retrieval."""
    userIdHash: str
    encryptedBlob: str  # Base64 encoded
    updatedAt: datetime


# Maximum blob size: 1MB (Base64 encoded, roughly 1.37MB in Base64)
MAX_BLOB_SIZE = 1 * 1024 * 1024  # 1MB in bytes
MAX_BLOB_BASE64_SIZE = int(MAX_BLOB_SIZE * 1.4)  # ~1.4MB for Base64


class UserDataSaveRequest(BaseModel):
    """Request model for user data save."""
    encryptedBlob: str  # Base64 encoded

    @field_validator("encryptedBlob")
    @classmethod
    def validate_base64(cls, v: str) -> str:
        # Check size limit first (prevent DoS)
        if len(v) > MAX_BLOB_BASE64_SIZE:
            raise ValueError(f"데이터 크기가 너무 큽니다. 최대 {MAX_BLOB_SIZE // 1024}KB까지 허용됩니다.")

        try:
            decoded = base64.b64decode(v)
            if len(decoded) > MAX_BLOB_SIZE:
                raise ValueError(f"데이터 크기가 너무 큽니다. 최대 {MAX_BLOB_SIZE // 1024}KB까지 허용됩니다.")
            return v
        except Exception as e:
            if "데이터 크기" in str(e):
                raise
            raise ValueError("Invalid Base64 encoding") from e


class SuccessResponse(BaseModel):
    """Success response model."""
    success: bool = True
    message: str | None = None


class ErrorResponse(BaseModel):
    """Error response model."""
    error: str
    message: str


def validate_user_id_hash(user_id_hash: str) -> None:
    """Validate user ID hash format."""
    if not USER_ID_HASH_PATTERN.match(user_id_hash):
        raise HTTPException(
            status_code=400,
            detail={"error": "INVALID_USER_ID", "message": "잘못된 사용자 ID 형식입니다."}
        )


@router.get(
    "/{user_id_hash}",
    response_model=UserDataResponse,
    responses={
        404: {"model": ErrorResponse, "description": "사용자 데이터 없음"},
        400: {"model": ErrorResponse, "description": "잘못된 요청"},
    }
)
async def get_user_data(
    user_id_hash: str,
    db: AsyncSession = Depends(get_db)
) -> UserDataResponse:
    """Get user data by user ID hash.

    The server returns the encrypted blob as-is.
    Decryption happens on the client side.
    """
    validate_user_id_hash(user_id_hash)

    try:
        result = await db.execute(
            select(UserData).where(UserData.user_id_hash == user_id_hash)
        )
        user_data = result.scalar_one_or_none()
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail={"error": "DATABASE_ERROR", "message": "데이터베이스 오류가 발생했습니다."}
        ) from e

    if user_data is None:
        raise HTTPException(
            status_code=404,
            detail={"error": "USER_NOT_FOUND", "message": "사용자 데이터가 없습니다. 신규 사용자입니다."}
        )

    return UserDataResponse(
        userIdHash=user_data.user_id_hash,
        encryptedBlob=base64.b64encode(user_data.encrypted_blob).decode("utf-8"),
        updatedAt=user_data.updated_at
    )


@router.put(
    "/{user_id_hash}",
    response_model=SuccessResponse,
    responses={
        400: {"model": ErrorResponse, "description": "잘못된 요청"},
    }
)
async def save_user_data(
    user_id_hash: str,
    request: UserDataSaveRequest,
    db: AsyncSession = Depends(get_db)
) -> SuccessResponse:
    """Save user data.

    The server stores the encrypted blob as-is.
    The server cannot decrypt this data.
    """
    validate_user_id_hash(user_id_hash)

    # Decode Base64 to bytes
    try:
        encrypted_bytes = base64.b64decode(request.encryptedBlob)
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail={"error": "INVALID_DATA", "message": "잘못된 데이터 형식입니다."}
        ) from e

    try:
        # Check if user exists
        result = await db.execute(
            select(UserData).where(UserData.user_id_hash == user_id_hash)
        )
        existing = result.scalar_one_or_none()

        if existing:
            # Update existing
            existing.encrypted_blob = encrypted_bytes
        else:
            # Create new
            user_data = UserData(
                user_id_hash=user_id_hash,
                encrypted_blob=encrypted_bytes
            )
            db.add(user_data)

        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail={"error": "DATABASE_ERROR", "message": "데이터 저장 중 오류가 발생했습니다."}
        ) from e

    return SuccessResponse(success=True, message="저장되었습니다.")
