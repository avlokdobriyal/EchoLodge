"use client";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/index.js";
import RequireAuth from "@/components/RequireAuth";

function ProfileContent() {
    const { data: session } = useSession();
    const user = session?.user;
    const initial = (user?.name || user?.email || "?").charAt(0).toUpperCase();

    return (
        <div className="max-w-2xl mx-auto px-4 py-24">
            <div className="text-center mb-8">
                <p className="text-sm font-medium uppercase tracking-wider text-clay">Your account</p>
                <h1 className="mt-2 font-display text-4xl font-semibold text-ink dark:text-parchment">Profile</h1>
            </div>

            <div className="rounded-3xl bg-surface dark:bg-bark-soft border border-sand dark:border-bark-soft shadow-sm p-8">
                <div className="flex items-center gap-5">
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-forest text-parchment font-display text-2xl font-semibold">
                        {initial}
                    </div>
                    <div>
                        <p className="font-display text-xl font-semibold text-ink dark:text-parchment">
                            {user?.name || "EchoLodge host"}
                        </p>
                        <p className="text-ink-soft dark:text-parchment/70">{user?.email}</p>
                    </div>
                </div>

                <dl className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="rounded-2xl bg-canvas dark:bg-bark p-4">
                        <dt className="text-xs uppercase tracking-wider text-ink-soft dark:text-parchment/50">Email</dt>
                        <dd className="mt-1 text-ink dark:text-parchment break-all">{user?.email}</dd>
                    </div>
                    <div className="rounded-2xl bg-canvas dark:bg-bark p-4">
                        <dt className="text-xs uppercase tracking-wider text-ink-soft dark:text-parchment/50">User ID</dt>
                        <dd className="mt-1 text-ink dark:text-parchment">{user?.id ?? "—"}</dd>
                    </div>
                </dl>

                <div className="mt-8 flex flex-wrap gap-3">
                    <Button href="/dashboard" variant="outline">Go to dashboard</Button>
                    <Button variant="danger" onClick={() => signOut({ callbackUrl: "/login" })}>
                        Sign out
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default function ProfilePage() {
    return (
        <RequireAuth>
            <ProfileContent />
        </RequireAuth>
    );
}
