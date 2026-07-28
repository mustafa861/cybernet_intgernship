import uuid
from datetime import date, timedelta

from sqlalchemy import func as sqlfunc
from sqlalchemy.orm import Session

from app.models import AuditFlag, Category, Entry

MISC_CATEGORY_NAMES = ["Miscellaneous", "Misc", "Other", "General"]
DESCRIPTION_THRESHOLD_MINOR = 1_000_000  # 10,000 PKR in paisa


def run_audit(db: Session, user_id: str, month: date) -> dict:
    user_uuid = uuid.UUID(user_id)
    month_start = month.replace(day=1)
    if month_start.month == 12:
        month_end = month_start.replace(year=month_start.year + 1, month=1)
    else:
        month_end = month_start.replace(month=month_start.month + 1)

    entries = (
        db.query(Entry)
        .filter(
            Entry.user_id == user_uuid,
            Entry.entry_date >= month_start,
            Entry.entry_date < month_end,
        )
        .all()
    )

    # clear previous flags for this month
    db.query(AuditFlag).filter(
        AuditFlag.entry_id.in_(
            db.query(Entry.id).filter(
                Entry.user_id == user_uuid,
                Entry.entry_date >= month_start,
                Entry.entry_date < month_end,
            )
        )
    ).delete(synchronize_session=False)

    flags: list[dict] = []

    if len(entries) < 5:
        skip_outlier = True
    else:
        skip_outlier = False

    seen: dict[tuple, list] = {}
    for e in entries:
        key = (e.amount_minor, e.category_id, e.entry_date)
        seen.setdefault(key, []).append(e)

    dup_flagged = set()
    for key, group in seen.items():
        if len(group) > 1:
            for dup in group[1:]:
                if dup.id not in dup_flagged:
                    flags.append(
                        {
                            "entry_id": dup.id,
                            "reason": "Possible duplicate entry — same amount, category, and date",
                            "severity": "medium",
                        }
                    )
                    dup_flagged.add(dup.id)

    for e in entries:
        if (
            e.entry_type == "expense"
            and e.amount_minor > DESCRIPTION_THRESHOLD_MINOR
            and not e.description
        ):
            flags.append(
                {
                    "entry_id": e.id,
                    "reason": f"Large expense ({e.amount_minor / 100:.2f}) missing a description",
                    "severity": "low",
                }
            )

    if not skip_outlier:
        six_months_ago = month_start - timedelta(days=180)
        for e in entries:
            avg_result = (
                db.query(sqlfunc.avg(Entry.amount_minor))
                .filter(
                    Entry.user_id == user_uuid,
                    Entry.category_id == e.category_id,
                    Entry.entry_date >= six_months_ago,
                    Entry.entry_date < e.entry_date,
                )
                .scalar()
            )
            if avg_result and e.amount_minor > 3 * avg_result:
                flags.append(
                    {
                        "entry_id": e.id,
                        "reason": "Amount is unusually high for this category",
                        "severity": "medium",
                    }
                )

    if entries:
        misc_count = 0
        for e in entries:
            cat = db.query(Category).filter(Category.id == e.category_id).first()
            if cat and cat.name in MISC_CATEGORY_NAMES:
                misc_count += 1
        if misc_count > 0 and (misc_count / len(entries)) > 0.2:
            flags.append(
                {
                    "entry_id": entries[0].id,
                    "reason": f"Over 20% of entries ({misc_count}/{len(entries)}) are under a generic 'Miscellaneous' category",
                    "severity": "low",
                }
            )

    for f in flags:
        flag = AuditFlag(
            id=uuid.uuid4(),
            entry_id=f["entry_id"],
            month=month_start,
            reason=f["reason"],
            severity=f["severity"],
        )
        db.add(flag)
    db.commit()

    return {
        "month": month_start,
        "flags": [
            {"entry_id": str(f["entry_id"]), "reason": f["reason"], "severity": f["severity"]}
            for f in flags
        ],
        "entries_reviewed": len(entries),
    }
