import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field


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


class UserResponse(BaseModel):
    user_id: uuid.UUID
    email: str
    business_name: str


class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    email: str
    business_name: str


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


class EntryCreateRequest(BaseModel):
    entry_type: str = Field(pattern=r"^(expense|income)$")
    category_id: uuid.UUID
    amount: float = Field(gt=0, lt=1_000_000_000)
    entry_date: date
    description: str | None = None
    source: str = Field(default="manual", pattern=r"^(manual|ai_agent)$")


class EntryUpdateRequest(BaseModel):
    entry_type: str | None = Field(default=None, pattern=r"^(expense|income)$")
    category_id: uuid.UUID | None = None
    amount: float | None = Field(default=None, gt=0, lt=1_000_000_000)
    entry_date: date | None = None
    description: str | None = None


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
    created_at: datetime
    updated_at: datetime


class DeleteResponse(BaseModel):
    deleted: bool = True


class TrialBalanceItem(BaseModel):
    category: str
    type: str
    total: float


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


class ChatResponse(BaseModel):
    conversation_id: uuid.UUID
    reply: str
    actions_taken: list[ActionTaken]
