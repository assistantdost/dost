# Desktop Client Multi-Profile Isolation Implementation

Date: 2026-04-06

## Goal

Implement multi-profile support on the same machine by isolating desktop client state by authenticated `userId` while preserving current auth and refresh behavior.

## Summary of Implemented Behavior

1. Access token is sent from renderer to Electron main process after login/refresh.
2. Electron main process decodes JWT payload and extracts `id` as `userId`.
3. Profile-scoped persistence is selected dynamically using `userId`:
    - `users/<userId>/config.json` via `electron-store`
    - `users/<userId>/mcp.json` for MCP server configuration
4. Logout and unauthorized flows clear in-memory auth context in Electron and reset active profile context.
5. `logged` ownership moved from `authStore` to `globalStore` and remains persisted.
6. MCP initialization is no longer eager at app startup; it initializes only when authenticated state is available.

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
5. UI state sets `logged = true` (global store).

### On Logout / Unauthorized / Refresh Failure

1. Renderer clears auth state (`token`, `user`).
2. Renderer sets `logged = false`.
3. Renderer calls `window.authAPI.clearToken()`.
4. Main process clears in-memory `authToken` and `authUserId`.
5. Main process resets MCP runtime context and active profile binding.

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

### Readers switched to global logged state

- Route guard
- App refresh scheduling
- Sidebar auth UI and chat query gating
- Home page auth-dependent rendering
- Chat page query enablement

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

- Added JWT payload decode utility for `userId` extraction.
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

## Important Runtime Notes

- `globalStore` persistence currently follows active profile store because renderer storage bridge uses Electron store IPC bound to active profile.
- Before login, state goes to guest profile.
- After login, state goes to `users/<userId>/config.json`.

## Backward Compatibility Fix

A regression occurred after converting default store export to a function (error: `store.get is not a function`).

Resolved by updating `electron/ai/models.js` to resolve the active store instance before every operation:

- `resolveStore().get(...)`
- `resolveStore().set(...)`

## Validation Checklist

1. Start app logged out: no MCP initialization crash.
2. Login user A:
    - `users/<userA>/config.json` created
    - `users/<userA>/mcp.json` created on MCP config write
3. Logout:
    - logged false
    - token/user cleared
    - Electron in-memory auth context cleared
4. Login user B:
    - separate `users/<userB>/config.json`
    - separate `users/<userB>/mcp.json`
5. Restart app:
    - persisted logged behavior remains as designed
    - refresh flow still runs when logged is true

## Known Non-Blocking Item

There is a style/lint suggestion in sidebar class naming (`flex-shrink-0` -> `shrink-0`). This is unrelated to profile isolation behavior.

## Future Enhancements

1. Optional explicit profile debug IPC endpoint returning active profile paths.
2. Optional migration utility for legacy root-level `mcp.json`.
3. Optional separation of truly shared app-level settings if needed later.
