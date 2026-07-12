"use client";
import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

// Thin client wrapper so the root layout (a server component) can provide the
// NextAuth session context to the app.
export default function SessionProvider({ children }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
