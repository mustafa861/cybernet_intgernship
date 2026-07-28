# Feature Spec: Monthly Audit (Anomaly Detection)

Status: Draft
Branch: `feature/monthly-audit`

## What it does

Runs an automated review of all entries for a chosen month and flags anything that looks
like a potential bookkeeping error, so the user can review a short list instead of every
transaction.

## Inputs

- A month (e.g. "June 2026"), from the Reports screen or via chat ("run the audit for June").

## Outputs

- A list of flagged entries, each with a plain-language reason and a severity
  (`low`/`medium`/`high`), persisted to `audit_flags` and shown in the Audit view.

## Detection rules (v1 — deterministic, not ML)

1. **Duplicate detection**: two or more entries with the same amount, category, and date
   within the month → flag all but the first as `medium` severity, "possible duplicate entry".
2. **Missing description**: expense entries above a configurable threshold
   (e.g. > 10,000) with no description → `low` severity, "large entry missing a
   description".
3. **Category outlier**: an entry whose amount is more than 3x the category's average for
   the trailing 6 months → `medium` severity, "amount is unusually high for this category".
4. **Uncategorized/miscellaneous overuse**: if more than 20% of the month's entries fall
   under a generic "Miscellaneous" category → `low` severity, single summary flag rather
   than per-entry.
5. **Weekend/holiday large entries** (optional, stretch): a large entry dated on a weekend
   → `low` severity, "verify this transaction date".

## Behavior / rules

- The AI agent calls a single `run_monthly_audit(month)` tool; the anomaly rules above run
  as deterministic SQL/Python logic inside that tool — the LLM does not decide anomalies by
  "reading" raw rows itself, to keep results reproducible and explainable.
- The AI's job after the tool returns is to summarize: how many entries were reviewed, how
  many flags were raised, and to group flags by severity in its reply.
- Running the audit for the same month twice should not create duplicate `audit_flags` rows
  — clear and re-insert for that month on each run.

## Edge cases

- Month with fewer than 5 entries: skip category-outlier detection (not enough data),
  note this in the response.
- No flags found: return a clean "no anomalies found" result rather than an empty array
  with no explanation.

## Acceptance criteria

- [ ] Two identical entries (same amount/category/date) in test data produce exactly one
      duplicate flag.
- [ ] A category-average outlier is correctly flagged when amount > 3x trailing average.
- [ ] Re-running the audit for the same month replaces, not duplicates, previous flags.
