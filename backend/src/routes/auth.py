"""Authentication routes"""
from fastapi import APIRouter, Depends, HTTPException, status
from src.models.user import UserCreate, UserLogin, UserResponse, Token
from src.services import auth_service


router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    """Register a new user"""
    # TODO: Implement register endpoint
    pass


@router.post("/login", response_model=Token)
async def login(credentials: UserLogin):
    """Login with email and password"""
    # TODO: Implement login endpoint
    pass


@router.post("/google", response_model=Token)
async def google_login(id_token: str):
    """Login with Google OAuth"""
    # TODO: Implement Google login endpoint
    pass


@router.get("/me", response_model=UserResponse)
async def get_current_user():
    """Get current authenticated user"""
    # TODO: Implement get current user endpoint
    pass
