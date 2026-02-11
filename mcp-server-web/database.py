from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession


# Set the event loop policy for Windows
if os.name == 'nt':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

load_dotenv()

# Database Connection String
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL").replace(
    "postgres://", "postgresql+asyncpg://")

# Create Engine with optimal settings
engine = create_async_engine(
    SQLALCHEMY_DATABASE_URL,
    echo=False,
    future=True,             # Log SQL Queries
    pool_size=10,          # Number of connections to keep open in the pool
    max_overflow=20,       # Maximum number of connections to allow above pool_size
    pool_timeout=30,       # Number of seconds to wait before giving up on getting a connection
    pool_recycle=1800,     # Number of seconds a connection can persist before being recycled
)

# Create a global scoped session
SessionLocal = sessionmaker(
    engine, expire_on_commit=False, class_=AsyncSession
)
print("Database Session Created")


# @atexit.register
# def close_db():
#     print("Closing Database Session")
#     SessionLocal.remove()


# Base Class for Models
Base = declarative_base()

# Dependency Injection for Database Session


# def get_db():
#     db = SessionLocal()
#     try:
#        yield db
#     finally:
#        SessionLocal.remove()


async def get_db():
    async with SessionLocal() as session:
        yield session
