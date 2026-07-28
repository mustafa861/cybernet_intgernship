import asyncio
import json
import uuid

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models import Conversation, ChatMessage
from app.schemas.pydantic_models import ActionTaken, ChatRequest, ChatResponse
from app.services.ai_service import run_agent, generate_title

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
async def chat(
    body: ChatRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    uid = uuid.UUID(user_id)

    if body.conversation_id:
        conv = (
            db.query(Conversation)
            .filter(Conversation.id == body.conversation_id, Conversation.user_id == uid)
            .first()
        )
        if not conv:
            conv = Conversation(id=body.conversation_id, user_id=uid)
            db.add(conv)
            db.flush()
    else:
        conv = Conversation(user_id=uid)
        db.add(conv)
        db.flush()

    messages_before = (
        db.query(ChatMessage)
        .filter(ChatMessage.conversation_id == conv.id)
        .order_by(ChatMessage.created_at)
        .all()
    )
    history = [{"role": m.role, "content": m.content} for m in messages_before]
    is_first = len(messages_before) == 0

    reply, actions, _ = run_agent(
        db=db, user_id=user_id, message=body.message, conversation_history=history
    )

    db_user_msg = ChatMessage(
        conversation_id=conv.id,
        role="user",
        content=body.message,
    )
    db.add(db_user_msg)
    db_assistant_msg = ChatMessage(
        conversation_id=conv.id,
        role="assistant",
        content=reply,
    )
    db.add(db_assistant_msg)

    if is_first:
        title = generate_title(body.message)
        conv.title = title

    db.commit()

    return ChatResponse(
        conversation_id=conv.id,
        reply=reply,
        actions_taken=[
            ActionTaken(
                tool=a.tool,
                input=a.input,
                result_summary=a.result_summary,
            )
            for a in actions
        ],
    )


@router.post("/stream")
async def chat_stream(
    body: ChatRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    uid = uuid.UUID(user_id)

    if body.conversation_id:
        conv = (
            db.query(Conversation)
            .filter(Conversation.id == body.conversation_id, Conversation.user_id == uid)
            .first()
        )
        if not conv:
            conv = Conversation(id=body.conversation_id, user_id=uid)
            db.add(conv)
            db.flush()
    else:
        conv = Conversation(user_id=uid)
        db.add(conv)
        db.flush()

    messages_before = (
        db.query(ChatMessage)
        .filter(ChatMessage.conversation_id == conv.id)
        .order_by(ChatMessage.created_at)
        .all()
    )
    history = [{"role": m.role, "content": m.content} for m in messages_before]
    is_first = len(messages_before) == 0

    db_user_msg = ChatMessage(
        conversation_id=conv.id,
        role="user",
        content=body.message,
    )
    db.add(db_user_msg)

    async def event_stream():
        reply, actions, _ = run_agent(
            db=db, user_id=user_id, message=body.message, conversation_history=history
        )

        yield f"event: meta\ndata: {json.dumps({'conversation_id': str(conv.id)})}\n\n"

        CHUNK_SIZE = 10
        for i in range(0, len(reply), CHUNK_SIZE):
            chunk = reply[i:i + CHUNK_SIZE]
            yield f"event: token\ndata: {json.dumps(chunk)}\n\n"
            await asyncio.sleep(0.02)

        db_assistant_msg = ChatMessage(
            conversation_id=conv.id,
            role="assistant",
            content=reply,
        )
        db.add(db_assistant_msg)

        if is_first:
            title = generate_title(body.message)
            conv.title = title

        db.commit()

        yield f"event: done\ndata: {json.dumps({'actions_taken': [{'tool': a.tool, 'input': a.input, 'result_summary': a.result_summary} for a in actions]})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
