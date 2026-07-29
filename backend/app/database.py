from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings

def _is_sqlite(url: str) -> bool:
    return url.startswith("sqlite")


engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False} if _is_sqlite(settings.database_url) else {},
    pool_pre_ping=True,
    pool_size=5 if not _is_sqlite(settings.database_url) else None,
    max_overflow=0 if not _is_sqlite(settings.database_url) else None,
    pool_recycle=300 if not _is_sqlite(settings.database_url) else -1,
)


@event.listens_for(engine, "connect")
def _set_sqlite_pragma(dbapi_connection, connection_record):
    if settings.database_url.startswith("sqlite"):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass
