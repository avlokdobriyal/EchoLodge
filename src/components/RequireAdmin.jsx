"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader } from "@/components/ui/index.js";

// Route guard for admin-only pages. Unauthenticated users are sent to /login;
// authenticated non-admins are bounced to /dashboard. Renders children only for
// users whose session role is exactly "ADMIN".
export default function RequireAdmin({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isAdmin = session?.user?.role === "ADMIN";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    } else if (status === "authenticated" && !isAdmin) {
      router.replace("/dashboard");
    }
  }, [status, isAdmin, router]);

  if (status !== "authenticated" || !isAdmin) {
    return (
      <div className="flex justify-center items-center py-32">
        <Loader className="w-8 h-8 text-forest dark:text-moss" />
        <span className="ml-3 text-ink-soft dark:text-parchment/70">Checking admin access…</span>
      </div>
    );
  }

  return children;
}
