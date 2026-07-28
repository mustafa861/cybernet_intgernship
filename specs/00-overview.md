# Specs Overview — AI-Powered Accounting & Finance Assistant

This `/specs` folder is the single source of truth for what gets built. Per Spec-Driven
Development (SDD), no feature is coded until its spec here is written and (ideally) reviewed.

## Spec index

| File | Covers |
|---|---|
| `01-data-model.md` | Database schema: tables, columns, relationships |
| `02-api-contracts.md` | REST endpoints, request/response Pydantic shapes |
| `03-feature-entry-management.md` | Creating/editing/deleting expense & income entries (manual + AI) |
| `04-feature-reports.md` | Trial balance, Profit & Loss, Balance Sheet |
| `05-feature-monthly-audit.md` | AI-driven anomaly detection for a given month |
| `06-feature-ai-agent.md` | Agent behavior, tool registry, conversation flow |
| `07-non-functional.md` | Auth, validation, error handling, deployment constraints |

## Conventions used across specs

- All monetary amounts are stored as integers in the smallest currency unit (e.g. paisa/cents)
  to avoid floating-point rounding errors, and converted to decimal only for display.
- All dates are stored as `DATE` (no time component) unless a spec says otherwise.
- Every API request/response has a corresponding Pydantic model — no endpoint accepts or
  returns an untyped dict.
- Every feature branch (`feature/xxx`) must reference the spec file it implements in its PR
  description.
- "Done" for a feature means: spec written → branch created → code + tests → PR merged to
  `main` → spec file's status line updated to `Status: Implemented`.

## Status legend

- `Draft` — spec written, not yet implemented
- `In Progress` — branch open, code underway
- `Implemented` — merged to main
