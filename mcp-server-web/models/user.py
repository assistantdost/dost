from sqlalchemy import Column, Integer, String, DateTime, Boolean, func, Enum, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from database import Base
from ulid import ULID


class User(Base):
    __tablename__ = "users"

    @staticmethod
    def generate_ulid():
        return str(ULID())

    id = Column(String, default=generate_ulid,
                primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=True)  # Nullable for OAuth users
    role = Column(Enum("user", "admin", "service", name="user_roles"), default="user")
    email_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    chats = relationship("Chat", back_populates="user")


class OAuthAccount(Base):
    __tablename__ = "oauth_accounts"

    id = Column(String, primary_key=True, default=lambda: str(ULID()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    provider = Column(String, nullable=False)  # e.g., 'google', 'github'
    provider_user_id = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (UniqueConstraint("provider", "provider_user_id"),)


class APIKey(Base):
    __tablename__ = "api_keys"

    id = Column(String, primary_key=True, default=lambda: str(ULID()))
    user_id = Column(String, ForeignKey("users.id"))
    name = Column(String)
    key_hash = Column(String, nullable=False, unique=True, index=True)
    revoked = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_used = Column(DateTime(timezone=True))
