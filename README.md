# AI Accounting Assistant

A full-stack AI-powered accounting assistant built with FastAPI, Next.js, and PostgreSQL. Users can manage business finances through a web UI or natural-language chat — create categories, record entries, generate reports (P&L, balance sheet, trial balance), and run monthly audits.

## Tech Stack

| Layer   | Technology                                    |
| ------- | --------------------------------------------- |
| Backend | Python 3.13, FastAPI, SQLAlchemy, PostgreSQL  |
| Frontend| Next.js 14 (App Router), TypeScript, Tailwind |
| AI      | OpenRouter (qwen/qwen3.7-flash) with SSE streaming |
| Auth    | bcrypt + JWT                                  |
| DevOps  | Docker Compose (db + backend + frontend)      |

## Quick Start — Docker

```bash
cp .env.example .env        # edit secrets as needed
docker compose up --build
```

- Backend API: http://localhost:8000/api
- Frontend UI: http://localhost:3000

## Manual Setup

### Backend

```bash
cd backend
cp .env.example .env
uv sync
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend

```bash
cd frontend
cp .env.example .env.local   # set NEXT_PUBLIC_API_URL=http://localhost:8000/api
npm install
npm run dev
```

## Environment Variables

| Variable             | Description                     | Default                                     |
| -------------------- | ------------------------------- | ------------------------------------------- |
| `DATABASE_URL`       | PostgreSQL connection string     | `postgresql://postgres:postgres@db:5432/...`|
| `JWT_SECRET`         | Secret key for JWT tokens        | `change-me-in-production`                   |
| `AI_API_KEY`         | OpenRouter / OpenAI API key      | (empty — mock responses used)               |
| `AI_API_URL`         | LLM endpoint                     | `https://api.openai.com/v1/chat/completions`|
| `AI_MODEL`           | Model name                       | `gpt-4o-mini`                               |

## Status

| Feature             | Status    |
| ------------------- | --------- |
| Auth (register/login) | Done    |
| Category CRUD       | Done       |
| Entry CRUD          | Done       |
| Financial Reports (P&L, Balance Sheet, Trial Balance) | Done |
| Monthly Audit       | Done       |
| AI Chatbot (streaming) | Done   |
| Chat History (persistent) | Done |
| Docker Compose      | Done       |
| Tests               | Pending    |

## Project Structure

```
backend/
  app/
    main.py              — FastAPI app entry
    config.py            — Pydantic settings
    models/              — SQLAlchemy ORM models
    schemas/             — Pydantic request/response schemas
    routers/             — API route handlers
    services/            — Business logic (AI agent, reports)
  tests/
    fixtures/            — Test JSON payloads
  Dockerfile
  pyproject.toml

frontend/
  src/
    app/                 — Next.js pages (App Router)
    components/          — Reusable UI components
    lib/                 — API client, auth context
  Dockerfile
  package.json
```
