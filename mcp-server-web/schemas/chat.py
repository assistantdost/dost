from pydantic import BaseModel
from typing import List, Optional, Any, Dict
from datetime import datetime


class ChatModelInfo(BaseModel):
    id: str
    name: str
    provider: str

class PartsItem(BaseModel):
    type: str  # text, reasoning, tool-call, tool-result
    text: Optional[str] = None
    toolCallId: Optional[str] = None
    toolName: Optional[str] = None
    input: Optional[Dict[str, Any]] = None
    output: Optional[Dict[str, Any]] = None


class MessageBase(BaseModel):
    role: str
    parts: List[PartsItem]


class MessageCreate(MessageBase):
    # Allow client to specify ID or generate on server
    id: Optional[str] = None


class Message(MessageBase):
    id: str
    chat_id: str
    created_at: datetime

    class Config:
        from_attributes = True


class ChatBase(BaseModel):
    name: str


class ChatCreate(BaseModel):
    chat_model: ChatModelInfo
    first_message: MessageCreate


class ChatUpdate(BaseModel):
    messages: List[MessageCreate]


class ChatNameUpdate(BaseModel):
    name: str


class ChatSummaryUpdate(BaseModel):
    summary: str
    last_summarized_message_id: str
    last_summarized_message_id: str


class Chat(ChatBase):
    id: str
    user_id: str
    chat_model: ChatModelInfo
    created_at: datetime
    updated_at: datetime
    summary: Optional[str] = None
    last_summarized_message_id: Optional[str] = None
    messages: List[Message] = []

    class Config:
        from_attributes = True


class ChatMeta(BaseModel):
    id: str
    name: str
    chat_model: ChatModelInfo
    created_at: datetime
    updated_at: datetime
    summary: Optional[str] = None
    last_summarized_message_id: Optional[str] = None

    class Config:
        from_attributes = True
