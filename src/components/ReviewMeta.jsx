// Small presentational helpers shared by the dashboard and admin review UIs.

// Sentiment is an observation, so it's drawn in the cool half of the palette —
// with one exception: a negative reading uses the alert tone, because it's the
// one an owner needs to catch while scanning an inbox.
const sentimentStyles = {
  POSITIVE: "border-ridge-400/40 text-ridge-600 dark:text-ridge-300",
  NEGATIVE: "border-alert/40 text-alert",
  NEUTRAL: "border-line-strong text-ink-faint",
};

export function SentimentBadge({ sentiment }) {
  if (!sentiment) return null;
  const key = sentiment.toUpperCase();
  const label = key.charAt(0) + key.slice(1).toLowerCase();
  return (
    <span
      className={`eyebrow shrink-0 rounded-xs border px-2 py-1 ${
        sentimentStyles[key] || sentimentStyles.NEUTRAL
      }`}
    >
      {label}
    </span>
  );
}

// Shown when a review is linked to a booking the author actually holds, which
// the backend resolves server-side — the client can never set it. Drawn as a
// filled cool chip rather than an outline: it's the strongest trust signal on
// the page and should out-rank the sentiment badge beside it.
export function VerifiedStayBadge({ verified }) {
  if (!verified) return null;
  return (
    <span
      className="eyebrow inline-flex shrink-0 items-center gap-1.5 rounded-xs bg-ridge-800 px-2 py-1 text-quartz-100 dark:bg-ridge-700"
      title="This guest booked and stayed with us"
    >
      <svg
        aria-hidden="true"
        className="h-3 w-3"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={3}
          d="M5 13l4 4L19 7"
        />
      </svg>
      Verified stay
    </span>
  );
}

// The one sanctioned warm exception outside of actions: a rating is the single
// moment on the page where the guest's own verdict is the point, and warm is
// how this palette says "look here".
export function RatingStars({ rating }) {
  if (!rating) return null;
  return (
    <span
      className="inline-flex items-center gap-0.5 text-accent"
      aria-label={`${rating} out of 5 stars`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          aria-hidden="true"
          className={`h-3.5 w-3.5 ${
            i < rating ? "fill-accent" : "fill-line-strong"
          }`}
          viewBox="0 0 20 20"
        >
          <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 15l-5.2 2.6 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
        </svg>
      ))}
    </span>
  );
}
