# API Contracts Spec

Status: Draft

All endpoints are prefixed `/api`. All request/response bodies are Pydantic models.
Authenticated endpoints require a bearer token; the current user's `user_id` is derived
server-side from the token, never trusted from the request body.

## Auth

### `POST /api/auth/register`
Request: `{ email: str, password: str, business_name: str }`
Response: `{ user_id: UUID, email: str, business_name: str }`

### `POST /api/auth/login`
Request: `{ email: str, password: str }`
Response: `{ access_token: str, token_type: "bearer" }`

## Categories

### `GET /api/categories`
Response: `[{ id: UUID, name: str, type: str }]`

### `POST /api/categories`
Request: `{ name: str, type: "expense"|"income"|"asset"|"liability"|"equity" }`
Response: `{ id: UUID, name: str, type: str }`

## Entries

### `POST /api/entries`
Request:
```
{
  entry_type: "expense" | "income",
  category_id: UUID,
  amount: float,          # human-readable, converted to amount_minor server-side
  entry_date: date,
  description: str | null,
  source: "manual" | "ai_agent",   # defaults to "manual" if omitted
  contact_name: str | null,        # customer or vendor name for AR/AP
  contact_type: "customer" | "vendor" | null
}
```
Response: the created entry, including generated `id`.

### `GET /api/entries?start_date=&end_date=&category_id=&entry_type=`
Response: `[Entry]`, filtered by any provided query params (all optional).

### `PATCH /api/entries/{id}`
Request: partial update, same shape as POST minus required fields.
Response: the updated entry.

### `DELETE /api/entries/{id}`
Response: `{ deleted: true }`

## Reports

### `GET /api/reports/trial-balance?as_of=`
Response: `[{ category: str, type: str, total: float }]`

### `GET /api/reports/profit-and-loss?start_date=&end_date=`
Response:
```
{
  period: { start_date: date, end_date: date },
  income: [{ category: str, total: float }],
  expenses: [{ category: str, total: float }],
  total_income: float,
  total_expenses: float,
  net_profit: float
}
```

### `GET /api/reports/balance-sheet?as_of=`
Response:
```
{
  as_of: date,
  assets: [{ category: str, total: float }],
  liabilities: [{ category: str, total: float }],
  equity: [{ category: str, total: float }],
  total_assets: float,
  total_liabilities_and_equity: float
}
```

### `GET /api/reports/ageing`
Response:
```
{
  as_of: date,
  customers: [{ contact_name: str, total: float, current: float, days_31_60: float, days_60_plus: float }],
  vendors: [{ contact_name: str, total: float, current: float, days_31_60: float, days_60_plus: float }],
  total_receivables: float,
  total_payables: float
}
```
Buckets: 0-30 days overdue = current, 31-60 days, 60+ days.

### `POST /api/reports/monthly-audit`
Request: `{ month: date }` (any date within the target month)
Response: `{ month: date, flags: [{ entry_id: UUID, reason: str, severity: str }], entries_reviewed: int }`

## AI Chat

### `POST /api/chat`
Request: `{ message: str, conversation_id: UUID | null }`
Response:
```
{
  conversation_id: UUID,
  reply: str,                 # natural-language response
  actions_taken: [
    { tool: str, input: object, result_summary: str }
  ]
}
```
`actions_taken` lets the UI show exactly what the agent did (transparency/auditability),
not just its final reply.

## Error format (all endpoints)

```
{ "error": { "code": str, "message": str, "field_errors": object | null } }
```
FastAPI's automatic 422 validation errors are re-shaped into this format via an exception
handler so the frontend has one error shape to handle everywhere.
