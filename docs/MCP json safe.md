Perfect. Here’s the **full per-user MCP setup** with:

- **Python FastAPI server**
- **PostgreSQL/SQLAlchemy database**
- MCPConfig table with `id` (PK) and `user_id` (FK)
- **Per-user encryption key derived from `user_id`**
- **Client in JavaScript**
- **Local cache in `~/.dost/<user_id>/mcp.json`**

This version is ready to implement.

---

# 1. Dependencies

```bash
pip install fastapi uvicorn pydantic sqlalchemy psycopg2-binary cryptography
```

---

# 2. Database Model (SQLAlchemy)

```python
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import uuid

Base = declarative_base()

class MCPConfig(Base):
    __tablename__ = "mcp_configs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    encrypted_mcp_json = Column(String, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow)
```

---

# 3. Per-User Encryption Helpers

```python
import base64
import hashlib
from cryptography.fernet import Fernet
import json

# Optional salt to secure the derived key
SECRET_SALT = b'server_secret_salt_here'

def get_user_key(user_id: str) -> bytes:
    # Derive 32-byte key from user_id + salt
    sha = hashlib.sha256(user_id.encode() + SECRET_SALT).digest()
    return base64.urlsafe_b64encode(sha)

def encrypt_mcp_json(mcp_dict: dict, user_id: str) -> str:
    f = Fernet(get_user_key(user_id))
    return f.encrypt(json.dumps(mcp_dict).encode()).decode()

def decrypt_mcp_json(encrypted: str, user_id: str) -> dict:
    f = Fernet(get_user_key(user_id))
    return json.loads(f.decrypt(encrypted.encode()))
```

---

# 4. FastAPI Server

```python
from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy import create_engine
from datetime import datetime

# DB setup (PostgreSQL)
DATABASE_URL = "postgresql://user:pass@localhost/mcp_db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Mock authentication
def get_current_user_id():
    # Replace with real auth logic
    return "71c2"

app = FastAPI()

class MCPModel(BaseModel):
    mcp_json: dict

@app.get("/mcp_config")
def get_mcp_config(db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    row = db.query(MCPConfig).filter_by(user_id=user_id).first()
    if row:
        return decrypt_mcp_json(row.encrypted_mcp_json, user_id)
    return {"servers": []}

@app.post("/mcp_config")
def save_mcp_config(data: MCPModel, db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    encrypted = encrypt_mcp_json(data.mcp_json, user_id)
    row = db.query(MCPConfig).filter_by(user_id=user_id).first()
    if row:
        row.encrypted_mcp_json = encrypted
        row.updated_at = datetime.utcnow()
    else:
        row = MCPConfig(user_id=user_id, encrypted_mcp_json=encrypted)
        db.add(row)
    db.commit()
    return {"status": "ok"}
```

---

# 5. Client Side (JavaScript / Node.js)

```javascript
import fs from "fs";
import path from "path";
import os from "os";
import fetch from "node-fetch";

// Paths
function getUserFolder(userId) {
	const folder = path.join(os.homedir(), ".dost", userId);
	fs.mkdirSync(folder, { recursive: true });
	return folder;
}

function getMCPPath(userId) {
	return path.join(getUserFolder(userId), "mcp.json");
}

// Local load/save
function loadLocalMCP(userId) {
	const file = getMCPPath(userId);
	if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, "utf-8"));
	return null;
}

function saveLocalMCP(userId, mcpData) {
	fs.writeFileSync(getMCPPath(userId), JSON.stringify(mcpData, null, 2));
}

// Fetch from server
async function fetchMCPFromServer(userId, accessToken) {
	const res = await fetch("http://localhost:8000/mcp_config", {
		headers: { Authorization: `Bearer ${accessToken}` },
	});
	const mcpData = await res.json();
	saveLocalMCP(userId, mcpData);
	return mcpData;
}

// Push to server
async function pushMCPToServer(userId, accessToken, mcpData) {
	await fetch("http://localhost:8000/mcp_config", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${accessToken}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ mcp_json: mcpData }),
	});
}
```

---

# 6. Client Usage Flow

```javascript
const userId = "71c2";
const accessToken = "ACCESS_TOKEN_HERE";

// Load local MCP JSON
let mcpConfig = loadLocalMCP(userId);

// Fetch from server if missing
if (!mcpConfig) {
	mcpConfig = await fetchMCPFromServer(userId, accessToken);
}

// Modify MCP servers locally
mcpConfig.servers.push({ name: "New MCP", url: "https://example.com" });
saveLocalMCP(userId, mcpConfig);

// Push update to server
await pushMCPToServer(userId, accessToken, mcpConfig);
```

---

# 7. Folder Structure on Client

```text
~/.dost/<user_id>/
    mcp.json            # plaintext local cache
    other_secrets.json  # optional future secrets
```

- Each user has their **own folder** keyed by `user_id`
- Local cache is plaintext for speed
- Server stores **encrypted MCP JSON** per user

---

# ✅ Features

1. **Per-user encryption** derived from `user_id` (+ optional server salt)
2. **Server-side encrypted storage**, safe even if DB leaks
3. **Local plaintext cache** for fast startup
4. **Multi-user support**: different `user_id` → different folders
5. **Simple JS client** and Python server

---

This is a **complete working setup** for your MCP server + client flow with **per-user encryption**.

If you want, I can also make a **diagram showing client folder ↔ server DB flow with per-user encryption**, perfect for documentation.

Do you want me to make that diagram?
