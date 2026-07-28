import uuid
from datetime import date

from sqlalchemy import func as sqlfunc
from sqlalchemy.orm import Session

from app.models import Category, Entry


def _minor_to_float(amount_minor: int) -> float:
    return round(float(amount_minor) / 100, 2)


def trial_balance(db: Session, user_id: str, as_of: date | None) -> list[dict]:
    q = (
        db.query(
            Category.name,
            Category.type,
            sqlfunc.sum(Entry.amount_minor).label("total_minor"),
        )
        .join(Entry, Entry.category_id == Category.id)
        .filter(Entry.user_id == uuid.UUID(user_id))
    )
    if as_of:
        q = q.filter(Entry.entry_date <= as_of)
    results = q.group_by(Category.id, Category.name, Category.type).all()
    return [
        {"category": r.name, "type": r.type, "total": _minor_to_float(r.total_minor)}
        for r in results
    ]


def profit_and_loss(
    db: Session, user_id: str, start_date: date, end_date: date
) -> dict:
    q = (
        db.query(
            Category.name,
            Category.type,
            sqlfunc.sum(Entry.amount_minor).label("total_minor"),
        )
        .join(Entry, Entry.category_id == Category.id)
        .filter(
            Entry.user_id == uuid.UUID(user_id),
            Entry.entry_date >= start_date,
            Entry.entry_date <= end_date,
        )
        .group_by(Category.id, Category.name, Category.type)
        .all()
    )
    income = []
    expenses = []
    total_income = 0.0
    total_expenses = 0.0
    for r in q:
        total_val = _minor_to_float(r.total_minor)
        if r.type == "income":
            income.append({"category": r.name, "total": total_val})
            total_income += total_val
        elif r.type == "expense":
            expenses.append({"category": r.name, "total": total_val})
            total_expenses += total_val
    return {
        "period": {"start_date": start_date, "end_date": end_date},
        "income": income,
        "expenses": expenses,
        "total_income": round(total_income, 2),
        "total_expenses": round(total_expenses, 2),
        "net_profit": round(total_income - total_expenses, 2),
    }


def balance_sheet(db: Session, user_id: str, as_of: date) -> dict:
    q = (
        db.query(
            Category.name,
            Category.type,
            sqlfunc.sum(Entry.amount_minor).label("total_minor"),
        )
        .join(Entry, Entry.category_id == Category.id)
        .filter(
            Entry.user_id == uuid.UUID(user_id),
            Entry.entry_date <= as_of,
        )
        .group_by(Category.id, Category.name, Category.type)
        .all()
    )
    assets = []
    liabilities = []
    equity = []
    total_assets = 0.0
    total_liabilities_equity = 0.0
    for r in q:
        total_val = _minor_to_float(r.total_minor)
        if r.type == "asset":
            assets.append({"category": r.name, "total": total_val})
            total_assets += total_val
        elif r.type == "liability":
            liabilities.append({"category": r.name, "total": total_val})
            total_liabilities_equity += total_val
        elif r.type == "equity":
            equity.append({"category": r.name, "total": total_val})
            total_liabilities_equity += total_val
    return {
        "as_of": as_of,
        "assets": assets,
        "liabilities": liabilities,
        "equity": equity,
        "total_assets": round(total_assets, 2),
        "total_liabilities_and_equity": round(total_liabilities_equity, 2),
    }
