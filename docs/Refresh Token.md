Perfect. Let’s lay it down **step by step**, with everything you need for a **non-rotating refresh token** system that still uses a **session id** to track sessions. I’ll give you **full flow from login → refresh → logout**, including DB design, client behavior, and security notes.

---

# 1. Database design

You need two tables:

**Users table** (simplified):

| Field    | Type   |
| -------- | ------ |
| id       | string |
| email    | string |
| password | hashed |
| role     | string |

**Refresh Tokens table**:

| Field       | Type     | Notes                                 |
| ----------- | -------- | ------------------------------------- |
| id          | string   | primary key, ULID or UUID             |
| user_id     | string   | foreign key → users.id                |
| session_id  | string   | random, identifies this login session |
| token_hash  | string   | hashed refresh token                  |
| expires_at  | datetime | token expiry                          |
| revoked     | boolean  | default `false`                       |
| created_at  | datetime | optional audit                        |
| device_info | string   | optional (browser/device)             |

> The **session_id** allows you to know which device/session is making the request, even though you’re not rotating tokens.

---

# 2. Login flow

1. User submits credentials → `/login`
2. Server validates password
3. Server generates:

```text
access_token (JWT, e.g. 15 min)
refresh_token (random string)
session_id (random string)
```

4. Server stores refresh token in DB:

```sql
INSERT INTO refresh_tokens (
  id, user_id, session_id, token_hash, expires_at, revoked, created_at
) VALUES (
  gen_ulid(), user.id, session_id, sha256(refresh_token), now() + 7d, false, now()
)
```

5. Server responds to client:

```json
{
	"access_token": "...",
	"refresh_token": "...",
	"session_id": "..."
}
```

6. Client stores:

- `access_token` in memory (or localStorage/sessionStorage)
- `refresh_token` securely (e.g., local storage or secure store)
- `session_id` optional on client (mainly for session tracking)

---

# 3. Refresh flow

Every time **access token expires**, client calls `/refresh`:

**Client request:**

```http
POST /refresh
Authorization: Bearer <refresh_token>
Content-Type: application/json
{
  "session_id": "<session_id>"
}
```

**Server logic:**

1. Hash the incoming refresh token:

```python
incoming_hash = sha256(refresh_token)
```

2. Look up DB:

```sql
SELECT * FROM refresh_tokens
WHERE token_hash = incoming_hash
  AND session_id = <session_id>
  AND revoked = false
  AND expires_at > now()
```

3. If **found and valid**, issue new access token (JWT):

```json
{
	"access_token": "new_jwt"
}
```

4. **Important:** do **not** generate a new refresh token (non-rotating). The same token is still valid until expiry or revocation.

---

# 4. Logout flow

**Client calls `/logout`** with session info:

```http
POST /logout
Authorization: Bearer <refresh_token>
{
  "session_id": "<session_id>"
}
```

**Server logic:**

```sql
UPDATE refresh_tokens
SET revoked = true
WHERE token_hash = sha256(refresh_token)
  AND session_id = <session_id>
```

> Now that session cannot use refresh token anymore.
> Access token may still be valid until it expires (short-lived).

---

# 5. Session management

Since you store **session_id per refresh token**, you can:

- Track multiple devices
- Logout a single session without affecting others
- Show active sessions in UI

Example DB query for active sessions:

```sql
SELECT session_id, device_info, created_at, expires_at
FROM refresh_tokens
WHERE user_id = <user_id> AND revoked = false
```

---

# 6. Security notes

Even without rotation:

1. Hash refresh tokens in DB → prevents token theft from DB leak
2. Set **expiry** (e.g., 7 days)
3. Store access token short-lived (e.g., 15 min)
4. Include **session_id** → allows per-device revocation
5. Optional: device/IP tracking → detect anomalies

---

# 7. Diagram of flow

```text
Login
┌─────────────┐
│   Client    │
└─────┬───────┘
      │ POST /login
      │ email + password
      ▼
┌─────────────┐
│   Server    │
└─────┬───────┘
      │ Validate password
      │ Generate access_token + refresh_token + session_id
      │ Store refresh_token hash in DB
      ▼
┌─────────────┐
│   Client    │
└─────────────┘
      │ Stores tokens
      │
Access token expires
      │
      ▼
POST /refresh with refresh_token + session_id
      │
      ▼
Server validates token hash + session_id + revoked + expires
      │
      ▼
Return new access_token
      │
      ▼
Client uses new access token

Logout:
POST /logout with refresh_token + session_id
Server revokes refresh_token in DB
```

---

# ✅ Key points for “non-rotating refresh token + session_id”

- Single refresh token per session
- Stored hashed in DB
- Server can revoke on logout
- Session ID allows per-device control
- Access token remains short-lived
- Optional: audit/device tracking

---

If you want, I can also **draw a complete FastAPI example** implementing this exact flow with:

- users table
- refresh_tokens table
- JWT access tokens
- refresh endpoint
- logout endpoint

It’ll be ready to plug into your MCP client.

Do you want me to do that?
