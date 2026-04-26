# Next.js SSR & Authentication Implementation Summary

This document outlines the architectural changes made to transition the project from a "React SPA within Next.js" to a "Full Next.js Application" leveraging Server-Side Rendering (SSR), Server Components, and secure authentication.

## 1. Architectural Shift: React SPA -> Full Next.js

### Change
- Converted major entry points like the **Home Page** (`src/app/page.js`) and **Dashboard** (`src/app/dashboard/page.jsx`) from Client Components to **Server Components**.
- Implemented a `serverApi` utility in `src/lib/serverApi.js` for data fetching on the server.

### Why
- **SEO & Performance**: Server Components send less JavaScript to the client, leading to faster First Contentful Paint (FCP).
- **Data Fetching**: Fetching data on the server reduces client-side waterfalls and eliminates loading flickers for authenticated pages.

---

## 2. Authentication: Secure In-Memory Token & Refresh Cookie

### Change
- **In-Memory Access Token**: The JWT access token is now stored strictly in the application's memory (Zustand state) and is **not** saved to cookies or `localStorage`.
- **Refresh Token Cookie**: The backend continues to set a `refresh_token` as an `HttpOnly` cookie.
- **SSR Authorization**: Modified `serverApi.js` to automatically obtain a temporary access token on the server using the `refresh_token` cookie for authorized SSR requests.

### Why
- **Security (XSS Protection)**: Storing the access token in memory instead of cookies prevents malicious scripts (XSS) from stealing the session token.
- **SSR Compatibility**: Leveraging the `refresh_token` cookie allows the server to authorize pre-rendered data without exposing the permanent token in the browser's persistent storage.

---

## 3. Route Protection: Middleware & AuthGuard

### Change
- **Next.js Middleware**: Implemented `src/middleware.js` to check for the `refresh_token` cookie and handle instant server-side redirects for protected routes.
- **Dashboard AuthGuard**: Created a dedicated `AuthGuard` component and applied it via `src/app/dashboard/layout.jsx`. 
- **Flicker Protection**: Added an `initialChecked` flag in the `authStore` to track session resolution.

### Why
- **Instant Redirects**: Middleware runs before rendering, ensuring unauthorized users never see protected UI.
- **Loading UX**: The `AuthGuard` shows a professional "Securing your session..." loader while the dashboard resolves its auth state, preventing the UI from flashing unauthenticated states.
- **Navbar Consistency**: The Navbar uses the `initialChecked` flag to hide auth buttons until the user's status is confirmed, ensuring a premium feel.

---

## 4. Robust "Active Token Refresh" & Interceptor Logic

### Change
- **Intelligent 401 Interceptor**: Configured `src/config/axios.js` to automatically handle token expirations without user intervention.
- **Request Queuing**: Implemented a `failedQueue` and `isRefreshing` lock system within the interceptor.
- **Global Error Handling**: Centralized toast notifications for 403, 429, and 500 errors.

### Why
- **Seamless UX**: If a token expires while a user is working, the app "pauses" the request, refreshes the token in the background, and then retries the original request. The user experiences zero interruption.
- **Security**: The access token remains strictly in-memory, but the interceptor ensures it's always fresh by leveraging the HttpOnly refresh cookie.
- **Consistency**: Developers don't need to manually handle common errors or token logic in every component; the "Engine" handles it globally.

---

---

## 5. Logout & Session Termination

### Change
- **Backend-Driven Logout**: The `logout` function in `authStore.js` now calls the backend's `/auth/logout` endpoint.
- **Async Synchronization**: UI components (Navbar, Logout Button) now `await` the logout call before redirecting to the login page.

### Why
- **Cookie Security**: Since the `refresh_token` is an `HttpOnly` cookie, the client cannot delete it directly. Calling the backend ensures the server clears the cookie via a `Set-Cookie` header.
- **Middleware Consistency**: Clearing the `refresh_token` cookie is essential for the Next.js Middleware to recognize that the user is no longer authorized.

---

## 6. Unified API Layer & Environment Agnostic Fetching

### Change
- **Unified API Definitions**: Refactored `src/api/` (e.g., `user.js`, `apiKeys.js`) to be environment-agnostic. They now accept an optional `fetcher` instance.
- **Server-Side Fetcher**: Implemented `getServerFetcher()` in `serverApi.js` which provides an axios-compatible interface for the server.

### Why
- **Single Source of Truth**: One function works on both the client and server.
- **Maintenance**: Changing an endpoint URL now only requires a single update in the `src/api` folder.

---

## 7. API Proxying (Rewrites)

### Change
- **Next.js Rewrites**: Configured `next.config.mjs` to proxy `/api/:path*` requests to the FastAPI backend.
- **Relative URLs**: The client-side `axios.js` now uses `/api` as its base URL.

### Why
- **Cleanliness**: Resolves Next.js deprecation warnings regarding "middleware as a proxy".
- **Performance**: Proxying at the config level is more efficient.

---

## Summary of New/Modified Files
- **`src/middleware.js`**: Purely for auth redirects (Dashboard -> Login, Login -> Dashboard).
- **`src/lib/serverApi.js`**: Provides `getServerFetcher()` for authenticated SSR requests.
- **`src/api/`**: Unified API definitions (shared by Client and Server).
- **`src/store/authStore.js`**: Manages the in-memory session and background refresh.
- **`src/config/axios.js`**: Client-side fetcher with 401 interceptors, now uses `/api` proxy.
- **`next.config.mjs`**: Handles API rewrites and proxying to the backend.
- **`src/components/StoreInitializer.jsx`**: Bridges the SSR "seed" data into the Zustand store.
