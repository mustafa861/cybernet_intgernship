import uuid
from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models import Category, Entry, RecurringEntry
from app.schemas.pydantic_models import (
    RecurringEntryCreateRequest,
    RecurringEntryProcessResponse,
    RecurringEntryResponse,
    DeleteResponse,
)
from app.services.entry_service import amount_to_minor

router = APIRouter(prefix="/recurring-entries", tags=["recurring-entries"])


@router.post("", response_model=RecurringEntryResponse, status_code=201)
async def create_recurring_entry(
    body: RecurringEntryCreateRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    user_uuid = uuid.UUID(user_id)
    cat = db.query(Category).filter(
        Category.id == body.category_id, Category.user_id == user_uuid
    ).first()
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    entry = RecurringEntry(
        id=uuid.uuid4(),
        user_id=user_uuid,
        category_id=body.category_id,
        entry_type=body.entry_type,
        amount_minor=amount_to_minor(body.amount),
        description=body.description,
        frequency=body.frequency,
        end_date=body.end_date,
        next_run_date=body.next_run_date,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.get("", response_model=list[RecurringEntryResponse])
async def list_recurring_entries(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    return (
        db.query(RecurringEntry)
        .filter(RecurringEntry.user_id == uuid.UUID(user_id))
        .order_by(RecurringEntry.next_run_date.asc())
        .all()
    )


@router.delete("/{entry_id}", response_model=DeleteResponse)
async def delete_recurring_entry(
    entry_id: uuid.UUID,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    entry = db.query(RecurringEntry).filter(
        RecurringEntry.id == entry_id, RecurringEntry.user_id == uuid.UUID(user_id)
    ).first()
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recurring entry not found")
    db.delete(entry)
    db.commit()
    return DeleteResponse(deleted=True)


@router.post("/process", response_model=RecurringEntryProcessResponse)
async def process_recurring_entries(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    user_uuid = uuid.UUID(user_id)
    today = date.today()
    due = (
        db.query(RecurringEntry)
        .filter(
            RecurringEntry.user_id == user_uuid,
            RecurringEntry.next_run_date <= today,
        )
        .all()
    )
    created_count = 0
    details: list[str] = []
    for re in due:
        if re.end_date and re.end_date < today:
            continue
        entry = Entry(
            id=uuid.uuid4(),
            user_id=user_uuid,
            category_id=re.category_id,
            entry_type=re.entry_type,
            amount_minor=re.amount_minor,
            currency="PKR",
            entry_date=today,
            description=re.description,
            source="manual",
        )
        db.add(entry)
        created_count += 1
        details.append(f"Created {re.entry_type} entry for {re.description or 'untitled'} (${re.amount_minor / 100:.2f})")
        if re.frequency == "weekly":
            re.next_run_date += timedelta(weeks=1)
        elif re.frequency == "monthly":
            month = re.next_run_date.month + 1
            year = re.next_run_date.year
            if month > 12:
                month = 1
                year += 1
            try:
                re.next_run_date = re.next_run_date.replace(year=year, month=month)
            except ValueError:
                re.next_run_date = re.next_run_date.replace(year=year, month=month, day=28)
    db.commit()
    return RecurringEntryProcessResponse(entries_created=created_count, details=details)
