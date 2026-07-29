from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import JSONResponse

from app.database import Base, engine
from app.models import User, Category, Entry, AuditFlag, Conversation, ChatMessage  # noqa: F401
from app.routers import auth, categories, chat, conversations, entries, reports


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"[startup] Table creation skipped: {e}")
    yield


app = FastAPI(title="Accounting Assistant API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://caacountingai-pi.vercel.app",
        "https://cybernet-intgernship.vercel.app",
        "http://localhost:3000",
        "http://localhost:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    field_errors: dict[str, str] = {}
    for error in exc.errors():
        field = ".".join(str(loc) for loc in error.get("loc", []))
        field_errors[field] = error.get("msg", "Invalid value")
    return JSONResponse(
        status_code=422,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Request validation failed",
                "field_errors": field_errors,
            }
        },
    )


app.include_router(auth.router, prefix="/api")
app.include_router(categories.router, prefix="/api")
app.include_router(entries.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(conversations.router, prefix="/api")
