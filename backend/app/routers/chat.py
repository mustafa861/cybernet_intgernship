import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.schemas.pydantic_models import ActionTaken, ChatRequest, ChatResponse
from app.services.ai_service import run_agent

router = APIRouter(prefix="/chat", tags=["chat"])

_in_memory_conversations: dict[str, list] = {}


@router.post("", response_model=ChatResponse)
async def chat(
    body: ChatRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    conv_id = body.conversation_id or uuid.uuid4()
    conv_key = str(conv_id)
    history = _in_memory_conversations.get(conv_key, [])

    reply, actions, _ = run_agent(
        db=db, user_id=user_id, message=body.message, conversation_history=history
    )

    _in_memory_conversations[conv_key] = history

    return ChatResponse(
        conversation_id=conv_id,
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
