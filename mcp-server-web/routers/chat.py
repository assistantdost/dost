from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from database import get_db
from schemas.chat import Chat, ChatCreate, ChatUpdate, ChatMeta, ChatNameUpdate, ChatSummaryUpdate, PaginatedChats
from middleware.helper import protected_route
from crud import chat as crud_chat

router = APIRouter()


@router.get("/", response_model=PaginatedChats)
async def get_user_chats(
    limit: int = Query(20, ge=1, le=100),
    cursor: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(protected_route)
):
    """Get paginated chats metadata for the current user"""
    chats = await crud_chat.get_user_chats(db, current_user, limit, cursor)

    result = []
    for chat in chats:
        result.append(ChatMeta(
            id=chat.id,
            name=chat.name,
            chat_model=chat.chat_model,
            created_at=chat.created_at,
            updated_at=chat.updated_at,
            summary=chat.summary,
            last_summarized_message_id=chat.last_summarized_message_id
        ))

    next_cursor = result[-1].updated_at.isoformat() if result and len(result) == limit else None

    return PaginatedChats(chats=result, next_cursor=next_cursor)


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
