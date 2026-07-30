from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.schemas.pydantic_models import (
    AgeingItem,
    AgeingResponse,
    BalanceSheetResponse,
    CategoryTotal,
    MonthlyAuditRequest,
    MonthlyAuditResponse,
    PeriodRange,
    ProfitLossResponse,
    TrialBalanceItem,
)
from app.services import audit_service, report_service

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/trial-balance", response_model=list[TrialBalanceItem])
async def trial_balance(
    as_of: str | None = Query(None),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    as_of_date = date.fromisoformat(as_of) if as_of else None
    results = report_service.trial_balance(db=db, user_id=user_id, as_of=as_of_date)
    return [TrialBalanceItem(**r) for r in results]


@router.get("/profit-and-loss", response_model=ProfitLossResponse)
async def profit_and_loss(
    start_date: str = Query(),
    end_date: str = Query(),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    try:
        sd = date.fromisoformat(start_date)
        ed = date.fromisoformat(end_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")
    result = report_service.profit_and_loss(db=db, user_id=user_id, start_date=sd, end_date=ed)
    return ProfitLossResponse(
        period=PeriodRange(start_date=sd, end_date=ed),
        income=[CategoryTotal(**i) for i in result["income"]],
        expenses=[CategoryTotal(**e) for e in result["expenses"]],
        total_income=result["total_income"],
        total_expenses=result["total_expenses"],
        net_profit=result["net_profit"],
    )


@router.get("/balance-sheet", response_model=BalanceSheetResponse)
async def balance_sheet(
    as_of: str = Query(),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    try:
        as_of_date = date.fromisoformat(as_of)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")
    result = report_service.balance_sheet(db=db, user_id=user_id, as_of=as_of_date)
    return BalanceSheetResponse(
        as_of=as_of_date,
        assets=[CategoryTotal(**a) for a in result["assets"]],
        liabilities=[CategoryTotal(**l) for l in result["liabilities"]],
        equity=[CategoryTotal(**e) for e in result["equity"]],
        total_assets=result["total_assets"],
        total_liabilities_and_equity=result["total_liabilities_and_equity"],
    )


@router.get("/ageing", response_model=AgeingResponse)
async def ageing_report(
    as_of: str | None = Query(None),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    as_of_date = date.fromisoformat(as_of) if as_of else date.today()
    result = report_service.ageing(db=db, user_id=user_id, as_of=as_of_date)
    return AgeingResponse(
        as_of=as_of_date,
        customers=[AgeingItem(**c) for c in result["customers"]],
        vendors=[AgeingItem(**v) for v in result["vendors"]],
        total_receivables=result["total_receivables"],
        total_payables=result["total_payables"],
    )


@router.post("/monthly-audit", response_model=MonthlyAuditResponse)
async def monthly_audit(
    body: MonthlyAuditRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    result = audit_service.run_audit(db=db, user_id=user_id, month=body.month)
    return MonthlyAuditResponse(
        month=result["month"],
        flags=result["flags"],
        entries_reviewed=result["entries_reviewed"],
    )
