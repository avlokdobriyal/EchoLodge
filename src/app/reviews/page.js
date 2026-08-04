"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Button,
  Loader,
  Modal,
  ConfirmDialog,
  notify,
} from "@/components/ui/index.js";
import ReviewForm from "@/components/ReviewForm";
import {
  SentimentBadge,
  RatingStars,
  VerifiedStayBadge,
} from "@/components/ReviewMeta";
import EmptyState from "@/components/EmptyState";
import { Reveal } from "@/components/motion/index.jsx";
import { API_BASE } from "@/lib/api";

const API = `${API_BASE}/api/reviews`;
const BOOKINGS_API = `${API_BASE}/api/bookings`;

function formatDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// --- API helpers ---------------------------------------------------------
// Write helpers take the backend JWT and send it as a Bearer token.
function authHeaders(token) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

// A 401 means the backend token died while the NextAuth session survived —
// surface that as an actionable message instead of a generic failure.
function throwForStatus(res, fallback) {
  if (res.status === 401)
    throw new Error("Your session has expired — please log out and back in");
  if (res.status === 403) throw new Error("You can only modify your own reviews");
  throw new Error(fallback);
}

async function apiList() {
  const res = await fetch(API);
  if (!res.ok) throw new Error("Failed to load reviews");
  return res.json();
}
// Public search across review text, sentiment, guest name and room type.
async function apiSearch(q) {
  const res = await fetch(`${API}/search?q=${encodeURIComponent(q)}`);
  if (!res.ok) throw new Error("Search failed");
  return res.json();
}
// The signed-in guest's stays, used to offer a verified-stay link on new reviews.
async function apiMyBookings(token) {
  const res = await fetch(BOOKINGS_API, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  return res.json();
}
// The signed-in user's own reviews, resolved server-side from the JWT.
async function apiListMine(token) {
  const res = await fetch(`${API}/mine`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throwForStatus(res, "Failed to load your reviews");
  return res.json();
}
async function apiCreate(data, token) {
  const res = await fetch(API, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) throwForStatus(res, "Failed to create review");
  return res.json();
}
async function apiUpdate(id, data, token) {
  const res = await fetch(`${API}/${id}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) throwForStatus(res, "Failed to update review");
  return res.json();
}
async function apiDelete(id, token) {
  const res = await fetch(`${API}/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throwForStatus(res, "Failed to delete review");
}

export default function ReviewsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const token = session?.backendToken;
  const isAuthed = status === "authenticated";
  const isAdmin = session?.user?.role === "ADMIN";
  // Results tagged with the query they belong to: { key, items } | null.
  // "Still loading" is then just "the stored key isn't the current one", which
  // avoids a separate flag that effects have to keep in step.
  const [result, setResult] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  // Review awaiting delete confirmation (null = dialog closed).
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  // "all" = every guest review (public data); "mine" = only the signed-in
  // user's reviews, fetched with their JWT.
  const [scope, setScope] = useState("all");
  // Raw input vs the debounced value actually sent to the API.
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  // The guest's own stays, so a new review can be linked to one.
  const [myBookings, setMyBookings] = useState([]);

  // Reviews are public, so an anonymous visitor reads them freely; only the
  // write actions below require signing in.
  const requireSignIn = () => {
    notify("Please sign in to write a review", "error");
    router.push("/login");
  };

  // Debounce typing so we aren't firing a request per keystroke.
  useEffect(() => {
    const id = setTimeout(() => setQuery(searchInput.trim()), 300);
    return () => clearTimeout(id);
  }, [searchInput]);

  // "My reviews" is meaningless when signed out, so derive the effective scope
  // rather than correcting the stored one — signing back in restores the tab
  // the guest had chosen.
  const effectiveScope = isAuthed ? scope : "all";

  // Identifies the exact list currently being asked for.
  const resultKey = `${effectiveScope}|${query}|${token ? "auth" : "anon"}`;
  const isLoading = result?.key !== resultKey;
  const reviews = result?.key === resultKey ? result.items : [];

  useEffect(() => {
    if (!token) return;
    let active = true;
    apiMyBookings(token)
      .then((b) => active && setMyBookings(b))
      .catch(() => active && setMyBookings([]));
    return () => {
      active = false;
      setMyBookings([]);
    };
  }, [token]);

  // Edit/Delete are restricted to the review's author or an admin. Legacy
  // reviews without an authorId are admin-only. (The backend enforces the
  // same rule — this only hides buttons that would 403 anyway.)
  const canModify = (review) =>
    isAdmin ||
    (review.authorId != null &&
      session?.user?.id != null &&
      String(review.authorId) === String(session.user.id));

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        let data;
        if (effectiveScope === "mine") {
          data = await apiListMine(token);
          // "Mine" is a small set, so filter client-side rather than adding a
          // scoped search endpoint.
          if (query) {
            const q = query.toLowerCase();
            data = data.filter((r) =>
              [r.reviewText, r.guestName, r.roomType, r.sentiment]
                .filter(Boolean)
                .some((f) => f.toLowerCase().includes(q))
            );
          }
        } else {
          data = query ? await apiSearch(query) : await apiList();
        }
        if (active) setResult({ key: resultKey, items: data });
      } catch (error) {
        notify(error.message || "Error fetching data", "error");
        if (active) setResult({ key: resultKey, items: [] });
      }
    })();
    return () => {
      active = false;
    };
  }, [effectiveScope, token, query, resultKey]);

  // --- CRUD handlers (update local state, no full reload) ---------------
  const handleCreate = async (data) => {
    try {
      const created = await apiCreate(data, token);
      setResult((prev) =>
        prev ? { ...prev, items: [created, ...prev.items] } : prev
      );
      setIsCreateOpen(false);
      notify("Review added", "success");
    } catch (error) {
      notify(error.message, "error");
    }
  };

  const handleUpdate = async (id, data) => {
    try {
      const updated = await apiUpdate(id, data, token);
      setResult((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.map((r) => (r.id === id ? updated : r)),
            }
          : prev
      );
      setEditingId(null);
      notify("Review updated", "success");
    } catch (error) {
      notify(error.message, "error");
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await apiDelete(id, token);
      setResult((prev) =>
        prev ? { ...prev, items: prev.items.filter((r) => r.id !== id) } : prev
      );
      notify("Review deleted", "success");
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const scopeTabs = [
    { key: "all", label: "All reviews" },
    { key: "mine", label: "My reviews" },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <Reveal className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow text-ink-faint">In their words</p>
          <h1 className="display mt-4 text-ink">What guests said.</h1>
          <p className="mt-4 max-w-lg text-[17px] leading-relaxed text-ink-muted">
            Every review here is written by someone who stayed. The ones marked
            verified are tied to a real booking.
          </p>
        </div>
        <Button
          onClick={() => (isAuthed ? setIsCreateOpen(true) : requireSignIn())}
          className="shrink-0"
        >
          Write a review
        </Button>
      </Reveal>

      <div className="mt-10 flex flex-col gap-4 border-b border-line pb-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Scope toggle — everyone's reviews vs the signed-in guest's own.
            "My reviews" only appears once there's a session to scope to. */}
        {isAuthed ? (
          <div className="flex shrink-0 gap-5">
            {scopeTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setScope(tab.key)}
                aria-pressed={scope === tab.key}
                className={`-mb-[17px] border-b-2 pb-4 text-sm font-medium transition-colors ${
                  scope === tab.key
                    ? "border-accent text-ink"
                    : "border-transparent text-ink-muted hover:text-ink"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        ) : (
          <span />
        )}

        {/* Search — hits GET /api/reviews/search for the public list. */}
        <div className="relative w-full sm:max-w-xs">
          <svg
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-faint"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z"
            />
          </svg>
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search a word, room or guest"
            aria-label="Search reviews"
            className="w-full rounded-sm border border-line bg-surface py-2 pr-3 pl-9 text-sm text-ink transition-colors placeholder:text-ink-faint hover:border-line-strong focus:border-accent focus:outline-none"
          />
        </div>
      </div>

      <div className="mt-10">
        {isLoading ? (
          <div className="flex items-center justify-center gap-3 py-24 text-ink-muted">
            <Loader className="h-5 w-5 text-ink-faint" />
            <span className="text-sm">Loading reviews…</span>
          </div>
        ) : reviews.length === 0 ? (
          query ? (
            <EmptyState
              title={`Nothing matches “${query}”`}
              hint="Try a different word, a room type, or a guest name."
              action={
                <Button variant="outline" onClick={() => setSearchInput("")}>
                  Clear search
                </Button>
              }
            />
          ) : (
            <EmptyState
              title={
                effectiveScope === "mine"
                  ? "You haven't written a review yet"
                  : "No reviews yet"
              }
              hint={
                effectiveScope === "mine"
                  ? "Tell us how your stay by the river felt."
                  : "Be the first to say something about the lodge."
              }
              action={
                <Button
                  variant="outline"
                  onClick={() =>
                    isAuthed ? setIsCreateOpen(true) : requireSignIn()
                  }
                >
                  {effectiveScope === "mine"
                    ? "Write my first review"
                    : "Write the first one"}
                </Button>
              }
            />
          )
        ) : (
          // CSS columns rather than a grid. Reviews vary wildly in length, and
          // a grid row is only as short as its tallest card — a two-line review
          // next to a ten-line one leaves a hole. Columns pack them tight, and
          // break-inside-avoid keeps a card from splitting across the gutter.
          <div className="columns-1 gap-5 md:columns-2">
            {reviews.map((review) =>
              editingId === review.id ? (
                <div
                  key={review.id}
                  className="mb-5 break-inside-avoid rounded-md border border-accent/50 bg-surface p-5"
                >
                  <h3 className="mb-4 text-[15px] font-semibold tracking-tight text-ink">
                    Edit review
                  </h3>
                  <ReviewForm
                    initialValues={review}
                    submitLabel="Save"
                    onSubmit={(data) => handleUpdate(review.id, data)}
                    onCancel={() => setEditingId(null)}
                  />
                </div>
              ) : (
                <article
                  key={review.id}
                  className="animate-fade-in mb-5 flex break-inside-avoid flex-col rounded-md border border-line bg-surface p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <RatingStars rating={review.rating} />
                    <VerifiedStayBadge verified={review.verifiedStay} />
                  </div>

                  {/* The quote leads. Attribution follows underneath, the way a
                      pull-quote works — the words are the reason anyone is
                      reading this, not the name attached to them. */}
                  <blockquote className="mt-4 grow text-[15px] leading-relaxed text-ink">
                    {review.reviewText}
                  </blockquote>

                  {/* Published admin reply — travels with the public payload */}
                  {review.adminReplied && review.adminReply && (
                    <div className="mt-4 border-l-2 border-line-strong pl-4">
                      <p className="eyebrow text-ink-faint">
                        Reply from EchoLodge
                        {formatDate(review.repliedAt)
                          ? ` · ${formatDate(review.repliedAt)}`
                          : ""}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                        {review.adminReply}
                      </p>
                    </div>
                  )}

                  <div className="mt-5 border-t border-line pt-4">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-sm font-medium text-ink">
                        {review.guestName}
                      </p>
                      <SentimentBadge sentiment={review.sentiment} />
                    </div>
                    <p className="mt-1 text-xs text-ink-faint">
                      {review.roomType}
                      {formatDate(review.createdAt)
                        ? ` · ${formatDate(review.createdAt)}`
                        : ""}
                    </p>

                    {canModify(review) && (
                      <div className="mt-4 flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingId(review.id)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setConfirmDeleteId(review.id)}
                          disabled={deletingId === review.id}
                        >
                          {deletingId === review.id ? "Deleting…" : "Delete"}
                        </Button>
                      </div>
                    )}
                  </div>
                </article>
              )
            )}
          </div>
        )}
      </div>

      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Write a review"
      >
        <ReviewForm
          submitLabel="Publish review"
          bookings={myBookings}
          defaultGuestName={session?.user?.name ?? ""}
          onSubmit={handleCreate}
          onCancel={() => setIsCreateOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        isOpen={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => handleDelete(confirmDeleteId)}
        title="Delete this review?"
        message="The review and its AI analysis will be permanently removed. This cannot be undone."
        confirmLabel="Delete review"
        busy={deletingId !== null}
      />
    </div>
  );
}
