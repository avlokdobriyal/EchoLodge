/**
 * @param {Object} props
 * @param {string} [props.label] - Field label
 * @param {string} [props.placeholder] - Placeholder text
 * @param {string} props.value - Textarea value
 * @param {function} props.onChange - Change handler
 * @param {string} [props.error] - Error message to display
 * @param {number} [props.rows=4] - Number of rows
 */
export default function Textarea({
  label,
  placeholder,
  value,
  onChange,
  error,
  rows = 4,
  ...props
}) {
  return (
    <div className="flex w-full flex-col gap-1.5">
      {label && (
        <label className="text-[13px] font-medium text-ink">{label}</label>
      )}
      <textarea
        rows={rows}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-invalid={error ? "true" : undefined}
        className={`w-full resize-y rounded-sm border bg-surface px-3.5 py-2.5 text-[15px] leading-relaxed text-ink transition-colors placeholder:text-ink-faint focus:outline-none ${
          error
            ? "border-accent"
            : "border-line hover:border-line-strong focus:border-accent"
        }`}
        {...props}
      />
      {error && <p className="text-xs text-accent-text">{error}</p>}
    </div>
  );
}
