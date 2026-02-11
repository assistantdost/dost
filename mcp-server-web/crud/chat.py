from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func
from sqlalchemy.orm import selectinload
from models.chat import Chat as ChatModel, Message as MessageModel
from schemas.chat import ChatCreate, ChatUpdate
from typing import List, Optional


async def get_user_chats(db: AsyncSession, user_id: str) -> List[ChatModel]:
    """Get all chats for a user"""
    result = await db.execute(select(ChatModel).options(selectinload(ChatModel.messages)).where(ChatModel.user_id == user_id))
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
        name=chat_name
    )
    db.add(db_chat)
    await db.flush()  # Get chat.id

    # Create first message
    db_message = MessageModel(
        id=chat_data.first_message.id,
        chat_id=db_chat.id,
        role=chat_data.first_message.role,
        parts=[item.dict() for item in chat_data.first_message.parts]
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

    # Append new messages in order
    for message_data in chat_update.messages:
        db_message = MessageModel(
            id=message_data.id,
            chat_id=chat.id,
            role=message_data.role,
            parts=[item.dict() for item in message_data.parts]
        )
        db.add(db_message)

    # Update chat's updated_at timestamp
    chat.updated_at = func.now()

    await db.commit()

    # Load the updated chat with all messages
    stmt = select(ChatModel).options(selectinload(
        ChatModel.messages)).where(ChatModel.id == chat_id)
    result = await db.execute(stmt)
    updated_chat = result.scalar_one()

    return updated_chat


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
