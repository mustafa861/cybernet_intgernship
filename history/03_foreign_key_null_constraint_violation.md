# Prompt

**User:** The server is throwing a `NotNullViolation` database exception indicating that a null value is being inserted into the `conversation_id` column of the `chat_messages` table, which contravenes the not-null constraint. The accompanying SQL statement reveals that when a conversation is deleted, the system is attempting to set `conversation_id` to NULL for all associated messages rather than removing them. Please rectify this referential integrity issue.

---

## Response

**OpenCode:** Diagnosed that the `Conversation.messages` SQLAlchemy relationship lacked a cascade directive, defaulting to 'save-update, merge' behaviour. When `db.delete(conv)` was invoked, the ORM attempted to disassociate child rows by nullifying the foreign key rather than cascading the deletion. Added `cascade="all, delete-orphan"` to the relationship definition, ensuring that deleting a Conversation performs a cascading delete on all associated ChatMessage records.
