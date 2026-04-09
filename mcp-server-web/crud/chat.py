from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func, and_, or_
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


def _parse_message_cursor(cursor: str) -> tuple[datetime, Optional[str]]:
    """Parse a message cursor formatted as '<iso_datetime>::<message_id>'"""
    if "::" in cursor:
        cursor_dt_raw, cursor_id = cursor.split("::", 1)
    else:
        cursor_dt_raw, cursor_id = cursor, None
    cursor_dt = datetime.fromisoformat(cursor_dt_raw.replace("Z", "+00:00"))
    return cursor_dt, cursor_id


def _build_message_cursor(message: MessageModel) -> str:
    return f"{message.created_at.isoformat()}::{message.id}"


def _is_older_than(a: MessageModel, b: MessageModel) -> bool:
    return (a.created_at < b.created_at) or (
        a.created_at == b.created_at and a.id < b.id
    )


async def get_chat_messages_paginated(
    db: AsyncSession,
    chat_id: str,
    user_id: str,
    limit: int = 30,
    cursor: Optional[str] = None,
):
    """
    Get chat with paginated messages.

    First load rule:
    - Load latest `limit` messages.
    - If `last_summarized_message_id` is older than the oldest loaded message,
      expand first page to include that summary boundary message.

    Older loads:
    - Cursor-based loading strictly older messages.
    """
    chat_result = await db.execute(
        select(ChatModel).where(
            ChatModel.id == chat_id,
            ChatModel.user_id == user_id,
        )
    )
    chat = chat_result.scalar_one_or_none()
    if not chat:
        return None

    base_query = select(MessageModel).where(MessageModel.chat_id == chat_id)
    messages_desc: List[MessageModel] = []

    if cursor:
        cursor_dt, cursor_id = _parse_message_cursor(cursor)
        if cursor_id:
            base_query = base_query.where(
                or_(
                    MessageModel.created_at < cursor_dt,
                    and_(
                        MessageModel.created_at == cursor_dt,
                        MessageModel.id < cursor_id,
                    ),
                )
            )
        else:
            base_query = base_query.where(MessageModel.created_at < cursor_dt)

        result = await db.execute(
            base_query
            .order_by(MessageModel.created_at.desc(), MessageModel.id.desc())
            .limit(limit)
        )
        messages_desc = result.scalars().all()
    else:
        # First load: latest `limit`
        result = await db.execute(
            base_query
            .order_by(MessageModel.created_at.desc(), MessageModel.id.desc())
            .limit(limit)
        )
        messages_desc = result.scalars().all()

        # Expand initial page to include summary boundary if needed.
        if chat.last_summarized_message_id and messages_desc:
            summary_msg_result = await db.execute(
                select(MessageModel).where(
                    MessageModel.chat_id == chat_id,
                    MessageModel.id == chat.last_summarized_message_id,
                )
            )
            summary_msg = summary_msg_result.scalar_one_or_none()

            if summary_msg:
                oldest_loaded = messages_desc[-1]
                if _is_older_than(summary_msg, oldest_loaded):
                    expanded_result = await db.execute(
                        select(MessageModel)
                        .where(MessageModel.chat_id == chat_id)
                        .where(
                            or_(
                                MessageModel.created_at > summary_msg.created_at,
                                and_(
                                    MessageModel.created_at == summary_msg.created_at,
                                    MessageModel.id >= summary_msg.id,
                                ),
                            )
                        )
                        .order_by(
                            MessageModel.created_at.desc(),
                            MessageModel.id.desc(),
                        )
                    )
                    messages_desc = expanded_result.scalars().all()

    if not messages_desc:
        return {
            "chat": chat,
            "messages": [],
            "next_cursor": None,
            "has_more_older": False,
        }

    oldest_loaded = messages_desc[-1]
    older_exists_result = await db.execute(
        select(func.count())
        .select_from(MessageModel)
        .where(MessageModel.chat_id == chat_id)
        .where(
            or_(
                MessageModel.created_at < oldest_loaded.created_at,
                and_(
                    MessageModel.created_at == oldest_loaded.created_at,
                    MessageModel.id < oldest_loaded.id,
                ),
            )
        )
    )
    has_more_older = older_exists_result.scalar_one() > 0
    next_cursor = _build_message_cursor(oldest_loaded) if has_more_older else None

    # UI expects chronological order.
    messages_asc = list(reversed(messages_desc))

    return {
        "chat": chat,
        "messages": messages_asc,
        "next_cursor": next_cursor,
        "has_more_older": has_more_older,
    }


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
