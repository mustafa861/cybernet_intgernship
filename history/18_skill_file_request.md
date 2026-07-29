# Prompt

**User:** Create a skill.md file documenting the chatbot implementation so that future development or maintenance of the conversational AI assistant can be performed efficiently.

---

## Response

**OpenCode:** Created `skills.md` in the project root directory. The document covers:

- **Architecture overview** — backend service layer, routers, ORM models, and frontend components with their file paths
- **Tool registration pattern** — how new tools are defined, parameterised with Pydantic, and registered in `_REGISTRY`
- **LLM call flow** — `run_agent()` → `_call_llm()` → `_call_openai()` or `_mock_llm()`
- **Tool call parsing** — three supported formats: single object, JSON array, and adjacent objects per line
- **SSE streaming protocol** — `POST /chat/stream` with `meta`, `token`, and `done` event types
- **Conversation persistence** — user message committed immediately, assistant message post-stream, auto-title on first turn
- **Mock LLM keyword map** — table of trigger words mapped to their corresponding tool
- **Key files reference** — all relevant backend and frontend files with their purposes
