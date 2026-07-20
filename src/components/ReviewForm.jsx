"use client";
import { useState } from "react";
import { Button, Input, Select, Textarea } from "@/components/ui/index.js";

export const ROOM_TYPES = ["Standard", "Deluxe", "Suite"];

const RATINGS = [
    { value: "5", label: "★★★★★ — Excellent" },
    { value: "4", label: "★★★★☆ — Very good" },
    { value: "3", label: "★★★☆☆ — Average" },
    { value: "2", label: "★★☆☆☆ — Poor" },
    { value: "1", label: "★☆☆☆☆ — Terrible" },
];

/**
 * Reusable form for creating and editing a review. Sentiment is no longer
 * entered manually — it's derived by the AI pipeline on the backend.
 * @param {Object} props
 * @param {Object} [props.initialValues] - Existing review values (edit mode)
 * @param {function} props.onSubmit - async (data) => void; parent handles the API call
 * @param {function} [props.onCancel] - Called when the user cancels
 * @param {string} [props.submitLabel] - Primary button text
 */
export default function ReviewForm({ initialValues, onSubmit, onCancel, submitLabel = "Submit Review" }) {
    const [form, setForm] = useState({
        guestName: initialValues?.guestName ?? "",
        roomType: initialValues?.roomType ?? ROOM_TYPES[0],
        reviewText: initialValues?.reviewText ?? "",
        rating: String(initialValues?.rating ?? 5),
    });
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

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
            await onSubmit({
                guestName: form.guestName.trim(),
                roomType: form.roomType,
                reviewText: form.reviewText.trim(),
                rating: Number(form.rating),
            });
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
            <Select
                label="Room type"
                value={form.roomType}
                onChange={set("roomType")}
                error={errors.roomType}
                options={ROOM_TYPES}
            />
            <Textarea
                label="Review"
                placeholder="What did the guest say about their stay?"
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
