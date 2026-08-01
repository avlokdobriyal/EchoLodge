// Small presentational helpers shared by the dashboard and admin review UIs.

const sentimentStyles = {
  POSITIVE: "bg-forest/10 text-forest dark:bg-moss/20 dark:text-moss",
  NEGATIVE: "bg-clay/15 text-clay-dark dark:bg-clay/25 dark:text-clay",
  NEUTRAL: "bg-sand text-ink-soft dark:bg-bark dark:text-parchment/70",
};

// Sentiment is AI-generated and nullable (null = analysis unavailable).
export function SentimentBadge({ sentiment }) {
  if (!sentiment) return null;
  const key = sentiment.toUpperCase();
  const label = key.charAt(0) + key.slice(1).toLowerCase();
  return (
    <span
      className={`shrink-0 inline-block px-3 py-1 text-xs rounded-full font-semibold ${
        sentimentStyles[key] || sentimentStyles.NEUTRAL
      }`}
    >
      {label}
    </span>
  );
}

// Shown when a review is linked to a booking the author actually holds, which
// the backend resolves server-side — the client can never set it.
export function VerifiedStayBadge({ verified }) {
  if (!verified) return null;
  return (
    <span
      className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full font-semibold bg-forest/10 text-forest dark:bg-moss/20 dark:text-moss"
      title="This guest booked and stayed with us"
    >
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
      Verified stay
    </span>
  );
}

export function RatingStars({ rating }) {
  if (!rating) return null;
  return (
    <span className="text-sm text-clay tracking-tight" aria-label={`${rating} out of 5 stars`}>
      {"★".repeat(rating)}
      <span className="opacity-30">{"★".repeat(5 - rating)}</span>
    </span>
  );
}
