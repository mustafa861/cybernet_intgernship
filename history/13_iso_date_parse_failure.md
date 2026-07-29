# Prompt

**User:** The monthly audit tool is throwing an exception when parsing a date string. The error message reads: `Invalid isoformat string: '2026-07'`. The string lacks a day component, containing only the year and month in `YYYY-MM` format, which does not satisfy Python's `date.fromisoformat()` requirements. Please implement a robust solution that can accommodate both full and partial ISO date strings.

---

## Response

**OpenCode:** Introduced a `_parse_date(s: str) -> date` utility function that inspects the input string length and hyphen count: if the string is exactly 7 characters with a single hyphen (matching the `YYYY-MM` pattern), it appends `-01` before delegating to `date.fromisoformat()`. This ensures that ambiguous month-only strings default to the first day of that month.

Applied `_parse_date()` across all tool `execute()` methods within `ai_service.py`, replacing every direct invocation of `date.fromisoformat()` to provide uniform partial-date tolerance throughout the agent's tooling surface.
