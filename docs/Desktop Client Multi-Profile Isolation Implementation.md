# Desktop Client Multi-Profile Isolation Implementation

Date: 2026-04-06

## Goal

Implement multi-profile support on the same machine by isolating desktop client state by authenticated `userId` while preserving current auth and refresh behavior.

## Summary of Implemented Behavior

1. Access token is sent from renderer to Electron main process after login/refresh.
2. Electron main process decodes JWT using `jsonwebtoken` and extracts `id` as `userId`.
3. Profile-scoped persistence is selected dynamically using `userId`:
    - `users/<userId>/config.json` via `electron-store`
    - `users/<userId>/mcp.json` for MCP server configuration
4. Logout and unauthorized flows clear in-memory auth context in Electron and reset active profile context.
5. `logged` ownership moved from `authStore` to `globalStore` and remains persisted.
6. MCP initialization is no longer eager at app startup; it initializes only when authenticated state is available.
7. AI model state and provider keys are re-initialized on login/logout profile switch, preventing cross-user key leakage.
8. TanStack chat queries/mutations are centralized in one module with shared keys and invalidation behavior.
9. Logout/session-end now clears chat query cache and in-memory chat state to prevent previous user chat bleed-through.

## Storage Model

Base path: `app.getPath("userData")`

- Profile metadata:
    - `profile-meta.json` (tracks last active user id)
- Per-profile stores:
    - `users/guest/config.json` (before login)
    - `users/<userId>/config.json` (after login)
- Per-profile MCP config:
    - `users/<userId>/mcp.json`

## Auth Context Flow

### On Login / Google Login / Refresh Success

1. Renderer receives API token.
2. Renderer calls `window.authAPI.setToken(token)`.
3. Main process decodes JWT payload and extracts `userId`.
4. Main process sets active profile store and MCP user context.
5. Main process re-initializes AI model from the newly active profile store.
6. UI state sets `logged = true` (global store).

### On Logout / Unauthorized / Refresh Failure

1. Renderer clears auth state (`token`, `user`).
2. Renderer sets `logged = false`.
3. Renderer calls `window.authAPI.clearToken()`.
4. Main process clears in-memory `authToken` and `authUserId`.
5. Main process resets MCP runtime context and active profile binding.
6. Main process re-initializes AI model against guest/no-auth context.
7. Renderer clears chat query cache and local chat state.

## Client-Side State Changes

### `globalStore`

- Added:
    - `logged: false`
    - `setLogged(logged)`
- Persisted fields:
    - `theme`
    - `logged`

### `authStore`

- Removed `logged` as local source of truth.
- Auth actions now update global logged state:
    - Login / Google Login / Refresh success -> `setLogged(true)`
    - Refresh fail / Logout / Unauthorized -> `setLogged(false)`
- Persisted auth fields now only include `user`.
- On logout/session-end, chat cache and chat store state are cleared:
    - Remove TanStack chat queries (`["chats"]`, `["chat", ...]`)
    - Reset active chat id, messages, and summary in chat store

### Readers switched to global logged state

- Route guard
- App refresh scheduling
- Sidebar auth UI and chat query gating
- Home page auth-dependent rendering
- Chat page query enablement

### TanStack Query Centralization (`client/src/lib/tanstackQueries.js`)

- Added centralized chat query keys:
    - `queryKeys.chats.all`
    - `queryKeys.chats.detail(chatId)`
- Added centralized query option builders:
    - `chatQueryOptions.list(...)`
    - `chatQueryOptions.detail(...)`
- Added centralized mutation option builders:
    - `chatMutationOptions.create(...)`
    - `chatMutationOptions.rename(...)`
    - `chatMutationOptions.delete(...)`
- Added centralized cleanup helpers:
    - `invalidateChatQueries(queryClient)`
    - `clearChatQueries(queryClient)`

## Electron-Side Changes

### Store Manager (`electron/store.js`)

- Introduced profile-aware store selection:
    - `setActiveUser(userId)`
    - `clearActiveUser()`
    - `getActiveUserId()`
    - `getStore()`
- Uses `electron-store` with dynamic `cwd`:
    - `users/<userId>/config.json`
- Keeps compatibility by exporting `getStore` as default and resolving instance at call-sites.

### Auth IPC (`electron/authIPC.js`)

- Added JWT decode utility using `jsonwebtoken` for `userId` extraction.
- Added in-memory auth context:
    - `authToken`
    - `authUserId`
- Added helpers:
    - `hasAuthContext()`
- IPC handlers:
    - `auth:set-token`
    - `auth:clear-token`
    - `auth:get-token`
    - `auth:get-user-id`
- Profile switch behavior in handlers:
    - `auth:set-token` -> set active user, set MCP active user, re-init AI model
    - `auth:clear-token` -> reset MCP runtime, clear active user, re-init AI model

### MCP Tools (`electron/mcp/tools.js`)

- Removed static `mcp.json` path.
- Added dynamic per-user resolver:
    - `getMcpConfigPath()`
    - `ensureUserProfilePath()`
- Added profile runtime controls:
    - `setActiveUserId(userId)`
    - `resetForLogout()`
- `init()` and `updateConfig()` now use profile-scoped `mcp.json`.

### MCP IPC Guards (`electron/mcp/ipcHandlers.js`)

- Guarded handlers behind `hasAuthContext()`.
- Returns safe error payloads when unauthenticated.

### Startup Sequence (`electron/main.js`)

- Removed eager `tools.init()` from app startup.
- Kept AI and RAG initialization.
- Electron store IPC now resolves the active profile store on each call.

### Preload (`electron/preload.js`)

- Exposed `authAPI.getUserId()`.

### AI Model (`electron/ai/models.js`)

- Uses active profile store resolver (`resolveStore()`) for all reads/writes.
- Clears known provider env vars before applying profile-specific env values during `init()`.
- Prevents old user's API keys from remaining in `process.env` after account switch.

## Important Runtime Notes

- `globalStore` persistence currently follows active profile store because renderer storage bridge uses Electron store IPC bound to active profile.
- Before login, state goes to guest profile.
- After login, state goes to `users/<userId>/config.json`.

## Backward Compatibility Fixes

A regression occurred after converting default store export to a function (error: `store.get is not a function`).

Resolved by updating `electron/ai/models.js` to resolve the active store instance before every operation:

- `resolveStore().get(...)`
- `resolveStore().set(...)`

Later improvement: JWT payload parsing moved from manual base64 logic to `jsonwebtoken.decode(...)` for maintainability and correctness.

## Validation Checklist

1. Start app logged out: no MCP initialization crash.
2. Login user A:
    - `users/<userA>/config.json` created
    - `users/<userA>/mcp.json` created on MCP config write
3. Logout:
    - logged false
    - token/user cleared
    - Electron in-memory auth context cleared
    - AI model reinitialized
    - chat query cache cleared
    - local chat store reset
4. Login user B:
    - separate `users/<userB>/config.json`
    - separate `users/<userB>/mcp.json`
    - AI env/model state loaded from user B profile
5. Restart app:
    - persisted logged behavior remains as designed
    - refresh flow still runs when logged is true

## Known Non-Blocking Item

There is a style/lint suggestion in sidebar class naming (`flex-shrink-0` -> `shrink-0`). This is unrelated to profile isolation behavior.

## Future Enhancements

1. Optional switch from `decode` to `verify` in main process if signing secret management is added there.
2. Optional explicit profile debug IPC endpoint returning active profile paths.
3. Optional migration utility for legacy root-level `mcp.json`.
4. Optional separation of truly shared app-level settings if needed later.
