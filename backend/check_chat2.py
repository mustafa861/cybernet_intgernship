import json
import uuid
import sys
sys.path.insert(0, ".")
from app.database import SessionLocal
from app.models import Entry
from sqlalchemy.orm import Session
from app.services import entry_service
from app.services.ai_service import run_agent, _call_llm, _parse_tool_call, get_tool, _REGISTRY, _mock_llm
from datetime import date

db = SessionLocal()
user_id = "fb74411c-8583-49e9-a84e-e602b1faa02b"

# Test 1: _mock_llm
print("=== Test _mock_llm ===")
resp = _mock_llm("system", [{"role": "user", "content": "list my entries"}])
print(f"Mock response: {resp}")

# Test 2: _parse_tool_call
print("\n=== Test _parse_tool_call ===")
parsed = _parse_tool_call(resp)
print(f"Parsed: {parsed}")

# Test 3: get_tool
print("\n=== Test get_tool ===")
if parsed:
    tool = get_tool(parsed["tool"])
    print(f"Tool: {tool}")
    if tool:
        # Test 4: tool.execute
        print("\n=== Test tool.execute ===")
        try:
            result = tool.execute(db, user_id, **parsed["arguments"])
            print(f"Result: {result}")
        except Exception as e:
            print(f"Execute error: {type(e).__name__}: {e}")
            import traceback
            traceback.print_exc()

# Test 5: Full run_agent
print("\n=== Test run_agent ===")
try:
    reply, actions, _ = run_agent(db=db, user_id=user_id, message="list my entries")
    print(f"Reply: {reply}")
    print(f"Actions: {actions}")
except Exception as e:
    print(f"run_agent error: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()

db.close()
