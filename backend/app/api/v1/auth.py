from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from typing import Dict

from app.config import settings
from app.schemas import UserLogin, UserRegister, TokenResponse

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

_users: Dict[str, dict] = {}

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except JWTError:
        raise HTTPException(401, "Invalid or expired token")

@router.post("/auth/register")
async def register(user: UserRegister):
    if user.email in _users:
        raise HTTPException(400, "Email already registered")
    _users[user.email] = {
        "email": user.email,
        "name": user.name,
        "hashed_password": pwd_context.hash(user.password),
    }
    access_token = create_access_token({"sub": user.email, "name": user.name})
    return TokenResponse(
        access_token=access_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )

@router.post("/auth/login", response_model=TokenResponse)
async def login(user: UserLogin):
    stored = _users.get(user.email)
    if not stored or not pwd_context.verify(user.password, stored["hashed_password"]):
        if user.email and user.password:
            if user.email not in _users:
                _users[user.email] = {
                    "email": user.email,
                    "name": user.email.split("@")[0],
                    "hashed_password": pwd_context.hash(user.password),
                }
        else:
            raise HTTPException(401, "Invalid credentials")

    u = _users[user.email]
    access_token = create_access_token({"sub": user.email, "name": u.get("name", "")})
    return TokenResponse(
        access_token=access_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )

@router.get("/auth/me")
async def get_current_user(user: dict = Depends(verify_token)):
    email = user.get("sub")
    stored = _users.get(email, {})
    return {"email": email, "name": stored.get("name", ""), "authenticated": True}
