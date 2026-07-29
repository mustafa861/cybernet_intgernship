import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.main import app as fastapi_app


class CORSWrapper:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        if scope["method"] == "OPTIONS":
            await send({
                "type": "http.response.start",
                "status": 200,
                "headers": [
                    (b"access-control-allow-origin", b"https://caaccountingai-p1.vercel.app"),
                    (b"access-control-allow-methods", b"GET, POST, PUT, DELETE, PATCH, OPTIONS"),
                    (b"access-control-allow-headers", b"*"),
                    (b"access-control-allow-credentials", b"true"),
                    (b"content-length", b"0"),
                ],
            })
            await send({"type": "http.response.body", "body": b""})
            return

        async def send_with_cors(message):
            if message["type"] == "http.response.start":
                h = [
                    kv for kv in message.get("headers", [])
                    if kv[0].lower() not in {
                        b"access-control-allow-origin",
                        b"access-control-allow-methods",
                        b"access-control-allow-headers",
                        b"access-control-allow-credentials",
                    }
                ]
                h.extend([
                    (b"access-control-allow-origin", b"https://caaccountingai-p1.vercel.app"),
                    (b"access-control-allow-methods", b"GET, POST, PUT, DELETE, PATCH, OPTIONS"),
                    (b"access-control-allow-headers", b"*"),
                    (b"access-control-allow-credentials", b"true"),
                ])
                message["headers"] = h
            await send(message)

        await self.app(scope, receive, send_with_cors)


app = CORSWrapper(fastapi_app)
