from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from sqlalchemy.orm import selectinload
from models.chat import Chat as ChatModel, Message as MessageModel
from schemas.chat import ChatCreate, ChatUpdate
from typing import List, Optional
from datetime import datetime, timezone, timedelta  # ✅ add timedelta
import ulid


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


# =================== Helper functions for paginated messages ===================

def _parse_message_cursor(cursor: str) -> tuple[datetime, str]:
    """Cursor format: <iso_datetime>::<message_id>"""
    cursor_dt_raw, cursor_id = cursor.split("::", 1)
    cursor_dt = datetime.fromisoformat(cursor_dt_raw.replace("Z", "+00:00"))
    return cursor_dt, cursor_id


def _build_message_cursor(message: MessageModel) -> str:
    """Build cursor from the oldest message in the current page."""
    return f"{message.created_at.isoformat()}::{message.id}"


def _decode_ulid_time(ulid_str: str) -> Optional[datetime]:
    """Decode ULID timestamp using python-ulid and return UTC datetime."""
    if not ulid_str:
        return None
    try:
        value = ulid.from_str(ulid_str)
        ts_ms = value.timestamp().int
        return datetime.fromtimestamp(ts_ms / 1000, tz=timezone.utc)
    except Exception:
        return None


def _as_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


async def get_chat_messages_paginated(
    db: AsyncSession,
    chat_id: str,
    user_id: str,
    limit: int = 30,
    cursor: Optional[str] = None,
):
    """
    Get chat with paginated messages.

    Load paginated messages with cursor support.

    First-load rule:
    - Start with latest limit messages.
    - If last_summarized_message_id is older than the oldest loaded message,
      expand first load up to that summarized boundary.

    Examples (negative index from latest):
    - boundary at -17 => load -30 (keep 30)
    - boundary at -35 => load -35 (expand to include boundary)
    """
    # 1) Validate ownership of chat and fetch chat metadata once.
    chat_result = await db.execute(
        select(ChatModel).where(
            ChatModel.id == chat_id,
            ChatModel.user_id == user_id,
        )
    )
    chat = chat_result.scalar_one_or_none()
    if not chat:
        return None

    # 2) Reusable predicate for "strictly older" comparisons.
    # We compare (created_at, id) so ordering remains stable when timestamps match.
    def older_than(created_at: datetime, message_id: str):
        return or_(
            MessageModel.created_at < created_at,
            and_(
                MessageModel.created_at == created_at,
                MessageModel.id < message_id,
            ),
        )

    # 3) Reusable predicate for "newer than or equal to" a boundary message.
    # Used only during first-load expansion to include summary checkpoint boundary.
    def newer_or_equal(created_at: datetime, message_id: str):
        return or_(
            MessageModel.created_at > created_at,
            and_(
                MessageModel.created_at == created_at,
                MessageModel.id >= message_id,
            ),
        )

    # 4) Build base page query.
    # Descending order means first row is newest, last row is oldest in the page.
    order_desc = (MessageModel.created_at.desc(), MessageModel.id.desc())
    base_query = select(MessageModel).where(MessageModel.chat_id == chat_id)
    page_size = max(1, int(limit))

    # 5) Apply cursor boundary when loading older pages.
    page_query = base_query
    if cursor:
        cursor_dt, cursor_id = _parse_message_cursor(cursor)
        page_query = page_query.where(older_than(cursor_dt, cursor_id))

    # 6) Fetch one page plus one extra row.
    # The extra row tells us if another older page exists.
    page_result = await db.execute(
        page_query.order_by(*order_desc).limit(page_size + 1)
    )
    page_rows: List[MessageModel] = page_result.scalars().all()
    has_more_older = len(page_rows) > page_size
    messages_desc: List[MessageModel] = page_rows[:page_size]

    # 7) Optional first-load expansion to include summary boundary.
    # This only applies on the first load (no cursor).
    # We decode timestamp directly from last_summarized_message_id ULID,
    # so we don't need an extra DB read for the summary boundary message.
    if not cursor and chat.last_summarized_message_id and messages_desc:
        summary_id = chat.last_summarized_message_id
        summary_time = _decode_ulid_time(summary_id)
        oldest_loaded = messages_desc[-1]
        oldest_loaded_time = _as_utc(oldest_loaded.created_at)

        if summary_time and (
            summary_time < oldest_loaded_time
            or (
                summary_time == oldest_loaded_time
                and summary_id < oldest_loaded.id
            )
        ):
            expanded_result = await db.execute(
                select(MessageModel)
                .where(MessageModel.chat_id == chat_id)
                .where(newer_or_equal(summary_time, summary_id))
                .order_by(*order_desc)
            )
            messages_desc = expanded_result.scalars().all()

    # 8) Empty page response.
    if not messages_desc:
        return {
            "chat": chat,
            "messages": [],
            "next_cursor": None,
            "has_more_older": False,
        }

    # 9) Cursor is always built from the oldest returned message.
    oldest_loaded = messages_desc[-1]
    next_cursor = _build_message_cursor(oldest_loaded) if has_more_older else None

    # 10) API/UI expects chronological order (oldest -> newest).
    messages_asc = list(reversed(messages_desc))

    return {
        "chat": chat,
        "messages": messages_asc,
        "next_cursor": next_cursor,
        "has_more_older": has_more_older,
    }


# =================== Paginated options end ===================

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
