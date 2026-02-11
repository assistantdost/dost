from sqlalchemy import Column, Integer, String, DateTime, Boolean, func
from sqlalchemy.orm import relationship
from database import Base
from ulid import ULID


class User(Base):
    __tablename__ = "users"

    @staticmethod
    def generate_ulid():
        return f"{str(ULID())}"

    id = Column(String, default=generate_ulid.__func__,
                primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=True)  # Nullable for OAuth users
    google_sub = Column(String, unique=True, nullable=True)
    role = Column(String, default="user")
    email_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    chats = relationship("Chat", back_populates="user")
