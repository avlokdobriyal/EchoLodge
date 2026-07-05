/**
 * @param {Object} props
 * @param {string} [props.label] - Field label
 * @param {string} [props.placeholder] - Placeholder text
 * @param {string} props.value - Textarea value
 * @param {function} props.onChange - Change handler
 * @param {string} [props.error] - Error message to display
 * @param {number} [props.rows=4] - Number of rows
 */
export default function Textarea({ label, placeholder, value, onChange, error, rows = 4, ...props }) {
    return (
        <div className="flex flex-col space-y-1 w-full">
            {label && <label className="text-sm font-medium text-ink dark:text-parchment">{label}</label>}
            <textarea
                rows={rows}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className={`px-4 py-2.5 bg-surface dark:bg-bark border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-forest/40 text-ink dark:text-parchment placeholder-ink-soft/60 dark:placeholder-parchment/40 transition-colors resize-y ${error ? "border-clay focus:border-clay focus:ring-clay/40" : "border-sand dark:border-bark-soft focus:border-forest"
                    }`}
                {...props}
            />
            {error && <p className="text-xs text-clay mt-1">{error}</p>}
        </div>
    );
}
