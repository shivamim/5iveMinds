from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from app.database import get_async_db
from app.schemas import UserCreate, UserResponse, Token

router = APIRouter()

@router.post("/register", response_model=UserResponse)
async def register(user: UserCreate, db: AsyncSession = Depends(get_async_db)):
    """Register a new user (Stub)."""
    return UserResponse(id=uuid.uuid4(), email=user.email, username=user.username)

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Login and get JWT token (Stub)."""
    return Token(access_token="fake-super-secret-token-for-dev", token_type="bearer")

@router.get("/me", response_model=UserResponse)
async def read_users_me():
    """Get current user profile (Stub)."""
    return UserResponse(id=uuid.uuid4(), email="demo@fiveminds.com", username="demo_user")
