"use client";
import { useState } from "react";
import { Button, Input, Select, Textarea } from "@/components/ui/index.js";

export const ROOM_TYPES = ["Standard", "Deluxe", "Suite"];

export const SENTIMENTS = [
    { value: "positive", label: "Positive" },
    { value: "neutral", label: "Neutral" },
    { value: "negative", label: "Negative" },
];

/**
 * Reusable form for creating and editing a review.
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
        sentiment: initialValues?.sentiment ?? "positive",
    });
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

    const validate = () => {
        const next = {};
        if (!form.guestName.trim()) next.guestName = "Guest name is required";
        if (!form.roomType) next.roomType = "Room type is required";
        if (!form.reviewText.trim()) next.reviewText = "Review text is required";
        if (!form.sentiment) next.sentiment = "Sentiment is required";
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
                sentiment: form.sentiment,
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
                label="Sentiment"
                value={form.sentiment}
                onChange={set("sentiment")}
                error={errors.sentiment}
                options={SENTIMENTS}
            />
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
