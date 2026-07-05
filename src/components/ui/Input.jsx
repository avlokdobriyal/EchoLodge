/**
 * @param {Object} props
 * @param {string} props.label - Input label text
 * @param {string} [props.placeholder] - Input placeholder
 * @param {string} [props.type='text'] - Input type (text, email, password, etc.)
 * @param {string} props.value - Input value
 * @param {function} props.onChange - Change handler
 * @param {string} [props.error] - Error message to display
 */
export default function Input({ label, placeholder, type = "text", value, onChange, error, ...props }) {
    return (
        <div className="flex flex-col space-y-1 w-full">
            {label && <label className="text-sm font-medium text-ink dark:text-parchment">{label}</label>}
            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className={`px-4 py-2.5 bg-surface dark:bg-bark border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-forest/40 text-ink dark:text-parchment placeholder-ink-soft/60 dark:placeholder-parchment/40 transition-colors ${error ? "border-clay focus:border-clay focus:ring-clay/40" : "border-sand dark:border-bark-soft focus:border-forest"
                    }`}
                {...props}
            />
            {error && <p className="text-xs text-clay mt-1">{error}</p>}
        </div>
    );
}