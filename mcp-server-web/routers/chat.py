from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from database import get_db
from schemas.chat import Chat, ChatCreate, ChatUpdate, ChatMeta, ChatNameUpdate, ChatSummaryUpdate
from middleware.helper import protected_route
from crud import chat as crud_chat

router = APIRouter()


@router.get("/", response_model=List[ChatMeta])
async def get_user_chats(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(protected_route)
):
    """Get all chats metadata for the current user"""
    chats = await crud_chat.get_user_chats(db, current_user)

    result = []
    for chat in chats:
        last_message = None
        if chat.messages:
            # Get the last assistant message text
            assistant_messages = [
                m for m in chat.messages if m.role == "assistant"]
            if assistant_messages:
                last_msg = assistant_messages[-1]
                # Extract text from parts
                for item in last_msg.parts:
                    if item.get("type") == "text":
                        last_message = item.get("text", "")[
                            :100]  # First 100 chars
                        break

        result.append(ChatMeta(
            id=chat.id,
            name=chat.name,
            created_at=chat.created_at,
            updated_at=chat.updated_at,
            last_message=last_message,
            message_count=len(chat.messages),
            summary=chat.summary,
            last_summarized_message_id=chat.last_summarized_message_id
        ))

    return result


@router.get("/{chat_id}", response_model=Chat)
async def get_chat(
    chat_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(protected_route)
):
    """Get a specific chat with all messages"""
    chat = await crud_chat.get_chat_by_id(db, chat_id, current_user)

    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    return chat


@router.post("/", response_model=Chat)
async def create_chat(
    chat_data: ChatCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(protected_route)
):
    """Create a new chat with the first message"""
    return await crud_chat.create_chat(db, chat_data, current_user)


@router.patch("/{chat_id}", )
async def update_chat(
    chat_id: str,
    chat_update: ChatUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(protected_route)
):
    """Append new messages to an existing chat in order"""
    chat = await crud_chat.update_chat_messages(
        db, chat_id, current_user, chat_update)

    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    return {"message": "Chat updated successfully"}


@router.delete("/{chat_id}")
async def delete_chat(
    chat_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(protected_route)
):
    """Delete a chat and all its messages"""
    success = await crud_chat.delete_chat(db, chat_id, current_user)

    if not success:
        raise HTTPException(status_code=404, detail="Chat not found")

    return {"message": "Chat deleted successfully"}


@router.patch("/{chat_id}/name")
async def update_chat_name(
    chat_id: str,
    name_update: ChatNameUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(protected_route)
):
    """Update chat name"""
    chat = await crud_chat.update_chat_name(db, chat_id, current_user, name_update.name)

    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    return {"message": "Chat name updated successfully"}


@router.patch("/{chat_id}/summary")
async def update_chat_summary(
    chat_id: str,
    summary_update: ChatSummaryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(protected_route)
):
    """Update chat summary"""
    chat = await crud_chat.update_chat_summary(
        db, chat_id, current_user,
        summary_update.summary,
        summary_update.last_summarized_message_id
    )
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    return {"message": "Chat summary updated successfully"}
