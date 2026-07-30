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


def cash_flow(db: Session, user_id: str, start_date: date, end_date: date) -> dict:
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
    operating_in = []
    operating_out = []
    total_in = 0.0
    total_out = 0.0
    for r in q:
        val = _minor_to_float(r.total_minor)
        if r.type == "income":
            operating_in.append({"category": r.name, "total": val})
            total_in += val
        elif r.type == "expense":
            operating_out.append({"category": r.name, "total": val})
            total_out += val
    net = round(total_in - total_out, 2)
    return {
        "period": {"start_date": start_date, "end_date": end_date},
        "operating_inflow": operating_in,
        "operating_outflow": operating_out,
        "total_operating_inflow": round(total_in, 2),
        "total_operating_outflow": round(total_out, 2),
        "net_cash_flow": net,
    }


def ageing(db: Session, user_id: str, as_of: date) -> dict:
    entries = (
        db.query(Entry)
        .filter(
            Entry.user_id == uuid.UUID(user_id),
            Entry.contact_name.isnot(None),
            Entry.contact_type.isnot(None),
        )
        .all()
    )

    buckets: dict[str, dict] = {}
    for e in entries:
        key = f"{e.contact_type}:{e.contact_name}"
        if key not in buckets:
            buckets[key] = {
                "contact_name": e.contact_name,
                "contact_type": e.contact_type,
                "total": 0.0,
                "current": 0.0,
                "days_31_60": 0.0,
                "days_60_plus": 0.0,
            }
        days_overdue = (as_of - e.entry_date).days
        amount = _minor_to_float(e.amount_minor)

        if e.entry_type == "income":
            # AR: customer owes us money
            buckets[key]["total"] += amount
            if days_overdue <= 30:
                buckets[key]["current"] += amount
            elif days_overdue <= 60:
                buckets[key]["days_31_60"] += amount
            else:
                buckets[key]["days_60_plus"] += amount
        elif e.entry_type == "expense":
            # AP: we owe money to vendor
            buckets[key]["total"] += amount
            if days_overdue <= 30:
                buckets[key]["current"] += amount
            elif days_overdue <= 60:
                buckets[key]["days_31_60"] += amount
            else:
                buckets[key]["days_60_plus"] += amount

    customers = []
    vendors = []
    total_receivables = 0.0
    total_payables = 0.0
    for b in buckets.values():
        item = {
            "contact_name": b["contact_name"],
            "total": round(b["total"], 2),
            "current": round(b["current"], 2),
            "days_31_60": round(b["days_31_60"], 2),
            "days_60_plus": round(b["days_60_plus"], 2),
        }
        if b["contact_type"] == "customer":
            customers.append(item)
            total_receivables += b["total"]
        else:
            vendors.append(item)
            total_payables += b["total"]

    return {
        "as_of": as_of,
        "customers": customers,
        "vendors": vendors,
        "total_receivables": round(total_receivables, 2),
        "total_payables": round(total_payables, 2),
    }
