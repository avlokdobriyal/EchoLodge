/**
 * @param {Object} props
 * @param {string} [props.label] - Field label
 * @param {string} props.value - Selected value
 * @param {function} props.onChange - Change handler
 * @param {string} [props.error] - Error message to display
 * @param {Array<string | {value: string, label: string}>} props.options - Options list
 */
export default function Select({
  label,
  value,
  onChange,
  error,
  options = [],
  ...props
}) {
  return (
    <div className="flex w-full flex-col gap-1.5">
      {label && (
        <label className="text-[13px] font-medium text-ink">{label}</label>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          aria-invalid={error ? "true" : undefined}
          className={`w-full appearance-none rounded-sm border bg-surface py-2.5 pr-10 pl-3.5 text-[15px] text-ink transition-colors focus:outline-none ${
            error
              ? "border-accent"
              : "border-line hover:border-line-strong focus:border-accent"
          }`}
          {...props}
        >
          {options.map((o) => {
            const val = typeof o === "string" ? o : o.value;
            const lab = typeof o === "string" ? o : o.label;
            return (
              <option key={val} value={val}>
                {lab}
              </option>
            );
          })}
        </select>
        {/* Chevron as markup rather than a background data-URI, so it inherits
            currentColor and follows the theme instead of being welded to one
            ink value — the old one stayed brown in dark mode. */}
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-3.5 h-4 w-4 -translate-y-1/2 text-ink-faint"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
      {error && <p className="text-xs text-accent-text">{error}</p>}
    </div>
  );
}
