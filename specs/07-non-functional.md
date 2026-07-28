# Non-Functional Requirements Spec

Status: Draft

## Validation

- Every FastAPI endpoint has request and response Pydantic models — no raw dicts in/out.
- Reject invalid enums (e.g. unknown `entry_type`) with a 422 and a field-level error message.

## Auth & security

- Passwords hashed (e.g. bcrypt/argon2), never stored or logged in plain text.
- JWT (or equivalent) bearer tokens for API auth; token expiry configurable via env var.
- All entry/report/chat endpoints scoped to the authenticated user's `user_id` — verified
  server-side, never trusted from client input.

## Error handling

- Consistent error envelope across all endpoints (see `02-api-contracts.md`).
- AI agent failures (tool errors, model timeouts) degrade gracefully with a clear message,
  never a raw 500 with no explanation surfaced to the user.

## Docker / local dev

- `docker-compose.yml` brings up: `frontend` (Next.js), `backend` (FastAPI), `db`
  (PostgreSQL) with a named volume for data persistence.
- `.env.example` documents every required environment variable (DB connection string, AI
  API key, JWT secret) with no real secrets committed.
- `README.md` documents: prerequisites, `docker compose up` as the one-command run path,
  and how to run backend/frontend independently for development.

## Deployment

- Frontend: Vercel (free tier).
- Backend: Render, Railway, Fly.io, or Hugging Face Spaces (free tier) — pick one and
  document the choice and its limits (cold starts, sleep behavior, etc.) in the README.
- Database: Neon, Supabase, or Railway Postgres (free tier) — document connection pooling
  considerations for serverless/cold-start backends.

## Git workflow

- One feature = one branch = one PR into `main`.
- Commit messages follow `type: short description` (e.g. `feat: add monthly audit endpoint`,
  `fix: expense date validation`).
- No single giant "final commit" — history should show incremental, reviewable progress.

## AI cost & model routing

- Default to a small/fast model (see research paper Section 5) for chat and entry parsing.
- Optionally route the monthly-audit summarization step to a stronger model if the small
  model's anomaly summaries prove unreliable in testing — document the decision either way.
