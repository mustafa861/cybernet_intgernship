from app.config import settings
print(f"ai_api_key: '{settings.ai_api_key}' (len={len(settings.ai_api_key)})")
print(f"ai_api_url: '{settings.ai_api_url}'")
print(f"ai_model: '{settings.ai_model}'")
