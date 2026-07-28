from app.config import settings
from sqlalchemy import create_engine, inspect, text
engine = create_engine(settings.database_url)
insp = inspect(engine)

tables = insp.get_table_names()
for t in tables:
    cols = insp.get_columns(t)
    print(f"{t}: {[(c['name'], str(c['type'])) for c in cols]}")

with engine.connect() as conn:
    result = conn.execute(text("SELECT typname, typcategory FROM pg_type WHERE typcategory = 'E'"))
    for row in result:
        print(f"Enum: {row[0]}")
