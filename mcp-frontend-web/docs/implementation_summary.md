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

## 4. Robust "Active Token Refresh" Approach

### Change
- Updated `src/config/axios.js` with an interceptor system that pauses outgoing requests during a refresh cycle.
- Automatically retries failed requests once a new token is acquired.

### Why
- **Seamless UX**: Users are never logged out unexpectedly while active. Token expiration is handled "silently" in the background.

---

## 5. Logout & Session Termination

### Change
- **Backend-Driven Logout**: The `logout` function in `authStore.js` now calls the backend's `/auth/logout` endpoint.
- **Async Synchronization**: UI components (Navbar, Logout Button) now `await` the logout call before redirecting to the login page.

### Why
- **Cookie Security**: Since the `refresh_token` is an `HttpOnly` cookie, the client cannot delete it directly. Calling the backend ensures the server clears the cookie via a `Set-Cookie` header.
- **Middleware Consistency**: Clearing the `refresh_token` cookie is essential for the Next.js Middleware to recognize that the user is no longer authorized, preventing accidental redirects back to protected areas.

---

## Summary of New/Modified Files
- **`src/middleware.js`**: Server-side route protection based on `refresh_token`.
- **`src/lib/serverApi.js`**: Server-side data fetching with internal token refresh.
- **`src/components/auth/AuthGuard.jsx`**: Section-specific protection & loading states.
- **`src/app/dashboard/layout.jsx`**: Targeted dashboard protection.
- **`src/store/authStore.js`**: Secure in-memory token management & async logout.
- **`src/config/axios.js`**: Advanced 401 interceptors & request queuing.
- **`src/components/StoreInitializer.jsx`**: SSR-to-Client state bridge.
