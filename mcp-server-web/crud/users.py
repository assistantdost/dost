from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, delete
from models.user import User
from schemas.users import UserCreate, UserUpdate
from typing import List, Optional


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
    async def get_user_by_google_sub(db: AsyncSession, google_sub: str) -> Optional[User]:
        result = await db.execute(select(User).where(User.google_sub == google_sub))
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
