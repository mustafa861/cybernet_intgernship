import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models import Category
from app.schemas.pydantic_models import CategoryCreateRequest, CategoryResponse

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("", response_model=list[CategoryResponse])
async def list_categories(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    categories = (
        db.query(Category)
        .filter(Category.user_id == uuid.UUID(user_id))
        .all()
    )
    return [
        CategoryResponse(id=c.id, name=c.name, type=c.type)
        for c in categories
    ]


@router.post("", response_model=CategoryResponse, status_code=201)
async def create_category(
    body: CategoryCreateRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    existing = (
        db.query(Category)
        .filter(
            Category.user_id == uuid.UUID(user_id),
            Category.name == body.name,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Category '{body.name}' already exists",
        )
    category = Category(
        id=uuid.uuid4(),
        user_id=uuid.UUID(user_id),
        name=body.name,
        type=body.type,
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return CategoryResponse(id=category.id, name=category.name, type=category.type)
