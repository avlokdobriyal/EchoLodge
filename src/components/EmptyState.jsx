/**
 * Friendly placeholder for lists with no data yet.
 *
 * An empty screen is an invitation, so the copy passed in should say what to do
 * next rather than only reporting that there's nothing here.
 *
 * @param {Object} props
 * @param {string} props.title - Main empty-state line
 * @param {string} [props.hint] - Softer supporting line
 * @param {React.ReactNode} [props.action] - Optional CTA (usually a Button)
 * @param {string} [props.className]
 */
export default function EmptyState({ title, hint, action, className = "" }) {
  return (
    <div
      className={`animate-fade-in rounded-md border border-line bg-surface-2/60 px-6 py-14 text-center ${className}`}
    >
      <div className="mx-auto flex h-11 w-16 items-end justify-center overflow-hidden rounded-xs">
        {/* The same ridge silhouette the image fallback uses, so "nothing here
            yet" looks like part of the site rather than a missing asset. */}
        <svg
          aria-hidden="true"
          viewBox="0 0 120 60"
          preserveAspectRatio="none"
          className="h-full w-full text-line-strong"
          fill="currentColor"
        >
          <path d="M0 60h120V34l-18-14-13 10-16-18-19 22-12-8-16 14-26 6z" />
        </svg>
      </div>
      <p className="mt-4 font-medium text-ink">{title}</p>
      {hint && <p className="mt-1.5 text-sm text-ink-muted">{hint}</p>}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}
