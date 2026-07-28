from app.config import settings
from sqlalchemy import create_engine, inspect
engine = create_engine(settings.database_url)
insp = inspect(engine)
tables = insp.get_table_names()
print("Tables:", tables)
for t in tables:
    cols = insp.get_columns(t)
    print(f"  {t}: {[(c['name'], str(c['type'])) for c in cols]}")
