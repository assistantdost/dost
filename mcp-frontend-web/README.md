# DOST-MCP Frontend Web

Modern, responsive Next.js web application for the DOST-MCP Multi-Service AI Platform.

## Features

-   🎨 **Beautiful Landing Page** - Modern gradient design with responsive layout
-   🔐 **Complete Authentication Flow**:
    -   Login with email/password
    -   Sign up with email verification (OTP)
    -   Google OAuth integration
    -   Forgot password & Reset password
    -   JWT-based authentication with refresh tokens
-   📱 **Responsive Design** - Mobile-first with hamburger menu
-   🎯 **Shadcn UI Components** - Beautiful, accessible components
-   🌐 **Next.js 16** - Latest framework with Turbopack
-   🎨 **Tailwind CSS** - Utility-first styling
-   🔔 **Toast Notifications** - User feedback with Sonner

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id-here
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### 4. Build for Production

```bash
npm run build
npm start
```

## Available Routes

| Route              | Description                         |
| ------------------ | ----------------------------------- |
| `/`                | Landing page with features and info |
| `/login`           | Login page with Google OAuth        |
| `/signup`          | Sign up page with Google OAuth      |
| `/verify-email`    | OTP verification for email          |
| `/forgot-password` | Request password reset              |
| `/reset-password`  | Reset password with OTP             |
| `/dashboard`       | User dashboard (protected)          |

## Tech Stack

-   **Framework**: Next.js 16 (App Router)
-   **UI Library**: Shadcn UI + Radix UI
-   **Styling**: Tailwind CSS
-   **State Management**: Zustand
-   **HTTP Client**: Axios
-   **Icons**: React Icons
-   **Notifications**: Sonner
-   **OAuth**: @react-oauth/google

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
