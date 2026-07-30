from contextlib import asynccontextmanager

from alembic import command
from alembic.config import Config
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import JSONResponse

from app.config import Settings
from app.routers import auth, categories, chat, conversations, entries, recurring_entries, reports

settings = Settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    db_url = settings.database_url
    masked = db_url.split("@")[-1] if "@" in db_url else "not set"
    print(f"STARTUP: DATABASE_URL -> ...@{masked}")
    print(f"STARTUP: JWT_SECRET set? {'yes' if settings.jwt_secret and settings.jwt_secret != 'change-me-in-production' else 'using default'}")
    try:
        alembic_cfg = Config("alembic.ini")
        command.upgrade(alembic_cfg, "head")
        print("MIGRATIONS: ran successfully")
    except Exception as e:
        print(f"MIGRATIONS: failed — {e}")
    yield


app = FastAPI(title="Accounting Assistant API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://caaccountingai-p1.vercel.app",
        "https://cybernet-intgernship.vercel.app",
        "https://cybernet-intgernship.onrender.com",
    ],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|.*\.vercel\.app|.*\.onrender\.com)(:\d+)?",
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


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    import traceback
    error_detail = "".join(traceback.format_exception(type(exc), exc, exc.__traceback__))
    print(f"UNHANDLED ERROR: {error_detail}")
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "An unexpected error occurred",
            }
        },
    )


app.include_router(auth.router, prefix="/api")
app.include_router(categories.router, prefix="/api")
app.include_router(entries.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(conversations.router, prefix="/api")
app.include_router(recurring_entries.router, prefix="/api")
