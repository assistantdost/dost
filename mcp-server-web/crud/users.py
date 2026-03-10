import secrets
import hashlib
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, delete
from models.user import User, OAuthAccount, APIKey
from schemas.users import UserCreate, UserUpdate, OAuthAccountCreate
from typing import List, Optional, Tuple


class CRUDUser:
    @staticmethod
    async def get_user_by_id(db: AsyncSession, user_id: str) -> Optional[User]:
        result = await db.execute(select(User).where(User.id == user_id))
        return result.scalars().first()

    @staticmethod
    async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
        result = await db.execute(select(User).where(User.email == email))
        return result.scalars().first()

    @staticmethod
    async def get_users(db: AsyncSession, skip: int = 0, limit: int = 100) -> List[User]:
        result = await db.execute(select(User).offset(skip).limit(limit))
        return result.scalars().all()

    @staticmethod
    async def create_user(db: AsyncSession, user: UserCreate) -> User:
        db_user = User(**user.dict())
        db.add(db_user)
        await db.commit()
        await db.refresh(db_user)
        return db_user

    @staticmethod
    async def update_user(db: AsyncSession, user_id: str, user_update: UserUpdate) -> Optional[User]:
        update_data = user_update.dict(exclude_unset=True)
        if update_data:
            await db.execute(
                update(User).where(User.id == user_id).values(**update_data)
            )
            await db.commit()
        result = await db.execute(select(User).where(User.id == user_id))
        return result.scalars().first()

    @staticmethod
    async def delete_user(db: AsyncSession, user_id: str) -> bool:
        result = await db.execute(delete(User).where(User.id == user_id))
        await db.commit()
        return result.rowcount > 0


class CRUDOAuthAccount:
    @staticmethod
    async def get_by_provider(
        db: AsyncSession, provider: str, provider_user_id: str
    ) -> Optional[OAuthAccount]:
        result = await db.execute(
            select(OAuthAccount).where(
                OAuthAccount.provider == provider,
                OAuthAccount.provider_user_id == provider_user_id,
            )
        )
        return result.scalars().first()

    @staticmethod
    async def create(db: AsyncSession, data: OAuthAccountCreate) -> OAuthAccount:
        account = OAuthAccount(**data.dict())
        db.add(account)
        await db.commit()
        await db.refresh(account)
        return account


class CRUDAPIKey:
    @staticmethod
    async def create(
        db: AsyncSession, user_id: str, name: str, key_hash: str
    ) -> APIKey:
        api_key = APIKey(user_id=user_id, name=name, key_hash=key_hash)
        db.add(api_key)
        await db.commit()
        await db.refresh(api_key)
        return api_key

    @staticmethod
    async def get_by_user(db: AsyncSession, user_id: str) -> List[APIKey]:
        result = await db.execute(
            select(APIKey).where(
                APIKey.user_id == user_id,
                APIKey.revoked == False,  # noqa: E712
            )
        )
        return result.scalars().all()

    @staticmethod
    def generate_key() -> Tuple[str, str]:
        """Returns (raw_key, key_hash). Raw key is shown only once."""
        raw_key = f"dost_{secrets.token_urlsafe(32)}"
        key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
        return raw_key, key_hash

    @staticmethod
    async def get_by_key_hash(db: AsyncSession, key_hash: str) -> Optional[APIKey]:
        result = await db.execute(
            select(APIKey).where(
                APIKey.key_hash == key_hash,
                APIKey.revoked == False,  # noqa: E712
            )
        )
        return result.scalars().first()

    @staticmethod
    async def revoke(db: AsyncSession, key_id: str, user_id: str) -> bool:
        result = await db.execute(
            update(APIKey)
            .where(APIKey.id == key_id, APIKey.user_id == user_id)
            .values(revoked=True)
        )
        await db.commit()
        return result.rowcount > 0

    @staticmethod
    async def delete(db: AsyncSession, key_id: str, user_id: str) -> bool:
        result = await db.execute(
            delete(APIKey).where(
                APIKey.id == key_id, APIKey.user_id == user_id
            )
        )
        await db.commit()
        return result.rowcount > 0