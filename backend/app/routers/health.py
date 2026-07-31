from fastapi import APIRouter
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.config import settings
from app.database import engine

router = APIRouter(prefix="/health", tags=["health"])


def _mask_db_url(url: str) -> str:
    if "@" not in url:
        return "not configured"
    _, host = url.split("@", 1)
    return f"***@{host}"


@router.get("")
async def health_check():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={
                "status": "error",
                "database": "unreachable",
                "error": f"{type(e).__name__}: {e}",
            },
        )
    return {
        "status": "ok",
        "database": "connected",
        "database_url": _mask_db_url(settings.database_url),
    }
