import uuid
from datetime import date

from sqlalchemy.orm import Session

from app.models import Entry


_CURRENCY_MULTIPLIERS: dict[str, int] = {
    "PKR": 100,
    "USD": 100,
    "EUR": 100,
    "GBP": 100,
    "INR": 100,
}


def amount_to_minor(amount: float, currency: str = "PKR") -> int:
    mult = _CURRENCY_MULTIPLIERS.get(currency, 100)
    return int(round(amount * mult))


def amount_from_minor(amount_minor: int, currency: str = "PKR") -> float:
    mult = _CURRENCY_MULTIPLIERS.get(currency, 100)
    return round(amount_minor / mult, 2)


def create_entry(
    db: Session,
    user_id: str,
    category_id: str,
    entry_type: str,
    amount: float,
    entry_date: date,
    source: str,
    description: str | None = None,
    currency: str = "PKR",
    attachment_url: str | None = None,
) -> Entry:
    entry = Entry(
        id=uuid.uuid4(),
        user_id=uuid.UUID(user_id),
        category_id=uuid.UUID(category_id),
        entry_type=entry_type,
        amount_minor=amount_to_minor(amount, currency),
        currency=currency,
        entry_date=entry_date,
        description=description,
        source=source,
        attachment_url=attachment_url,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def list_entries(
    db: Session,
    user_id: str,
    start_date: date | None = None,
    end_date: date | None = None,
    category_id: str | None = None,
    entry_type: str | None = None,
) -> list[Entry]:
    q = db.query(Entry).filter(Entry.user_id == uuid.UUID(user_id))
    if start_date:
        q = q.filter(Entry.entry_date >= start_date)
    if end_date:
        q = q.filter(Entry.entry_date <= end_date)
    if category_id:
        q = q.filter(Entry.category_id == uuid.UUID(category_id))
    if entry_type:
        q = q.filter(Entry.entry_type == entry_type)
    return q.order_by(Entry.entry_date.desc()).all()


def get_entry(db: Session, entry_id: str, user_id: str) -> Entry | None:
    return (
        db.query(Entry)
        .filter(Entry.id == uuid.UUID(entry_id), Entry.user_id == uuid.UUID(user_id))
        .first()
    )


def update_entry(
    db: Session,
    entry: Entry,
    category_id: str | None = None,
    entry_type: str | None = None,
    amount: float | None = None,
    entry_date: date | None = None,
    description: str | None = None,
) -> Entry:
    if category_id is not None:
        entry.category_id = uuid.UUID(category_id)
    if entry_type is not None:
        entry.entry_type = entry_type
    if amount is not None:
        entry.amount_minor = amount_to_minor(amount, entry.currency)
    if entry_date is not None:
        entry.entry_date = entry_date
    if description is not None:
        entry.description = description
    db.commit()
    db.refresh(entry)
    return entry


def delete_entry(db: Session, entry: Entry) -> None:
    db.delete(entry)
    db.commit()
