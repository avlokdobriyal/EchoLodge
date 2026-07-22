/**
 * Friendly placeholder for lists with no data yet.
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
      className={`rounded-3xl border border-dashed border-sand dark:border-bark-soft py-14 px-6 text-center animate-fade-in ${className}`}
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-forest/10 dark:bg-moss/15 text-forest dark:text-moss">
        {/* Lotus-ish leaf mark — matches the organic brand language */}
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M12 3c2.5 2.5 3.5 5.5 3.5 8.5S14.5 17 12 19c-2.5-2-3.5-4.5-3.5-7.5S9.5 5.5 12 3zM4 13c2 .5 3.8 1.6 5 3.5M20 13c-2 .5-3.8 1.6-5 3.5"
          />
        </svg>
      </div>
      <p className="mt-4 font-medium text-ink dark:text-parchment">{title}</p>
      {hint && <p className="mt-1.5 text-sm text-ink-soft dark:text-parchment/60">{hint}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
