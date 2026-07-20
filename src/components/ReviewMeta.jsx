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

export function RatingStars({ rating }) {
  if (!rating) return null;
  return (
    <span className="text-sm text-clay tracking-tight" aria-label={`${rating} out of 5 stars`}>
      {"★".repeat(rating)}
      <span className="opacity-30">{"★".repeat(5 - rating)}</span>
    </span>
  );
}
