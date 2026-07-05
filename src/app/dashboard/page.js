"use client";
import { useState, useEffect } from "react";
import { Button, Loader, Modal, notify } from "@/components/ui/index.js";
import ReviewForm from "@/components/ReviewForm";

const API = "http://localhost:5000/api/reviews";

const sentimentStyles = {
  positive: "bg-forest/10 text-forest dark:bg-moss/20 dark:text-moss",
  negative: "bg-clay/15 text-clay-dark dark:bg-clay/25 dark:text-clay",
  neutral: "bg-sand text-ink-soft dark:bg-bark dark:text-parchment/70",
};

function formatDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

// --- API helpers ---------------------------------------------------------
async function apiList() {
  const res = await fetch(API);
  if (!res.ok) throw new Error("Failed to load reviews");
  return res.json();
}
async function apiCreate(data) {
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create review");
  return res.json();
}
async function apiUpdate(id, data) {
  const res = await fetch(`${API}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update review");
  return res.json();
}
async function apiDelete(id) {
  const res = await fetch(`${API}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete review");
}

export default function DashboardPage() {
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await apiList();
        if (active) setReviews(data);
      } catch (error) {
        notify("Error fetching data", "error");
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // --- CRUD handlers (update local state, no full reload) ---------------
  const handleCreate = async (data) => {
    try {
      const created = await apiCreate(data);
      setReviews((prev) => [created, ...prev]);
      setIsCreateOpen(false);
      notify("Review added", "success");
    } catch (error) {
      notify(error.message, "error");
    }
  };

  const handleUpdate = async (id, data) => {
    try {
      const updated = await apiUpdate(id, data);
      setReviews((prev) => prev.map((r) => (r.id === id ? updated : r)));
      setEditingId(null);
      notify("Review updated", "success");
    } catch (error) {
      notify(error.message, "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this review? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await apiDelete(id);
      setReviews((prev) => prev.filter((r) => r.id !== id));
      notify("Review deleted", "success");
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <header className="mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-wider text-clay">Guest voices</p>
          <h1 className="mt-2 font-display text-4xl md:text-5xl font-semibold text-ink dark:text-parchment">
            Dashboard Reviews
          </h1>
          <p className="mt-3 text-ink-soft dark:text-parchment/70">
            Manage what guests are saying about their stays with our hosts.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="shrink-0">
          + New review
        </Button>
      </header>

      {isLoading ? (
        <div className="flex justify-center items-center py-24">
          <Loader className="w-8 h-8 text-forest dark:text-moss" />
          <span className="ml-3 text-ink-soft dark:text-parchment/70">Loading reviews...</span>
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-sand dark:border-bark-soft py-16 text-center">
          <p className="text-ink-soft dark:text-parchment/60">No reviews yet.</p>
          <Button variant="outline" onClick={() => setIsCreateOpen(true)} className="mt-4">
            Add the first one
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reviews.map((review) =>
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
                className="flex flex-col p-6 rounded-3xl bg-surface dark:bg-bark-soft border border-sand dark:border-bark-soft shadow-sm hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between gap-3 mb-1">
                  <h3 className="font-display text-xl font-semibold text-ink dark:text-parchment">
                    {review.guestName}
                  </h3>
                  <span
                    className={`shrink-0 inline-block px-3 py-1 text-xs rounded-full font-semibold ${
                      sentimentStyles[review.sentiment] || sentimentStyles.neutral
                    }`}
                  >
                    {review.sentiment.charAt(0).toUpperCase() + review.sentiment.slice(1)}
                  </span>
                </div>
                <p className="text-sm text-clay font-medium mb-4">{review.roomType}</p>
                <p className="text-ink-soft dark:text-parchment/80 leading-relaxed grow">
                  &ldquo;{review.reviewText}&rdquo;
                </p>

                <div className="mt-6 flex items-center justify-between gap-3 pt-4 border-t border-sand dark:border-bark">
                  {formatDate(review.createdAt) ? (
                    <span className="text-xs text-ink-soft/80 dark:text-parchment/50">
                      {formatDate(review.createdAt)}
                    </span>
                  ) : (
                    <span />
                  )}
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
                      onClick={() => handleDelete(review.id)}
                      disabled={deletingId === review.id}
                    >
                      {deletingId === review.id ? "Deleting…" : "Delete"}
                    </Button>
                  </div>
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
    </div>
  );
}
