"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader } from "@/components/ui/index.js";

// Client-side route guard: redirects unauthenticated users to /login and shows
// a loader while the session is resolving. Wrap protected page content in this.
export default function RequireAuth({ children }) {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="flex justify-center items-center py-32">
        <Loader className="w-8 h-8 text-forest dark:text-moss" />
        <span className="ml-3 text-ink-soft dark:text-parchment/70">Checking your session…</span>
      </div>
    );
  }

  return children;
}
