# Skill: AI Accounting Chatbot

## Description
This project includes a full-stack AI-powered chatbot that allows users to manage their business finances through natural language. The chatbot can create categories, record entries, generate reports, run audits, and answer spending questions — all via conversational prompts.

## Architecture

### Backend (`backend/app/`)
```
services/ai_service.py    ← Core agent logic (tools, LLM calls, parsing)
routers/chat.py           ← REST + SSE streaming endpoints
routers/conversations.py  ← CRUD for conversation history
models/db_models.py       ← Conversation + ChatMessage ORM models
```

### Frontend (`frontend/src/`)
```
components/ChatWidget.tsx  ← Chat input + message display with SSE streaming
components/ChatHistory.tsx ← Sidebar listing saved conversations
app/chat/page.tsx          ← Chat page composing widget + history
lib/api.ts                 ← ApiClient with chatStream() SSE consumer
```

## Key Patterns

### Tool Registration
Every tool the AI can use extends `Tool` base class and is registered in `_REGISTRY`:
```python
class MyTool(Tool):
    def __init__(self):
        class Params(BaseModel):
            ...
        super().__init__(name="tool_name", description="...", params_schema=Params)
    def execute(self, db, user_id, **kwargs) -> str: ...

_REGISTRY: list[Tool] = [MyTool(), ...]
```

### LLM Call Flow
`run_agent()` → `_call_llm()` → either `_call_openai()` (OpenRouter) or `_mock_llm()` (fallback)

### Tool Call Parsing
`_parse_tool_calls()` handles three formats:
1. Single JSON object: `{"tool": "x", "arguments": {...}}`
2. JSON array: `[{"tool": "x", ...}, {"tool": "y", ...}]`
3. Adjacent objects (one per line): `{...}\n{...}`

### SSE Streaming
Backend: `POST /chat/stream` returns `StreamingResponse` with `text/event-stream`
Events: `meta` (conversation_id), `token` (10-char chunks), `done` (actions_taken)

### Conversation Persistence
User message is committed immediately before streaming. Assistant message is committed after stream completes. Title auto-generated on first message.

## Mock LLM keywords
| Keyword | Tool triggered |
|---------|---------------|
| "create/add category" | `create_category` |
| "add/daal entry" | `create_entry` |
| "p&l/profit/loss" | `generate_profit_and_loss` |
| "balance sheet" | `generate_balance_sheet` |
| "trial" | `generate_trial_balance` |
| "audit" | `run_monthly_audit` |
| "delete/remove" | `delete_entry` |
| "list/show/dikha" | `list_entries` |
| "spend/total/kitna" | `summarize_spending` |
| "list categories" | `list_categories` |

## Key Files Reference
| File | Purpose |
|------|---------|
| `backend/app/services/ai_service.py` | All agent logic: tools, LLM, parsing, stripping |
| `backend/app/routers/chat.py` | Chat endpoints (regular + SSE stream) |
| `backend/app/routers/conversations.py` | Conversation CRUD |
| `backend/app/models/db_models.py` | Conversation + ChatMessage ORM models |
| `frontend/src/components/ChatWidget.tsx` | Chat UI with streaming support |
| `frontend/src/components/ChatHistory.tsx` | Conversation sidebar |
| `frontend/src/lib/api.ts` | ApiClient with SSE consumer |
