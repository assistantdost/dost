from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
import asyncio
from routers import users, auth, chat, mcp_store, llm_models, api_keys
from middleware.helper import optional_header_accessToken

app = FastAPI(title="MCP Server Web", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # Vite dev server
        "http://localhost:5599",   # Electron Express server
        "app://localhost",         # Packaged Electron app
        "http://localhost:3000",   # Next.js dev server project frontend
    ],
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
app.include_router(api_keys.router, prefix="/api/v1/api-keys", tags=["api-keys"])
app.include_router(chat.router, prefix="/api/v1/chats", tags=["chats"])
app.include_router(
    mcp_store.router, prefix="/api/v1/mcp_store", tags=["mcp_store"])
app.include_router(
    llm_models.router, prefix="/api/v1/llm_models", tags=["llm_models"])


@app.get("/")
async def root():
    return {"message": "MCP Server Web API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
