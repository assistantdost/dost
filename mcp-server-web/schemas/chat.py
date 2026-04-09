from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict, Union, Literal
from datetime import datetime


class ChatModelInfo(BaseModel):
    id: str
    name: str
    provider: str

class TextPart(BaseModel):
    type: Literal["text"]
    text: str

class ReasoningPart(BaseModel):
    type: Literal["reasoning"]
    text: str

class ToolCallPart(BaseModel):
    type: Literal["tool-call"]
    toolCallId: str
    toolName: str
    args: Dict[str, Any]  # Renamed from 'input' for SDK compatibility

class ToolResultPart(BaseModel):
    type: Literal["tool-result"]
    toolCallId: str
    result: Dict[str, Any]  # Renamed from 'output'

# Custom/UI parts (keep for your app, but transform before SDK)
class StepStartPart(BaseModel):
    type: Literal["step-start"]

class DynamicToolPart(BaseModel):  # Your custom type
    type: Literal["dynamic-tool"]
    toolCallId: str
    toolName: str
    input: Dict[str, Any]  # Keep as-is for now
    output: Dict[str, Any]
    state: Optional[str] = None  # UI field

# Union for parts
PartsItem = Union[TextPart, ReasoningPart, ToolCallPart, ToolResultPart, StepStartPart, DynamicToolPart]


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


class PaginatedChats(BaseModel):
    chats: List[ChatMeta]
    next_cursor: Optional[str] = None


class PaginatedChatMessages(BaseModel):
    id: str
    user_id: str
    name: str
    chat_model: ChatModelInfo
    created_at: datetime
    updated_at: datetime
    summary: Optional[str] = None
    last_summarized_message_id: Optional[str] = None
    messages: List[Message] = []
    next_cursor: Optional[str] = None
    has_more_older: bool = False

    class Config:
        from_attributes = True
