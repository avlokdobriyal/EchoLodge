"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Button, Loader, notify } from "@/components/ui/index.js";
import RequireAdmin from "@/components/RequireAdmin";
import AdminTabs from "@/components/AdminTabs";
import { SentimentBadge, RatingStars } from "@/components/ReviewMeta";

const API = "http://localhost:5000/api/reviews";

function formatDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

// One review card: guest content on top, AI insight + reply workflow below.
function ReviewCard({ review, token, onPublished }) {
  // Draft priority: what the admin already published > the AI's suggestion.
  const [draft, setDraft] = useState(review.adminReply ?? review.suggestedReply ?? "");
  const [publishing, setPublishing] = useState(false);

  const publish = async () => {
    if (!draft.trim()) {
      notify("Write a reply before publishing", "error");
      return;
    }
    setPublishing(true);
    try {
      const res = await fetch(`${API}/${review.id}/reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reply: draft.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        notify(data.error || "Could not publish reply", "error");
        return;
      }
      notify("Reply published", "success");
      onPublished(data);
    } catch {
      notify("Network error — is the backend running?", "error");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="rounded-3xl bg-surface dark:bg-bark-soft border border-sand dark:border-bark-soft shadow-sm p-6">
      {/* Guest review */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold text-ink dark:text-parchment">
            {review.guestName}
          </h3>
          <div className="mt-0.5 flex items-center gap-3">
            <span className="text-sm text-clay font-medium">{review.roomType}</span>
            <RatingStars rating={review.rating} />
            {formatDate(review.createdAt) && (
              <span className="text-xs text-ink-soft/80 dark:text-parchment/50">
                {formatDate(review.createdAt)}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {review.adminReplied && (
            <span className="shrink-0 px-3 py-1 text-xs rounded-full font-semibold bg-forest text-parchment">
              Replied ✓
            </span>
          )}
          <SentimentBadge sentiment={review.sentiment} />
        </div>
      </div>
      <p className="mt-3 text-ink-soft dark:text-parchment/80 leading-relaxed">
        &ldquo;{review.reviewText}&rdquo;
      </p>

      {/* AI insight — admin-only data from /admin/all */}
      {review.aiTags?.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wider text-ink-soft/70 dark:text-parchment/40">
            AI tags
          </span>
          {review.aiTags.map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-0.5 text-xs rounded-full bg-canvas dark:bg-bark border border-sand dark:border-bark-soft text-ink-soft dark:text-parchment/70"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Reply workflow */}
      <div className="mt-5 pt-5 border-t border-sand dark:border-bark">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-ink dark:text-parchment">
            {review.adminReplied ? "Published reply" : "Reply to guest"}
            {review.adminReplied && formatDate(review.repliedAt) && (
              <span className="ml-2 text-xs font-normal text-ink-soft/70 dark:text-parchment/50">
                · {formatDate(review.repliedAt)}
              </span>
            )}
          </label>
          {!review.adminReplied && review.suggestedReply && (
            <span className="text-xs text-ink-soft/70 dark:text-parchment/40">
              ✨ Drafted by AI — edit freely
            </span>
          )}
        </div>
        <textarea
          rows={3}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={
            review.suggestedReply
              ? ""
              : "No AI draft available for this review — write your own reply."
          }
          className="w-full px-4 py-2.5 bg-canvas dark:bg-bark border border-sand dark:border-bark-soft rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-forest/40 focus:border-forest text-ink dark:text-parchment placeholder-ink-soft/60 dark:placeholder-parchment/40 transition-colors resize-y"
        />
        <div className="mt-3 flex justify-end">
          <Button size="sm" onClick={publish} disabled={publishing}>
            {publishing
              ? "Publishing…"
              : review.adminReplied
                ? "Update reply"
                : "Publish Reply"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function AdminReviewsContent() {
  const { data: session } = useSession();
  const token = session?.backendToken;

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API}/admin/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load reviews");
      setReviews(await res.json());
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

  const handlePublished = (updated) =>
    setReviews((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));

  const pending = reviews.filter((r) => !r.adminReplied).length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <AdminTabs />
      <div className="mb-8">
        <p className="text-sm font-medium uppercase tracking-wider text-clay">Admin</p>
        <h1 className="mt-2 font-display text-4xl font-semibold text-ink dark:text-parchment">
          Review Management
        </h1>
        <p className="mt-2 text-ink-soft dark:text-parchment/70">
          AI-analysed guest reviews with drafted replies.
          {!loading && reviews.length > 0 && (
            <span> {pending > 0 ? `${pending} awaiting a reply.` : "All replied — nice work."}</span>
          )}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader className="w-8 h-8 text-forest dark:text-moss" />
        </div>
      ) : error ? (
        <p className="text-clay">{error} — is the backend running on port 5000?</p>
      ) : reviews.length === 0 ? (
        <p className="text-ink-soft dark:text-parchment/70">No reviews yet.</p>
      ) : (
        <div className="space-y-5">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              token={token}
              onPublished={handlePublished}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminReviewsPage() {
  return (
    <RequireAdmin>
      <AdminReviewsContent />
    </RequireAdmin>
  );
}
