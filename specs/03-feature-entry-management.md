# Feature Spec: Entry Management (Manual + AI)

Status: Draft
Branch: `feature/expense-entry`

## What it does

Lets a user record expenses and income either by filling a form or by telling the AI in
natural language. Both paths call the same `POST /api/entries` endpoint underneath, so data
integrity rules are identical regardless of source.

## Inputs

- Manual: form fields — type (expense/income), category (dropdown), amount, date, description.
- AI: free-text message, e.g. "Add office rent 50,000 for July" or
  "We received 20,000 from a client yesterday for consulting".

## Outputs

- A new row in `entries`, immediately visible in the ledger list and reflected in reports
  for the relevant period.
- For AI-driven entries: a natural-language confirmation (e.g. "Added an expense of
  PKR 50,000 under Rent, dated 1 July 2026.") plus a structured `actions_taken` entry.

## Behavior / rules

1. Amount must be a positive number; reject and explain if the AI parses an ambiguous or
   negative amount.
2. If the AI cannot confidently identify a category from existing categories, it must ask a
   clarifying question rather than guessing (e.g. propose the closest match and ask for
   confirmation) — it must not silently create a new category.
3. Date parsing: relative dates ("yesterday", "last Monday", "for July") resolve using the
   server's current date, not the AI's training data date.
4. Every AI-created entry is tagged `source = "ai_agent"` so it's distinguishable in the UI
   (e.g. a small "AI" badge) and in audit trails.
5. Edits/deletes require the entry's `user_id` to match the authenticated user — no
   cross-account access.

## Edge cases

- Duplicate-looking entry (same amount, category, and date as an existing entry): the AI
  should flag this to the user before saving ("This looks similar to an entry from
  [date] — add it anyway?") rather than silently creating a duplicate.
- Missing category entirely (user has none yet): prompt to create one first.
- Multi-entry commands ("add rent 50,000 and utilities 10,000 for July"): parse into two
  separate `create_entry` tool calls, and confirm both in a single reply.

## Acceptance criteria

- [ ] Manual form creates a valid entry and appears in the ledger without a page reload.
- [ ] "Add office rent 50,000 for July" via chat creates exactly one expense entry with the
      correct amount, a matched or clarified category, and a sensible date.
- [ ] Editing an entry updates `updated_at` and is reflected in reports on next generation.
- [ ] Deleting an entry removes it from all subsequent report calculations.
