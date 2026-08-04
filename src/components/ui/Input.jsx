/**
 * @param {Object} props
 * @param {string} props.label - Input label text
 * @param {string} [props.placeholder] - Input placeholder
 * @param {string} [props.type='text'] - Input type (text, email, password, etc.)
 * @param {string} props.value - Input value
 * @param {function} props.onChange - Change handler
 * @param {string} [props.error] - Error message to display
 */
export default function Input({
  label,
  placeholder,
  type = "text",
  value,
  onChange,
  error,
  ...props
}) {
  return (
    <div className="flex w-full flex-col gap-1.5">
      {label && (
        <label className="text-[13px] font-medium text-ink">{label}</label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-invalid={error ? "true" : undefined}
        className={`w-full rounded-sm border bg-surface px-3.5 py-2.5 text-[15px] text-ink transition-colors placeholder:text-ink-faint focus:outline-none ${
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
