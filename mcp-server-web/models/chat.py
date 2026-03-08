from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
from ulid import ULID


class Chat(Base):
    __tablename__ = "chats"

    @staticmethod
    def generate_ulid():
        return f"{str(ULID())}"

    id = Column(String, default=generate_ulid.__func__,
                primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)

    summary = Column(Text, nullable=True)
    last_summarized_message_id = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True),
                        server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="chats")
    messages = relationship(
        "Message", back_populates="chat", cascade="all, delete-orphan", order_by="Message.created_at")


class Message(Base):
    __tablename__ = "messages"

    @staticmethod
    def generate_ulid():
        return f"{str(ULID())}"

    id = Column(String, primary_key=True, index=True,
                default=generate_ulid.__func__)
    chat_id = Column(String, ForeignKey("chats.id"), nullable=False)
    role = Column(String(50), nullable=False)  # user, assistant, tool
    parts = Column(JSON, nullable=False)  # Array of parts objects
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    chat = relationship("Chat", back_populates="messages")
