"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { Button, Loader, ConfirmDialog, notify } from "@/components/ui/index.js";
import RequireAuth from "@/components/RequireAuth";
import EmptyState from "@/components/EmptyState";
import { API_BASE } from "@/lib/api";

const API = `${API_BASE}/api/bookings`;

// Hoisted: built once per module rather than once per call.
const INR = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
});
const formatINR = (value) => INR.format(value);

function formatDate(value) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

// Booking status reads as information, so it sits in the cool half of the
// palette; cancelled uses the alert tone, which is the one thing here a guest
// might need to spot at a glance.
const STATUS_STYLES = {
    CONFIRMED: "border-ridge-400/40 text-ridge-600 dark:text-ridge-300",
    CANCELLED: "border-alert/40 text-alert",
};

// The signed-in user's bookings with the full lifecycle: view, cancel
// (soft — keeps the record), and remove (hard delete of a cancelled stay).
function MyBookings({ token }) {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // { action: "cancel" | "remove", booking } awaiting confirmation.
    const [confirm, setConfirm] = useState(null);
    const [busy, setBusy] = useState(false);

    const load = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch(API, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.status === 401) {
                throw new Error("Your session has expired — please log out and back in");
            }
            if (!res.ok) throw new Error("Failed to load your bookings");
            setBookings(await res.json());
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        load();
    }, [load]);

    const runConfirmed = async () => {
        const { action, booking } = confirm;
        setBusy(true);
        try {
            const res = await fetch(
                action === "cancel" ? `${API}/${booking.id}/cancel` : `${API}/${booking.id}`,
                {
                    method: action === "cancel" ? "PATCH" : "DELETE",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok && res.status !== 204) {
                const data = await res.json().catch(() => ({}));
                notify(data.error || "Something went wrong", "error");
                return;
            }
            if (action === "cancel") {
                const updated = await res.json();
                setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
                notify("Booking cancelled", "success");
            } else {
                setBookings((prev) => prev.filter((b) => b.id !== booking.id));
                notify("Booking removed", "success");
            }
        } catch {
            notify("Network error — is the backend running?", "error");
        } finally {
            setBusy(false);
            setConfirm(null);
        }
    };

    return (
        <div className="mt-8 rounded-md bg-surface border border-line shadow-sm p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-ink">
                My bookings
            </h2>

            {loading ? (
                <div className="flex justify-center py-10">
                    <Loader className="w-6 h-6 text-ink" />
                </div>
            ) : error ? (
                <p className="mt-4 text-dawn-500">{error}</p>
            ) : bookings.length === 0 ? (
                <EmptyState
                    className="mt-4"
                    title="No stays booked yet"
                    hint="The river is waiting."
                    action={
                        <Button href="/rooms" variant="outline">
                            Find your lodge
                        </Button>
                    }
                />
            ) : (
                <ul className="mt-4 space-y-3">
                    {bookings.map((booking) => (
                        <li
                            key={booking.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-md bg-surface-2 border border-line p-4"
                        >
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-medium text-ink truncate">
                                        {booking.room?.name ?? `Room #${booking.roomId}`}
                                    </p>
                                    <span
                                        className={`eyebrow shrink-0 rounded-xs border px-2 py-1 ${
                                            STATUS_STYLES[booking.status] ?? STATUS_STYLES.CONFIRMED
                                        }`}
                                    >
                                        {booking.status}
                                    </span>
                                </div>
                                <p className="mt-1 text-xs text-ink-muted">
                                    {formatDate(booking.checkInDate)} → {formatDate(booking.checkOutDate)} ·{" "}
                                    {formatINR(booking.totalPrice)}
                                </p>
                            </div>
                            <div className="shrink-0">
                                {booking.status === "CANCELLED" ? (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setConfirm({ action: "remove", booking })}
                                    >
                                        Remove
                                    </Button>
                                ) : (
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={() => setConfirm({ action: "cancel", booking })}
                                    >
                                        Cancel booking
                                    </Button>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            <ConfirmDialog
                isOpen={confirm !== null}
                onClose={() => setConfirm(null)}
                onConfirm={runConfirmed}
                title={confirm?.action === "cancel" ? "Cancel this booking?" : "Remove this booking?"}
                message={
                    confirm?.action === "cancel"
                        ? `Your stay at ${confirm?.booking?.room?.name ?? "this room"} will be cancelled and the room released for other guests.`
                        : "The cancelled booking will be removed from your history permanently."
                }
                confirmLabel={confirm?.action === "cancel" ? "Cancel booking" : "Remove"}
                busy={busy}
            />
        </div>
    );
}

function ProfileContent() {
    const { data: session } = useSession();
    const user = session?.user;
    const initial = (user?.name || user?.email || "?").charAt(0).toUpperCase();

    return (
        <div className="max-w-2xl mx-auto px-4 py-24">
            <div className="text-center mb-8 animate-fade-in-up">
                <p className="eyebrow text-ink-faint">Your account</p>
                <h1 className="mt-2 text-4xl font-semibold text-ink">Profile</h1>
            </div>

            <div className="rounded-md bg-surface border border-line shadow-sm p-8">
                <div className="flex items-center gap-5">
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-ridge-800 text-quartz-200 text-2xl font-semibold">
                        {initial}
                    </div>
                    <div>
                        <p className="text-xl font-semibold text-ink">
                            {user?.name || "EchoLodge host"}
                        </p>
                        <p className="text-ink-muted">{user?.email}</p>
                    </div>
                </div>

                <dl className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="rounded-md bg-surface-2 p-4">
                        <dt className="text-xs uppercase tracking-wider text-ink-faint">Email</dt>
                        <dd className="mt-1 text-ink break-all">{user?.email}</dd>
                    </div>
                    <div className="rounded-md bg-surface-2 p-4">
                        <dt className="text-xs uppercase tracking-wider text-ink-faint">User ID</dt>
                        <dd className="mt-1 text-ink">{user?.id ?? "—"}</dd>
                    </div>
                </dl>

                <div className="mt-8 flex flex-wrap gap-3">
                    <Button href="/reviews" variant="outline">Go to reviews</Button>
                    <Button variant="danger" onClick={() => signOut({ callbackUrl: "/login" })}>
                        Sign out
                    </Button>
                </div>
            </div>

            <MyBookings token={session?.backendToken} />
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
