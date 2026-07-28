# Feature Spec: AI Agent Behavior & Tool Registry

Status: Draft
Branch: `feature/ai-agent`

## What it does

Provides the conversational layer that turns natural-language requests into calls against
the same internal APIs the UI uses, then narrates results back in plain language.

## Tool registry (initial set)

| Tool | Purpose | Wraps |
|---|---|---|
| `create_entry` | Add an expense or income entry | `POST /api/entries` |
| `update_entry` | Edit an existing entry | `PATCH /api/entries/{id}` |
| `delete_entry` | Remove an entry | `DELETE /api/entries/{id}` |
| `list_entries` | Look up entries by filters | `GET /api/entries` |
| `generate_profit_and_loss` | Produce a P&L for a period | `GET /api/reports/profit-and-loss` |
| `generate_balance_sheet` | Produce a Balance Sheet as of a date | `GET /api/reports/balance-sheet` |
| `generate_trial_balance` | Produce a trial balance | `GET /api/reports/trial-balance` |
| `run_monthly_audit` | Run anomaly detection for a month | `POST /api/reports/monthly-audit` |
| `summarize_spending` | Answer ad-hoc spending questions | `GET /api/entries` + aggregation |

Every tool has an explicit Pydantic-defined input schema; the agent cannot call a tool with
free-form/unstructured arguments.

## System prompt behavior (non-negotiable rules)

1. Never fabricate a monetary figure — every number in a reply must come from a tool result.
2. Never silently create a new category — confirm with the user first.
3. Always resolve relative dates/periods against the server's current date, and state the
   resolved date/period back to the user for confirmation.
4. When a request is ambiguous (unclear category, unclear amount, unclear period), ask one
   clarifying question rather than guessing.
5. For destructive actions (delete_entry), summarize what will be deleted and proceed only
   after the current message confirms it — do not delete on the first ambiguous mention.

## Conversation flow

1. User message arrives at `POST /api/chat` with an optional `conversation_id`.
2. If no `conversation_id`, start a new conversation and store history server-side (or in
   the request, per implementation choice — document the choice here once made).
3. Agent loop: model reasons → optionally calls one or more tools → tool results return to
   the model → model produces a final natural-language reply.
4. Every tool call is recorded in `actions_taken` in the response so the UI can render an
   "AI did X" trail for transparency.

## Edge cases

- Tool call fails (e.g. invalid category_id): the agent must surface a clear, non-technical
  explanation to the user, not a raw stack trace.
- User asks something outside accounting scope: politely decline and redirect to what the
  assistant can help with.

## Acceptance criteria

- [ ] A single free-text message can trigger exactly the right tool call with correctly
      parsed parameters for at least: add entry, edit entry, generate P&L, run audit,
      answer a spending question.
- [ ] Every reply that states a number is traceable to a tool call in `actions_taken`.
