import uuid
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models import Category, Entry
from app.schemas.pydantic_models import (
    DeleteResponse,
    EntryCreateRequest,
    EntryResponse,
    EntryUpdateRequest,
)
from app.services.entry_service import (
    amount_from_minor,
    amount_to_minor,
)

router = APIRouter(prefix="/entries", tags=["entries"])


def _entry_to_response(e: Entry) -> EntryResponse:
    return EntryResponse(
        id=e.id,
        user_id=e.user_id,
        category_id=e.category_id,
        entry_type=e.entry_type,
        amount_minor=e.amount_minor,
        currency=e.currency,
        entry_date=e.entry_date,
        description=e.description,
        source=e.source,
        contact_name=e.contact_name,
        contact_type=e.contact_type,
        created_at=e.created_at,
        updated_at=e.updated_at,
    )


@router.post("", response_model=EntryResponse, status_code=201)
async def create_entry(
    body: EntryCreateRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    user_uuid = uuid.UUID(user_id)
    cat = db.query(Category).filter(
        Category.id == body.category_id, Category.user_id == user_uuid
    ).first()
    if not cat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )
    entry = Entry(
        id=uuid.uuid4(),
        user_id=user_uuid,
        category_id=body.category_id,
        entry_type=body.entry_type,
        amount_minor=amount_to_minor(body.amount),
        currency="PKR",
        entry_date=body.entry_date,
        description=body.description,
        source=body.source,
        contact_name=body.contact_name,
        contact_type=body.contact_type,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return _entry_to_response(entry)


@router.get("", response_model=list[EntryResponse])
async def list_entries(
    start_date: str | None = Query(None),
    end_date: str | None = Query(None),
    category_id: uuid.UUID | None = Query(None),
    entry_type: str | None = Query(None),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    q = db.query(Entry).filter(Entry.user_id == uuid.UUID(user_id))
    if start_date:
        q = q.filter(Entry.entry_date >= date.fromisoformat(start_date))
    if end_date:
        q = q.filter(Entry.entry_date <= date.fromisoformat(end_date))
    if category_id:
        q = q.filter(Entry.category_id == category_id)
    if entry_type:
        q = q.filter(Entry.entry_type == entry_type)
    return [_entry_to_response(e) for e in q.order_by(Entry.entry_date.desc()).all()]


@router.patch("/{entry_id}", response_model=EntryResponse)
async def update_entry(
    entry_id: uuid.UUID,
    body: EntryUpdateRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    entry = db.query(Entry).filter(
        Entry.id == entry_id, Entry.user_id == uuid.UUID(user_id)
    ).first()
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found")
    if body.entry_type is not None:
        entry.entry_type = body.entry_type
    if body.category_id is not None:
        cat = db.query(Category).filter(
            Category.id == body.category_id, Category.user_id == uuid.UUID(user_id)
        ).first()
        if not cat:
            raise HTTPException(status_code=404, detail="Category not found")
        entry.category_id = body.category_id
    if body.amount is not None:
        entry.amount_minor = amount_to_minor(body.amount)
    if body.entry_date is not None:
        entry.entry_date = body.entry_date
    if body.description is not None:
        entry.description = body.description
    if body.contact_name is not None:
        entry.contact_name = body.contact_name
    if body.contact_type is not None:
        entry.contact_type = body.contact_type
    db.commit()
    db.refresh(entry)
    return _entry_to_response(entry)


@router.delete("/{entry_id}", response_model=DeleteResponse)
async def delete_entry(
    entry_id: uuid.UUID,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    entry = db.query(Entry).filter(
        Entry.id == entry_id, Entry.user_id == uuid.UUID(user_id)
    ).first()
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found")
    db.delete(entry)
    db.commit()
    return DeleteResponse(deleted=True)
