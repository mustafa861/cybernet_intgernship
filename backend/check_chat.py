import uuid
import sys
sys.path.insert(0, ".")
from app.database import SessionLocal
from app.services.ai_service import run_agent

db = SessionLocal()
user_id = "fb74411c-8583-49e9-a84e-e602b1faa02b"
try:
    reply, actions, _ = run_agent(db=db, user_id=user_id, message="list my entries")
    print("Reply:", reply)
    print("Actions:", actions)
except Exception as e:
    print(f"Error: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()
finally:
    db.close()
