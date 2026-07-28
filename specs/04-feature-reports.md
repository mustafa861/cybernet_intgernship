# Feature Spec: Financial Reports (Trial Balance, P&L, Balance Sheet)

Status: Draft
Branch: `feature/pl-report` (and `feature/balance-sheet`, `feature/trial-balance` if split further)

## What it does

Generates real financial statements from live PostgreSQL data — never hard-coded or
mocked — for any period the user selects, either through the Reports screen or by asking
the AI ("Generate the P&L for Q2").

## Inputs

- A date range (P&L) or an "as of" date (Balance Sheet, Trial Balance).
- Optionally, a natural-language period from the AI ("last quarter", "this month",
  "financial year to date") which the backend resolves into concrete start/end dates.

## Outputs

- Trial balance: totals per category, split by type, confirming debits = credits.
- P&L: total income, total expenses, and net profit for the period, broken down by category.
- Balance Sheet: assets, liabilities, and equity as of a date, with the accounting identity
  (Assets = Liabilities + Equity) checked and surfaced if it does not hold.

## Behavior / rules

1. All figures are computed with a single SQL aggregation query per report (`SUM(amount_minor)
   GROUP BY category`) — no report logic duplicates data already computed elsewhere.
2. If a period has zero entries, return a valid (empty) report, not an error.
3. The AI's role in this feature is purely to (a) resolve a natural-language period into
   dates, (b) call the report endpoint, and (c) narrate the numbers back — it must not
   compute or alter any totals itself.
4. Reports must reflect the very latest entries at generation time (no caching that could
   go stale within a session).

## Edge cases

- Overlapping/contradictory period phrasing ("last month" asked on the 1st of a month):
  resolve using calendar-month boundaries and state the resolved range back to the user.
- Balance Sheet accounting-identity mismatch: surface as a warning in the response rather
  than silently forcing balance — this is useful signal for the audit feature too.

## Acceptance criteria

- [ ] P&L for a month with known test data matches a manually-calculated total exactly.
- [ ] Balance Sheet as-of a date only includes entries dated on or before that date.
- [ ] Asking the AI "How much did we spend on utilities in March?" returns a correct,
      specific figure sourced from `entries`, not an estimate.
