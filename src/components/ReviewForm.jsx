"use client";
import { useState } from "react";
import { Button, Input, Select, Textarea } from "@/components/ui/index.js";
import { CATEGORY_NAMES } from "@/lib/categories";

const RATINGS = [
    { value: "5", label: "★★★★★ — Excellent" },
    { value: "4", label: "★★★★☆ — Very good" },
    { value: "3", label: "★★★☆☆ — Average" },
    { value: "2", label: "★★☆☆☆ — Poor" },
    { value: "1", label: "★☆☆☆☆ — Terrible" },
];

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
                <div className="flex flex-col space-y-1 w-full">
                    <label className="text-sm font-medium text-ink dark:text-parchment">
                        Which stay are you reviewing?
                    </label>
                    <select
                        value={form.bookingId}
                        onChange={setStay}
                        className="px-4 py-2.5 bg-surface dark:bg-bark border border-sand dark:border-bark-soft rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-forest/40 text-ink dark:text-parchment transition-colors"
                    >
                        <option value={NO_STAY}>I&rsquo;d rather not link a stay</option>
                        {eligibleStays.map((b) => (
                            <option key={b.id} value={String(b.id)}>
                                {formatStayLabel(b)}
                            </option>
                        ))}
                    </select>
                    <p className="text-xs text-ink-soft dark:text-parchment/50">
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
            <Select
                label="Rating"
                value={form.rating}
                onChange={set("rating")}
                error={errors.rating}
                options={RATINGS}
            />
            <p className="text-xs text-ink-soft dark:text-parchment/50">
                Sentiment is detected automatically by our AI when you submit.
            </p>
            <div className="flex items-center gap-3 pt-1">
                <Button type="submit" disabled={submitting}>
                    {submitting ? "Saving…" : submitLabel}
                </Button>
                {onCancel && (
                    <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
                        Cancel
                    </Button>
                )}
            </div>
        </form>
    );
}
