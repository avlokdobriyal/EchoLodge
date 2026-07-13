import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

const BACKEND = process.env.BACKEND_URL || "http://localhost:5000";

export const authOptions = {
  providers: [
    // Email/password — delegates to the Express backend, which returns a JWT.
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const res = await fetch(`${BACKEND}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: credentials?.email,
            password: credentials?.password,
          }),
        });
        if (!res.ok) return null;
        const data = await res.json();
        // Passed through to the jwt() callback as `user`.
        return {
          id: String(data.user.id),
          email: data.user.email,
          name: data.user.name,
          role: data.user.role || "USER",
          backendToken: data.token,
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    // For Google sign-ins, exchange the profile for a backend JWT so the user
    // can reach the protected review routes (the OAuth bridge).
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          const res = await fetch(`${BACKEND}/api/auth/oauth`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: user.email, name: user.name }),
          });
          if (!res.ok) return false;
          const data = await res.json();
          // Stash the backend token on the user object for the jwt() callback.
          user.backendToken = data.token;
          user.id = String(data.user.id);
          user.role = data.user.role || "USER";
        } catch {
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user?.backendToken) {
        token.backendToken = user.backendToken;
        token.userId = user.id;
        token.role = user.role || "USER";
      }
      return token;
    },
    async session({ session, token }) {
      // Expose the backend JWT to the client so it can call protected routes.
      session.backendToken = token.backendToken;
      if (session.user) {
        session.user.id = token.userId;
        session.user.role = token.role || "USER";
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
