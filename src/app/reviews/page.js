"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button, Loader, Modal, ConfirmDialog, notify } from "@/components/ui/index.js";
import ReviewForm from "@/components/ReviewForm";
import RequireAuth from "@/components/RequireAuth";
import { SentimentBadge, RatingStars } from "@/components/ReviewMeta";
import EmptyState from "@/components/EmptyState";

const API = "http://localhost:5000/api/reviews";

function formatDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

// --- API helpers ---------------------------------------------------------
// Write helpers take the backend JWT and send it as a Bearer token.
function authHeaders(token) {
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

// A 401 means the backend token died while the NextAuth session survived —
// surface that as an actionable message instead of a generic failure.
function throwForStatus(res, fallback) {
  if (res.status === 401) throw new Error("Your session has expired — please log out and back in");
  if (res.status === 403) throw new Error("You can only modify your own reviews");
  throw new Error(fallback);
}

async function apiList() {
  const res = await fetch(API);
  if (!res.ok) throw new Error("Failed to load reviews");
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

function ReviewsContent() {
  const { data: session } = useSession();
  const token = session?.backendToken;
  const isAdmin = session?.user?.role === "ADMIN";
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  // Review awaiting delete confirmation (null = dialog closed).
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  // "all" = every guest review (public data); "mine" = only the signed-in
  // user's reviews, fetched with their JWT.
  const [scope, setScope] = useState("all");

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
    setIsLoading(true);
    (async () => {
      try {
        const data = scope === "mine" ? await apiListMine(token) : await apiList();
        if (active) setReviews(data);
      } catch (error) {
        notify(error.message || "Error fetching data", "error");
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [scope, token]);

  // --- CRUD handlers (update local state, no full reload) ---------------
  const handleCreate = async (data) => {
    try {
      const created = await apiCreate(data, token);
      setReviews((prev) => [created, ...prev]);
      setIsCreateOpen(false);
      notify("Review added", "success");
    } catch (error) {
      notify(error.message, "error");
    }
  };

  const handleUpdate = async (id, data) => {
    try {
      const updated = await apiUpdate(id, data, token);
      setReviews((prev) => prev.map((r) => (r.id === id ? updated : r)));
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
      setReviews((prev) => prev.filter((r) => r.id !== id));
      notify("Review deleted", "success");
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <header className="mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 animate-fade-in-up">
        <div>
          <p className="text-sm font-medium uppercase tracking-wider text-clay">Guest voices</p>
          <h1 className="mt-2 font-display text-4xl md:text-5xl font-semibold text-ink dark:text-parchment">
            Reviews
          </h1>
          <p className="mt-3 text-ink-soft dark:text-parchment/70">
            What guests are saying about their stays with our hosts.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="shrink-0">
          + New review
        </Button>
      </header>

      {/* Scope toggle — everyone's reviews vs the signed-in user's own */}
      <div className="mb-8 inline-flex rounded-full border border-sand dark:border-bark-soft bg-surface dark:bg-bark-soft p-1">
        {[
          { key: "all", label: "All reviews" },
          { key: "mine", label: "My reviews" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setScope(tab.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              scope === tab.key
                ? "bg-forest text-parchment"
                : "text-ink-soft dark:text-parchment/70 hover:text-forest dark:hover:text-moss"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-24">
          <Loader className="w-8 h-8 text-forest dark:text-moss" />
          <span className="ml-3 text-ink-soft dark:text-parchment/70">Loading reviews...</span>
        </div>
      ) : reviews.length === 0 ? (
        <EmptyState
          title={
            scope === "mine"
              ? "You haven't written a review yet"
              : "No reviews yet — write the first one"
          }
          hint={
            scope === "mine"
              ? "Share how your stay by the river felt."
              : "Guest voices make EchoLodge what it is."
          }
          action={
            <Button variant="outline" onClick={() => setIsCreateOpen(true)}>
              {scope === "mine" ? "Write my first review" : "Add the first one"}
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reviews.map((review, index) =>
            editingId === review.id ? (
              <div
                key={review.id}
                className="p-6 rounded-3xl bg-surface dark:bg-bark-soft border border-forest/40 dark:border-moss/40 shadow-md"
              >
                <h3 className="font-display text-lg font-semibold text-ink dark:text-parchment mb-4">
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
              <div
                key={review.id}
                className={`card-lift animate-fade-in-up ${index < 3 ? `delay-${(index + 1) * 100}` : ""} flex flex-col p-6 rounded-3xl bg-surface dark:bg-bark-soft border border-sand dark:border-bark-soft shadow-sm`}
              >
                <div className="flex items-start justify-between gap-3 mb-1">
                  <h3 className="font-display text-xl font-semibold text-ink dark:text-parchment">
                    {review.guestName}
                  </h3>
                  <SentimentBadge sentiment={review.sentiment} />
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <p className="text-sm text-clay font-medium">{review.roomType}</p>
                  <RatingStars rating={review.rating} />
                </div>
                <p className="text-ink-soft dark:text-parchment/80 leading-relaxed grow">
                  &ldquo;{review.reviewText}&rdquo;
                </p>

                {/* Published admin reply — travels with the public payload */}
                {review.adminReplied && review.adminReply && (
                  <div className="mt-4 pl-4 border-l-2 border-forest/50 dark:border-moss/50">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-forest dark:text-moss">
                        Response from EchoLodge
                      </span>
                      {formatDate(review.repliedAt) && (
                        <span className="text-xs text-ink-soft/70 dark:text-parchment/50">
                          · {formatDate(review.repliedAt)}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-ink-soft dark:text-parchment/70 leading-relaxed">
                      {review.adminReply}
                    </p>
                  </div>
                )}

                <div className="mt-6 flex items-center justify-between gap-3 pt-4 border-t border-sand dark:border-bark">
                  {formatDate(review.createdAt) ? (
                    <span className="text-xs text-ink-soft/80 dark:text-parchment/50">
                      {formatDate(review.createdAt)}
                    </span>
                  ) : (
                    <span />
                  )}
                  {canModify(review) && (
                    <div className="flex items-center gap-2">
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
              </div>
            )
          )}
        </div>
      )}

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Add a review">
        <ReviewForm
          submitLabel="Submit Review"
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

export default function ReviewsPage() {
  return (
    <RequireAuth>
      <ReviewsContent />
    </RequireAuth>
  );
}
