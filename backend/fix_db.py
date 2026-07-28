from app.config import settings
from sqlalchemy import create_engine, text

engine = create_engine(settings.database_url)
with engine.connect() as conn:
    conn.execute(text("ALTER TABLE categories ADD COLUMN type category_type NOT NULL DEFAULT 'expense'"))
    conn.commit()
    print("Added 'type' column to categories table")
