import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models import Category
from app.schemas.pydantic_models import CategoryCreateRequest, CategoryResponse

router = APIRouter(prefix="/categories", tags=["categories"])


def _build_tree(categories: list[Category]) -> list[CategoryResponse]:
    by_id: dict[uuid.UUID, CategoryResponse] = {}
    roots: list[CategoryResponse] = []
    for c in categories:
        cr = CategoryResponse(
            id=c.id,
            name=c.name,
            type=c.type,
            parent_id=c.parent_id,
            children=[],
        )
        by_id[c.id] = cr
    for c in categories:
        cr = by_id[c.id]
        if cr.parent_id and cr.parent_id in by_id:
            by_id[cr.parent_id].children.append(cr)
        else:
            roots.append(cr)
    return roots


@router.get("", response_model=list[CategoryResponse])
async def list_categories(
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user),
):
    categories = (
        db.query(Category)
        .filter(Category.user_id == user_id)
        .all()
    )
    return _build_tree(categories)


@router.post("", response_model=CategoryResponse, status_code=201)
async def create_category(
    body: CategoryCreateRequest,
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user),
):
    existing = (
        db.query(Category)
        .filter(
            Category.user_id == user_id,
            Category.name == body.name,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Category '{body.name}' already exists",
        )

    if body.parent_id:
        parent = (
            db.query(Category)
            .filter(
                Category.id == body.parent_id,
                Category.user_id == user_id,
            )
            .first()
        )
        if not parent:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Parent category not found",
            )

    category = Category(
        id=uuid.uuid4(),
        user_id=user_id,
        name=body.name,
        type=body.type,
        parent_id=body.parent_id,
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return CategoryResponse(
        id=category.id,
        name=category.name,
        type=category.type,
        parent_id=category.parent_id,
        children=[],
    )
