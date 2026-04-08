from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func
from sqlalchemy.orm import selectinload
from models.chat import Chat as ChatModel, Message as MessageModel
from schemas.chat import ChatCreate, ChatUpdate
from typing import List, Optional
from datetime import datetime, timezone, timedelta  # ✅ add timedelta


async def get_user_chats(db: AsyncSession, user_id: str, limit: int = 20, cursor: Optional[str] = None) -> List[ChatModel]:
    """Get paginated chats for a user with cursor-based pagination"""
    query = select(ChatModel).where(ChatModel.user_id == user_id)

    if cursor:
        # Cursor is the last updated_at in ISO format
        cursor_dt = datetime.fromisoformat(cursor.replace('Z', '+00:00'))
        query = query.where(ChatModel.updated_at < cursor_dt)

    query = query.order_by(ChatModel.updated_at.desc()).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


async def get_chat_by_id(db: AsyncSession, chat_id: str, user_id: str) -> Optional[ChatModel]:
    """Get a specific chat by ID for a user"""
    result = await db.execute(
        select(ChatModel).options(selectinload(ChatModel.messages)).where(
            ChatModel.id == chat_id,
            ChatModel.user_id == user_id
        )
    )
    return result.scalar_one_or_none()


async def create_chat(db: AsyncSession, chat_data: ChatCreate, user_id: str) -> ChatModel:
    """Create a new chat with the first message"""
    # Extract first user message text for name
    first_message_text = ""
    for item in chat_data.first_message.parts:
        if item.type == "text" and item.text:
            first_message_text = item.text
            break

    # Generate chat name from first message (max 30 chars)
    chat_name = first_message_text[:30].strip(
    ) if first_message_text else "New Chat"

    # Create chat
    db_chat = ChatModel(
        user_id=user_id,
        name=chat_name,
        chat_model=chat_data.chat_model.model_dump()
    )
    db.add(db_chat)
    await db.flush()  # Get chat.id

    # Create first message
    db_message = MessageModel(
        id=chat_data.first_message.id,
        chat_id=db_chat.id,
        role=chat_data.first_message.role,
        parts=[item.model_dump() for item in chat_data.first_message.parts]
    )
    db.add(db_message)

    await db.commit()

    # Load the chat with messages using selectinload
    stmt = select(ChatModel).options(selectinload(
        ChatModel.messages)).where(ChatModel.id == db_chat.id)
    result = await db.execute(stmt)
    chat = result.scalar_one()

    return chat


async def update_chat_messages(db: AsyncSession, chat_id: str, user_id: str, chat_update: ChatUpdate) -> Optional[ChatModel]:
    """Append new messages to an existing chat in the order they are provided"""
    chat = await get_chat_by_id(db, chat_id, user_id)

    if not chat:
        return None

    try:
        base_time = datetime.now(timezone.utc)  # ✅ single base time

        for i, message_data in enumerate(chat_update.messages):
            db_message = MessageModel(
                id=message_data.id,
                chat_id=chat.id,
                role=message_data.role,
                parts=[item.model_dump() for item in message_data.parts],
                created_at=base_time +
                timedelta(milliseconds=i)  # ✅ +0ms, +1ms
            )
            db.add(db_message)

        chat.updated_at = datetime.now(timezone.utc)
        db.add(chat)

        await db.flush()
        await db.commit()
        # await db.refresh(chat)

        return True

    except Exception as e:
        await db.rollback()
        raise e


async def delete_chat(db: AsyncSession, chat_id: str, user_id: str) -> bool:
    """Delete a chat and all its messages"""
    chat = await get_chat_by_id(db, chat_id, user_id)

    if not chat:
        return False

    await db.delete(chat)
    await db.commit()

    return True


async def update_chat_name(db: AsyncSession, chat_id: str, user_id: str, name: str) -> Optional[ChatModel]:
    """Update chat name"""
    chat = await get_chat_by_id(db, chat_id, user_id)

    if not chat:
        return None

    chat.name = name[:30].strip()  # Max 30 chars
    await db.commit()
    await db.refresh(chat)

    return chat


async def update_chat_summary(db: AsyncSession, chat_id: str, user_id: str, summary: str, last_summarized_message_id: str) -> Optional[ChatModel]:
    """Update chat summary"""
    chat = await get_chat_by_id(db, chat_id, user_id)
    if not chat:
        return None

    chat.summary = summary
    chat.last_summarized_message_id = last_summarized_message_id
    await db.commit()
    await db.refresh(chat)
    return chat
