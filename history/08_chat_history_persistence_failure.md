# Prompt

**User:** The chat conversation history is failing to persist. Messages are not being saved to the database and consequently do not survive a page refresh. When I navigate away and return, all prior exchanges have vanished. Please investigate the data persistence layer and rectify this issue.

---

## Response

**OpenCode:** Identified two compounding defects within the streaming endpoint (`/chat/stream`):

**Defect A — DetachedInstanceError:** After `db.commit()` was invoked on line 124, SQLAlchemy's default `expire_on_commit` behaviour expired all ORM-managed objects, including the `conv` instance. When the `event_stream` async generator subsequently accessed `conv.id`, SQLAlchemy attempted a lazy-load refresh from a session that was no longer in a valid state, raising `DetachedInstanceError`.

**Defect B — Silent Failure Propagation:** The `event_stream` generator lacked any exception handling wrapper. Any error during streaming (including the DetachedInstanceError) would terminate the generator without reaching the `db.commit()` that persists the assistant message. Furthermore, the user message was added to the session but not committed before streaming commenced, so an error would discard both messages.

**Resolution:**
1. Captured `conv_id = conv.id` as a local variable before any commit operation, eliminating the need to access the expired ORM instance.
2. Committed the user message immediately after adding it to the session (line 124), ensuring it survives regardless of stream outcome.
3. Wrapped the entire generator body in a try-except block that performs `db.rollback()` on failure and re-raises the exception.
4. Used an explicit `db.query().update()` for the conversation title rather than assigning to the expired `conv.title` property.
