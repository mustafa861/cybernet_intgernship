import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field, field_validator


class ErrorDetail(BaseModel):
    code: str
    message: str
    field_errors: dict | None = None


class ErrorResponse(BaseModel):
    error: ErrorDetail


class UserRegisterRequest(BaseModel):
    email: str
    password: str
    business_name: str
    phone: str
    currency: str = "PKR"


class UserResponse(BaseModel):
    user_id: uuid.UUID
    email: str
    business_name: str
    phone: str | None = None
    currency: str | None = None


class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    email: str
    business_name: str
    phone: str | None = None
    currency: str | None = None


class CategoryResponse(BaseModel):
    id: uuid.UUID
    name: str
    type: str
    parent_id: uuid.UUID | None = None
    children: list["CategoryResponse"] = []

    model_config = {"from_attributes": True}


class CategoryCreateRequest(BaseModel):
    name: str
    type: str = Field(pattern=r"^(expense|income|asset|liability|equity)$")
    parent_id: uuid.UUID | None = None

    @field_validator("type", mode="before")
    @classmethod
    def _normalize_type(cls, v: object) -> object:
        return v.lower() if isinstance(v, str) else v


class EntryCreateRequest(BaseModel):
    entry_type: str = Field(pattern=r"^(expense|income|asset|liability|equity)$")
    category_id: uuid.UUID
    amount: float = Field(gt=0, lt=1_000_000_000)
    entry_date: date
    description: str | None = None
    source: str = Field(default="manual", pattern=r"^(manual|ai_agent)$")
    contact_name: str | None = None
    contact_type: str | None = Field(default=None, pattern=r"^(customer|vendor)$")
    attachment_url: str | None = None


class EntryUpdateRequest(BaseModel):
    entry_type: str | None = Field(default=None, pattern=r"^(expense|income|asset|liability|equity)$")
    category_id: uuid.UUID | None = None
    amount: float | None = Field(default=None, gt=0, lt=1_000_000_000)
    entry_date: date | None = None
    description: str | None = None
    contact_name: str | None = None
    contact_type: str | None = Field(default=None, pattern=r"^(customer|vendor)$")
    attachment_url: str | None = None


class EntryResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    category_id: uuid.UUID
    entry_type: str
    amount_minor: int
    currency: str
    entry_date: date
    description: str | None
    source: str
    contact_name: str | None = None
    contact_type: str | None = None
    attachment_url: str | None = None
    created_at: datetime
    updated_at: datetime


class DeleteResponse(BaseModel):
    deleted: bool = True


class TrialBalanceItem(BaseModel):
    category: str
    type: str
    total: float


class RecurringEntryCreateRequest(BaseModel):
    category_id: uuid.UUID
    entry_type: str = Field(pattern=r"^(expense|income|asset|liability|equity)$")
    amount: float = Field(gt=0, lt=1_000_000_000)
    description: str | None = None
    frequency: str = Field(pattern=r"^(weekly|monthly)$")
    end_date: date | None = None
    next_run_date: date


class RecurringEntryResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    category_id: uuid.UUID
    entry_type: str
    amount_minor: int
    description: str | None = None
    frequency: str
    end_date: date | None = None
    next_run_date: date
    created_at: datetime

    model_config = {"from_attributes": True}


class RecurringEntryProcessResponse(BaseModel):
    entries_created: int
    details: list[str]


class PeriodRange(BaseModel):
    start_date: date
    end_date: date


class CategoryTotal(BaseModel):
    category: str
    total: float


class ProfitLossResponse(BaseModel):
    period: PeriodRange
    income: list[CategoryTotal]
    expenses: list[CategoryTotal]
    total_income: float
    total_expenses: float
    net_profit: float


class BalanceSheetResponse(BaseModel):
    as_of: date
    assets: list[CategoryTotal]
    liabilities: list[CategoryTotal]
    equity: list[CategoryTotal]
    total_assets: float
    total_liabilities_and_equity: float


class MonthlyAuditRequest(BaseModel):
    month: date


class AuditFlagItem(BaseModel):
    entry_id: uuid.UUID
    reason: str
    severity: str


class MonthlyAuditResponse(BaseModel):
    month: date
    flags: list[AuditFlagItem]
    entries_reviewed: int


class ConversationSummary(BaseModel):
    id: uuid.UUID
    title: str
    created_at: datetime
    updated_at: datetime
    message_count: int = 0


class ChatMessageResponse(BaseModel):
    id: uuid.UUID
    role: str
    content: str
    created_at: datetime


class ConversationDetail(BaseModel):
    id: uuid.UUID
    title: str
    created_at: datetime
    updated_at: datetime
    messages: list[ChatMessageResponse]


class ChatRequest(BaseModel):
    message: str
    conversation_id: uuid.UUID | None = None


class ActionTaken(BaseModel):
    tool: str
    input: dict
    result_summary: str


class CashFlowResponse(BaseModel):
    period: PeriodRange
    operating_inflow: list[CategoryTotal]
    operating_outflow: list[CategoryTotal]
    total_operating_inflow: float
    total_operating_outflow: float
    net_cash_flow: float


class AgeingItem(BaseModel):
    contact_name: str
    total: float
    current: float
    days_31_60: float
    days_60_plus: float


class AgeingResponse(BaseModel):
    as_of: date
    customers: list[AgeingItem]
    vendors: list[AgeingItem]
    total_receivables: float
    total_payables: float


class ChatResponse(BaseModel):
    conversation_id: uuid.UUID
    reply: str
    actions_taken: list[ActionTaken]
