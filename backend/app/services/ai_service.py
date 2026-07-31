import json
import os
import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.services import audit_service, entry_service, report_service


def _parse_date(s: str) -> date:
    if len(s) == 7 and s.count("-") == 1:
        s += "-01"
    return date.fromisoformat(s)


class ToolCall(BaseModel):
    tool: str
    input: dict
    result_summary: str


class Tool:
    def __init__(self, name: str, description: str, params_schema: type[BaseModel]):
        self.name = name
        self.description = description
        self.params_schema = params_schema

    def execute(self, db: Session, user_id: str, **kwargs) -> str:
        raise NotImplementedError


class CreateEntryTool(Tool):
    def __init__(self):
        class Params(BaseModel):
            entry_type: str = Field(pattern=r"^(expense|income|asset|liability|equity)$")
            category_id: str
            amount: float = Field(gt=0)
            entry_date: str
            description: str | None = None
            source: str = "manual"

        super().__init__(
            name="create_entry",
            description="Add an expense or income entry",
            params_schema=Params,
        )

    def execute(self, db: Session, user_id: str, **kwargs) -> str:
        params = self.params_schema(**kwargs)
        entry = entry_service.create_entry(
            db=db,
            user_id=user_id,
            category_id=params.category_id,
            entry_type=params.entry_type,
            amount=params.amount,
            entry_date=_parse_date(params.entry_date),
            source=params.source,
            description=params.description,
        )
        return (
            f"Created {params.entry_type} entry: {params.amount:.2f} on {params.entry_date}"
        )


class UpdateEntryTool(Tool):
    def __init__(self):
        class Params(BaseModel):
            entry_id: str
            entry_type: str | None = Field(
                default=None, pattern=r"^(expense|income|asset|liability|equity)$"
            )
            category_id: str | None = None
            amount: float | None = Field(default=None, gt=0)
            entry_date: str | None = None
            description: str | None = None

        super().__init__(
            name="update_entry",
            description="Edit an existing entry",
            params_schema=Params,
        )

    def execute(self, db: Session, user_id: str, **kwargs) -> str:
        params = self.params_schema(**kwargs)
        entry = entry_service.get_entry(db, params.entry_id, user_id)
        if not entry:
            return f"Entry {params.entry_id} not found"
        entry_service.update_entry(
            db=db,
            entry=entry,
            category_id=params.category_id,
            entry_type=params.entry_type,
            amount=params.amount,
            entry_date=_parse_date(params.entry_date) if params.entry_date else None,
            description=params.description,
        )
        return f"Updated entry {params.entry_id}"


class DeleteEntryTool(Tool):
    def __init__(self):
        class Params(BaseModel):
            entry_id: str

        super().__init__(
            name="delete_entry",
            description="Remove an entry",
            params_schema=Params,
        )

    def execute(self, db: Session, user_id: str, **kwargs) -> str:
        params = self.params_schema(**kwargs)
        entry = entry_service.get_entry(db, params.entry_id, user_id)
        if not entry:
            return f"Entry {params.entry_id} not found"
        entry_service.delete_entry(db, entry)
        return f"Deleted entry {params.entry_id}"


class ListEntriesTool(Tool):
    def __init__(self):
        class Params(BaseModel):
            start_date: str | None = None
            end_date: str | None = None
            category_id: str | None = None
            entry_type: str | None = None

        super().__init__(
            name="list_entries",
            description="Look up entries by filters",
            params_schema=Params,
        )

    def execute(self, db: Session, user_id: str, **kwargs) -> str:
        params = self.params_schema(**kwargs)
        entries = entry_service.list_entries(
            db=db,
            user_id=user_id,
            start_date=_parse_date(params.start_date) if params.start_date else None,
            end_date=_parse_date(params.end_date) if params.end_date else None,
            category_id=params.category_id,
            entry_type=params.entry_type,
        )
        return f"Found {len(entries)} entries" + (f": {', '.join(str(e.id) for e in entries[:5])}" if entries else "")


class GenerateProfitLossTool(Tool):
    def __init__(self):
        class Params(BaseModel):
            start_date: str
            end_date: str

        super().__init__(
            name="generate_profit_and_loss",
            description="Produce a P&L for a period",
            params_schema=Params,
        )

    def execute(self, db: Session, user_id: str, **kwargs) -> str:
        params = self.params_schema(**kwargs)
        result = report_service.profit_and_loss(
            db=db,
            user_id=user_id,
            start_date=_parse_date(params.start_date),
            end_date=_parse_date(params.end_date),
        )
        return (
            f"P&L from {params.start_date} to {params.end_date}: "
            f"income={result['total_income']}, expenses={result['total_expenses']}, "
            f"net_profit={result['net_profit']}"
        )


class GenerateBalanceSheetTool(Tool):
    def __init__(self):
        class Params(BaseModel):
            as_of: str

        super().__init__(
            name="generate_balance_sheet",
            description="Produce a Balance Sheet as of a date",
            params_schema=Params,
        )

    def execute(self, db: Session, user_id: str, **kwargs) -> str:
        params = self.params_schema(**kwargs)
        result = report_service.balance_sheet(
            db=db,
            user_id=user_id,
            as_of=_parse_date(params.as_of),
        )
        return (
            f"Balance Sheet as of {params.as_of}: "
            f"assets={result['total_assets']}, "
            f"liabilities+equity={result['total_liabilities_and_equity']}"
        )


class GenerateTrialBalanceTool(Tool):
    def __init__(self):
        class Params(BaseModel):
            as_of: str | None = None

        super().__init__(
            name="generate_trial_balance",
            description="Produce a trial balance",
            params_schema=Params,
        )

    def execute(self, db: Session, user_id: str, **kwargs) -> str:
        params = self.params_schema(**kwargs)
        result = report_service.trial_balance(
            db=db,
            user_id=user_id,
            as_of=_parse_date(params.as_of) if params.as_of else None,
        )
        return f"Trial balance: {len(result)} categories"


class RunMonthlyAuditTool(Tool):
    def __init__(self):
        class Params(BaseModel):
            month: str

        super().__init__(
            name="run_monthly_audit",
            description="Run anomaly detection for a month",
            params_schema=Params,
        )

    def execute(self, db: Session, user_id: str, **kwargs) -> str:
        params = self.params_schema(**kwargs)
        result = audit_service.run_audit(
            db=db,
            user_id=user_id,
            month=_parse_date(params.month),
        )
        return (
            f"Audited {result['entries_reviewed']} entries, "
            f"found {len(result['flags'])} flags"
        )


class SummarizeSpendingTool(Tool):
    def __init__(self):
        class Params(BaseModel):
            start_date: str | None = None
            end_date: str | None = None
            category_id: str | None = None

        super().__init__(
            name="summarize_spending",
            description="Answer ad-hoc spending questions",
            params_schema=Params,
        )

    def execute(self, db: Session, user_id: str, **kwargs) -> str:
        params = self.params_schema(**kwargs)
        entries = entry_service.list_entries(
            db=db,
            user_id=user_id,
            start_date=_parse_date(params.start_date) if params.start_date else None,
            end_date=_parse_date(params.end_date) if params.end_date else None,
            category_id=params.category_id,
        )
        total = sum(e.amount_minor for e in entries) / 100
        count = len(entries)
        return f"Found {count} entries totaling {total:.2f}"


class CreateCategoryTool(Tool):
    def __init__(self):
        class Params(BaseModel):
            name: str
            category_type: str = Field(pattern=r"^(expense|income)$")

        super().__init__(
            name="create_category",
            description="Create a new income or expense category",
            params_schema=Params,
        )

    def execute(self, db: Session, user_id: str, **kwargs) -> str:
        params = self.params_schema(**kwargs)
        import uuid
        from app.models import Category
        existing = (
            db.query(Category)
            .filter(
                Category.user_id == uuid.UUID(user_id),
                Category.name == params.name,
            )
            .first()
        )
        if existing:
            return f"Category '{params.name}' already exists (id={existing.id})"
        category = Category(
            id=uuid.uuid4(),
            user_id=uuid.UUID(user_id),
            name=params.name,
            type=params.category_type,
        )
        db.add(category)
        db.commit()
        return f"Created {params.category_type} category '{params.name}' (id={category.id})"


class ListCategoriesTool(Tool):
    def __init__(self):
        class Params(BaseModel):
            category_type: str | None = Field(
                default=None, pattern=r"^(expense|income)$"
            )

        super().__init__(
            name="list_categories",
            description="List all categories, optionally filtered by type (income/expense)",
            params_schema=Params,
        )

    def execute(self, db: Session, user_id: str, **kwargs) -> str:
        params = self.params_schema(**kwargs)
        import uuid
        from app.models import Category
        q = db.query(Category).filter(Category.user_id == uuid.UUID(user_id))
        if params.category_type:
            q = q.filter(Category.type == params.category_type)
        cats = q.all()
        if not cats:
            return "No categories found. Create one first!"
        lines = [f"{c.id} | {c.name} | {c.type}" for c in cats]
        return "Categories:\n" + "\n".join(lines)


class ForecastCashFlowTool(Tool):
    def __init__(self):
        class Params(BaseModel):
            months_ahead: int = Field(default=1, ge=1, le=3)

        super().__init__(
            name="forecast_cash_flow",
            description="Project future cash flow based on the last 3 months of actual data. Clearly labelled as an estimate.",
            params_schema=Params,
        )

    def execute(self, db: Session, user_id: str, **kwargs) -> str:
        params = self.params_schema(**kwargs)
        from datetime import timedelta
        today = date.today()
        three_months_ago = today.replace(day=1)
        for _ in range(3):
            month = three_months_ago.month - 1
            year = three_months_ago.year
            if month < 1:
                month = 12
                year -= 1
            three_months_ago = three_months_ago.replace(year=year, month=month)

        entries = list_entries(
            db=db, user_id=user_id,
            start_date=three_months_ago, end_date=today,
        )

        if not entries:
            return "Not enough historical data to generate a forecast (need at least some entries in the last 3 months)."

        months_data: dict[str, dict] = {}
        for e in entries:
            month_key = e.entry_date.strftime("%Y-%m")
            if month_key not in months_data:
                months_data[month_key] = {"income": 0, "expense": 0}
            if e.entry_type == "income":
                months_data[month_key]["income"] += e.amount_minor
            else:
                months_data[month_key]["expense"] += e.amount_minor

        num_months = len(months_data)
        if num_months == 0:
            return "Not enough historical data to generate a forecast."

        total_income = sum(m["income"] for m in months_data.values())
        total_expense = sum(m["expense"] for m in months_data.values())
        avg_income = total_income / num_months
        avg_expense = total_expense / num_months
        avg_net = (avg_income - avg_expense) / 100

        lines = [
            f"⚠️ Cash Flow Forecast (estimated based on last {num_months} month(s))",
            f"Average monthly income: ${avg_income / 100:.2f}",
            f"Average monthly expenses: ${avg_expense / 100:.2f}",
            f"Average monthly net: ${avg_net:.2f}",
        ]
        for i in range(1, params.months_ahead + 1):
            projected_month = today.replace(day=1)
            for _ in range(i):
                m = projected_month.month + 1
                y = projected_month.year
                if m > 12:
                    m = 1
                    y += 1
                projected_month = projected_month.replace(year=y, month=m)
            pnl = avg_net * i
            lines.append(f"Projected net for {projected_month.strftime('%B %Y')}: ${pnl:.2f} (cumulative)")
        lines.append("")
        lines.append("Disclaimer: This is a simplified estimate based on historical averages. Actual results will vary.")
        return "\n".join(lines)


_REGISTRY: list[Tool] = [
    CreateEntryTool(),
    UpdateEntryTool(),
    DeleteEntryTool(),
    ListEntriesTool(),
    CreateCategoryTool(),
    ListCategoriesTool(),
    GenerateProfitLossTool(),
    GenerateBalanceSheetTool(),
    GenerateTrialBalanceTool(),
    RunMonthlyAuditTool(),
    SummarizeSpendingTool(),
    ForecastCashFlowTool(),
]


def get_tool(name: str) -> Tool | None:
    for t in _REGISTRY:
        if t.name == name:
            return t
    return None


def get_tool_definitions() -> list[dict]:
    return [
        {
            "name": t.name,
            "description": t.description,
            "parameters": t.params_schema.model_json_schema(),
        }
        for t in _REGISTRY
    ]


_SYSTEM_PROMPT = """You are an AI accounting assistant. You help users manage their business finances.

When you need to use a tool, respond naturally AND include the tool JSON in a fenced code block:

```json
{{"tool": "tool_name", "arguments": {{"arg1": "value1", ...}}}}
```

Available tools:
{tool_defs}

RULES:
1. Never fabricate a monetary figure — every number must come from a tool result.
2. Never silently create a new category — confirm with the user first.
3. Always resolve relative dates against the server's current date (today is {today}) and state the resolved date back.
4. When ambiguous, ask one clarifying question rather than guessing.
5. For destructive actions (delete_entry), summarize what will be deleted and proceed only after confirmation.

If no tool is needed, respond conversationally in natural language."""


def run_agent(
    db: Session,
    user_id: str,
    message: str,
    conversation_history: list | None = None,
) -> tuple[str, list[ToolCall], str | None]:
    if conversation_history is None:
        conversation_history = []

    today_str = date.today().isoformat()
    tool_defs = json.dumps(get_tool_definitions(), indent=2)
    system = _SYSTEM_PROMPT.format(today=today_str, tool_defs=tool_defs)

    conversation_history.append({"role": "user", "content": message})

    try:
        raw_response = _call_llm(system, conversation_history)
    except Exception as e:
        return f"API error: {e!s}", [], None

    actions_taken: list[ToolCall] = []
    tool_calls = _parse_tool_calls(raw_response)

    if tool_calls:
        textual = _strip_tool_block(raw_response)
        result_lines = []
        for tc in tool_calls:
            tool = get_tool(tc["tool"])
            if not tool:
                result_lines.append(f"Unknown tool: {tc['tool']}")
                continue
            try:
                result = tool.execute(db, user_id, **tc["arguments"])
                actions_taken.append(
                    ToolCall(tool=tool.name, input=tc["arguments"], result_summary=result)
                )
                result_lines.append(result)
            except Exception as e:
                actions_taken.append(
                    ToolCall(tool=tool.name, input=tc["arguments"], result_summary=f"Error: {e!s}")
                )
                result_lines.append(f"Error running {tc['tool']}: {e!s}")
        combined = "\n".join(result_lines)
        final_response = f"{textual}\n\n{combined}" if textual else combined
        conversation_history.append({"role": "assistant", "content": final_response})
        return final_response, actions_taken, None

    conversation_history.append({"role": "assistant", "content": raw_response})
    return raw_response, actions_taken, None


def generate_title(message: str) -> str:
    try:
        from app.config import settings
        if settings.ai_api_key:
            system = "You are a title generator. Respond with ONLY a short phrase (max 6 words) summarizing the user's request. No quotes, no punctuation."
            return _call_openai(system, [{"role": "user", "content": message}])
        else:
            return _mock_title(message)
    except Exception:
        return _mock_title(message)


def _mock_title(message: str) -> str:
    words = message.strip().split()
    title = " ".join(words[:6])
    if len(title) > 50:
        title = title[:50]
    return title if title else "New Chat"


def _call_llm(system: str, messages: list) -> str:
    from app.config import settings

    api_key = settings.ai_api_key
    if api_key:
        try:
            return _call_openai(system, messages, api_key)
        except Exception:
            return _mock_llm(system, messages)
    return _mock_llm(system, messages)


def _mock_llm(system: str, messages: list) -> str:
    last_message = messages[-1]["content"] if messages else ""
    lower = last_message.lower()

    def _extract_names(text: str) -> list[str]:
        import re
        stop_words = {"category", "categories", "income", "expense", "create", "add",
                      "new", "entry", "for", "as", "and", "the", "a", "an", "of", "with",
                      "5000", "2000", "1500", "(", ")", "/month", "", "then"}
        colon_split = re.split(r'[:;]', text, maxsplit=1)
        relevant = colon_split[-1]
        parts = re.split(r'[,;]\s*|\s+and\s+', relevant)
        cleaned = []
        for p in parts:
            p = p.strip().lower().rstrip(".")
            words = p.split()
            clean_words = [w for w in words if w not in stop_words and not w.isdigit()]
            if clean_words:
                name = clean_words[0].capitalize()
                if name not in cleaned:
                    cleaned.append(name)
        return cleaned if len(cleaned) > 1 else []

    calls = []

    # Detect bulk category creation: "create categories rent, electricity, internet"
    if ("categorie" in lower or "category" in lower) and ("create" in lower or "add" in lower or "new" in lower or "ban" in lower):
        names = _extract_names(last_message)
        if names:
            for name in names:
                calls.append({
                    "tool": "create_category",
                    "arguments": {"name": name, "category_type": "expense" if "income" not in lower else "income"},
                })
        else:
            calls.append({"tool": "create_category", "arguments": {"name": "ASK_USER_FOR_NAME", "category_type": "ASK_USER_FOR_TYPE"}})

    # Detect bulk entry creation: "add expense 5000 for rent, add income 3000 for freelance"
    if not calls and ("add" in lower or "new entry" in lower or "daal" in lower or "jama" in lower or "likh" in lower):
        import re
        entries = re.findall(r'(expense|income)\s+(\d+[\d,.]*)\s+for\s+(\w+)', lower)
        if entries:
            for etype, amount, cat in entries:
                amt = float(amount.replace(",", ""))
                calls.append({
                    "tool": "create_entry",
                    "arguments": {
                        "entry_type": etype,
                        "category_id": "REQUIRES_CATEGORY_ID",
                        "amount": amt,
                        "entry_date": date.today().isoformat(),
                        "description": cat,
                        "source": "ai_agent",
                    },
                })
        else:
            calls.append({
                "tool": "create_entry",
                "arguments": {
                    "entry_type": "expense" if "income" not in lower else "income",
                    "category_id": "REQUIRES_CATEGORY_ID",
                    "amount": 0.0,
                    "entry_date": date.today().isoformat(),
                    "description": None,
                    "source": "ai_agent",
                },
            })

    if not calls and ("p&l" in lower or "profit" in lower or "loss" in lower or "manaafa" in lower or "nuqsan" in lower):
        calls.append({
            "tool": "generate_profit_and_loss",
            "arguments": {"start_date": date.today().replace(day=1).isoformat(), "end_date": date.today().isoformat()},
        })

    if not calls and "balance sheet" in lower:
        calls.append({
            "tool": "generate_balance_sheet",
            "arguments": {"as_of": date.today().isoformat()},
        })

    if not calls and "trial" in lower:
        calls.append({
            "tool": "generate_trial_balance",
            "arguments": {"as_of": date.today().isoformat()},
        })

    if not calls and "audit" in lower:
        calls.append({
            "tool": "run_monthly_audit",
            "arguments": {"month": date.today().replace(day=1).isoformat()},
        })

    if not calls and ("delete" in lower or "remove" in lower or "hata" in lower):
        calls.append({
            "tool": "delete_entry",
            "arguments": {"entry_id": "ASK_USER_FOR_ID"},
        })

    if not calls and ("list" in lower or "show" in lower or "find" in lower or "dikha" in lower or "bata" in lower or "dekh" in lower or "search" in lower):
        calls.append({
            "tool": "list_entries",
            "arguments": {},
        })

    if not calls and ("spend" in lower or "total" in lower or "how much" in lower or "kitna" in lower or "kul" in lower or "kharacha" in lower):
        calls.append({
            "tool": "summarize_spending",
            "arguments": {},
        })

    if not calls and ("update" in lower or "edit" in lower or "change" in lower or "badal" in lower):
        calls.append({
            "tool": "update_entry",
            "arguments": {"entry_id": "ASK_USER_FOR_ID", "amount": 0.0},
        })

    if not calls and ("forecast" in lower or "project" in lower or "predict" in lower or "future" in lower or "next month" in lower or "next" in lower):
        calls.append({
            "tool": "forecast_cash_flow",
            "arguments": {"months_ahead": 3 if "3" in lower or "three" in lower else 1},
        })

    if not calls and ("list category" in lower or "show category" in lower or "categories" in lower or "category dikha" in lower):
        calls.append({
            "tool": "list_categories",
            "arguments": {},
        })

    if calls:
        return json.dumps(calls) if len(calls) > 1 else json.dumps(calls[0])

    return (
        "I can help you manage your business finances. You can ask me to:\n"
        "- Add an expense or income entry\n"
        "- List, update, or delete entries\n"
        "- Generate reports (P&L, Balance Sheet, Trial Balance)\n"
        "- Run a monthly audit\n"
        "- Summarize your spending\n\n"
        "What would you like to do?"
    )


def _call_openai(system: str, messages: list, api_key: str) -> str:
    import urllib.request
    from app.config import settings

    url = settings.ai_api_url.rstrip("/")
    if not url.endswith("/chat/completions"):
        url += "/chat/completions"
    model = settings.ai_model
    body = json.dumps(
        {
            "model": model,
            "messages": [{"role": "system", "content": system}] + messages,
            "temperature": 0.1,
            "max_tokens": 500,
        }
    ).encode()
    req = urllib.request.Request(
        url,
        data=body,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
    )
    resp = urllib.request.urlopen(req)
    data = json.loads(resp.read())
    return data["choices"][0]["message"]["content"]


def _strip_tool_block(response: str) -> str:
    import re as _re
    if '```' in response:
        cleaned = _re.sub(r'```(?:json)?\s*\n?.*?\n?```', '', response, flags=_re.DOTALL)
    else:
        cleaned = _re.sub(r'\s*\[[^\[\]]*"tool"[^\[\]]*"arguments"[^\[\]]*\]\s*', '', response)
        cleaned = _re.sub(r'\s*\{[^{}]*"tool"[^{}]*"arguments"[^{}]*\}\s*', '', cleaned)
    return cleaned.strip()


def _parse_tool_calls(response: str) -> list[dict]:
    import re as _re
    candidates = [response]
    candidates.extend(_re.findall(r'```(?:json)?\s*\n?(.*?)\n?```', response, _re.DOTALL))
    for c in candidates:
        try:
            parsed = json.loads(c)
            if isinstance(parsed, dict) and "tool" in parsed and "arguments" in parsed:
                return [parsed]
            if isinstance(parsed, list):
                valid = [p for p in parsed if isinstance(p, dict) and "tool" in p and "arguments" in p]
                if valid:
                    return valid
        except (json.JSONDecodeError, TypeError):
            continue
    # fallback: split by newlines and collect all valid tool objects (handles adjacent JSON)
    result = []
    for line in response.strip().splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            parsed = json.loads(line)
            if isinstance(parsed, dict) and "tool" in parsed and "arguments" in parsed:
                result.append(parsed)
        except (json.JSONDecodeError, TypeError):
            continue
    if result:
        return result
    return []
