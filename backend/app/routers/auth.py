from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.schemas.pydantic_models import (
    LoginRequest,
    LoginResponse,
    UserRegisterRequest,
    UserResponse,
)
from app.services.auth_service import authenticate_user, create_access_token, register_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=201)
async def register(body: UserRegisterRequest, db: Session = Depends(get_db)):
    try:
        user = register_user(
            db=db,
            email=body.email,
            password=body.password,
            business_name=body.business_name,
            phone=body.phone,
            currency=body.currency,
        )
        return UserResponse(
            user_id=user.id, email=user.email, business_name=user.business_name,
            phone=user.phone, currency=user.currency,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))


@router.post("/login", response_model=LoginResponse)
async def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db=db, email=body.email, password=body.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    token = create_access_token(str(user.id))
    return LoginResponse(
        access_token=token, token_type="bearer",
        email=user.email, business_name=user.business_name,
        phone=user.phone, currency=user.currency,
    )
