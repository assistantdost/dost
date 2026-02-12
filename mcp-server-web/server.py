from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
import asyncio
from routers import users, auth, chat, mcp_store
from middleware.helper import optional_header_accessToken

app = FastAPI(title="MCP Server Web", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create database tables


async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


@app.on_event("startup")
async def startup_event():
    await create_tables()

# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
app.include_router(chat.router, prefix="/api/v1/chats", tags=["chats"])
app.include_router(
    mcp_store.router, prefix="/api/v1/mcp_store", tags=["mcp_store"])


@app.get("/")
async def root():
    return {"message": "MCP Server Web API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
