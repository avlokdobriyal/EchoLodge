"use client";
import { useState } from "react";
import { Button, Input, Select, Textarea } from "@/components/ui/index.js";
import { CATEGORY_NAMES } from "@/lib/categories";

// Kept as the accessible name for each star, so the control still reads as
// "4 — Very good" to a screen reader rather than as an unlabelled radio.
const RATING_WORDS = {
  5: "Excellent",
  4: "Very good",
  3: "Average",
  2: "Poor",
  1: "Terrible",
};

// Sentinel for "don't attach this review to a stay".
const NO_STAY = "";

function formatStayLabel(booking) {
  const room = booking.room?.name ?? `Room #${booking.roomId}`;
  const when = new Date(booking.checkInDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${room} — ${when}`;
}

/**
 * Reusable form for creating and editing a review. Sentiment is not entered
 * manually — it's derived by the AI pipeline on the backend.
 *
 * Room type is constrained to the lodge's real categories rather than free text,
 * and when the guest has stays on file they can attach one, which is what earns
 * the review its "Verified stay" badge.
 *
 * @param {Object} props
 * @param {Object} [props.initialValues] - Existing review values (edit mode)
 * @param {Array} [props.bookings] - The signed-in guest's bookings (create mode)
 * @param {string} [props.defaultGuestName] - Prefill from the session
 * @param {string[]} [props.categories] - Live room categories; falls back to the known set
 * @param {function} props.onSubmit - async (data) => void; parent handles the API call
 * @param {function} [props.onCancel] - Called when the user cancels
 * @param {string} [props.submitLabel] - Primary button text
 */
export default function ReviewForm({
  initialValues,
  bookings = [],
  defaultGuestName = "",
  categories,
  onSubmit,
  onCancel,
  submitLabel = "Submit Review",
}) {
  const isEdit = Boolean(initialValues);
  // Only stays that actually happened can back a review.
  const eligibleStays = bookings.filter((b) => b.status !== "CANCELLED");
  const roomTypes = categories?.length ? categories : CATEGORY_NAMES;

  const [form, setForm] = useState({
    guestName: initialValues?.guestName ?? defaultGuestName ?? "",
    roomType: initialValues?.roomType ?? roomTypes[0],
    reviewText: initialValues?.reviewText ?? "",
    rating: String(initialValues?.rating ?? 5),
    bookingId: NO_STAY,
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  // Picking a stay also fixes the room type — that's a fact of the booking,
  // not something the guest should be able to contradict.
  const setStay = (e) => {
    const bookingId = e.target.value;
    const stay = eligibleStays.find((b) => String(b.id) === bookingId);
    setForm((f) => ({
      ...f,
      bookingId,
      roomType: stay?.room?.category ?? f.roomType,
    }));
  };

  const linkedStay = eligibleStays.find((b) => String(b.id) === form.bookingId);

  const validate = () => {
    const next = {};
    if (!form.guestName.trim()) next.guestName = "Guest name is required";
    if (!form.roomType) next.roomType = "Room type is required";
    if (!form.reviewText.trim()) next.reviewText = "Review text is required";
    const rating = Number(form.rating);
    if (!rating || rating < 1 || rating > 5) next.rating = "Rating is required";
    return next;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      const payload = {
        guestName: form.guestName.trim(),
        roomType: form.roomType,
        reviewText: form.reviewText.trim(),
        rating: Number(form.rating),
      };
      // Only sent on create — edits never change the verified-stay link.
      if (!isEdit && form.bookingId) payload.bookingId = Number(form.bookingId);
      await onSubmit(payload);
    } finally {
      setSubmitting(false);
    }
  };

  const stayOptions = [
    { value: NO_STAY, label: "I'd rather not link a stay" },
    ...eligibleStays.map((b) => ({
      value: String(b.id),
      label: formatStayLabel(b),
    })),
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Guest name"
        placeholder="e.g. Priya Sharma"
        value={form.guestName}
        onChange={set("guestName")}
        error={errors.guestName}
      />

      {/* Stay selector — only when creating, and only when the guest
          actually has stays on file. */}
      {!isEdit && eligibleStays.length > 0 && (
        <div>
          <Select
            label="Which stay are you reviewing?"
            value={form.bookingId}
            onChange={setStay}
            options={stayOptions}
          />
          <p className="mt-1.5 text-xs text-ink-faint">
            {linkedStay
              ? "This review will be marked as a verified stay."
              : "Linking a stay adds a “Verified stay” badge to your review."}
          </p>
        </div>
      )}

      <Select
        label="Room type"
        value={form.roomType}
        onChange={set("roomType")}
        error={errors.roomType}
        options={roomTypes}
        disabled={Boolean(linkedStay)}
      />

      <Textarea
        label="Review"
        placeholder="How was your stay?"
        value={form.reviewText}
        onChange={set("reviewText")}
        error={errors.reviewText}
        rows={4}
      />

      {/* Stars rather than a dropdown. A rating is the one field here with a
          natural shape — asking someone to pick "★★★★☆ — Very good" out of a
          select is making them read their own opinion back to themselves.
          Still real radio inputs underneath, so keyboard and screen readers
          get a proper radio group. */}
      <fieldset>
        <legend className="text-[13px] font-medium text-ink">Rating</legend>
        <div className="mt-2 flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => {
            const active = Number(form.rating) >= n;
            return (
              <label
                key={n}
                className="group cursor-pointer p-0.5"
                title={`${n} — ${RATING_WORDS[n]}`}
              >
                <input
                  type="radio"
                  name="rating"
                  value={String(n)}
                  checked={form.rating === String(n)}
                  onChange={set("rating")}
                  className="peer sr-only"
                />
                <span className="sr-only">{`${n} — ${RATING_WORDS[n]}`}</span>
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  className={`h-6 w-6 rounded-xs transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent ${
                    active
                      ? "fill-accent"
                      : "fill-line-strong group-hover:fill-accent/40"
                  }`}
                >
                  <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 15l-5.2 2.6 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
                </svg>
              </label>
            );
          })}
          <span className="num ml-2 text-sm text-ink-muted">
            {RATING_WORDS[Number(form.rating)]}
          </span>
        </div>
        {errors.rating && (
          <p className="mt-1 text-xs text-accent-text">{errors.rating}</p>
        )}
      </fieldset>

      <p className="text-xs text-ink-faint">
        Sentiment is detected automatically by our AI when you submit.
      </p>

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : submitLabel}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
