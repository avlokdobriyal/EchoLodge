/**
 * @param {Object} props
 * @param {string} [props.label] - Field label
 * @param {string} props.value - Selected value
 * @param {function} props.onChange - Change handler
 * @param {string} [props.error] - Error message to display
 * @param {Array<string | {value: string, label: string}>} props.options - Options list
 */
export default function Select({ label, value, onChange, error, options = [], ...props }) {
    return (
        <div className="flex flex-col space-y-1 w-full">
            {label && <label className="text-sm font-medium text-ink dark:text-parchment">{label}</label>}
            <select
                value={value}
                onChange={onChange}
                className={`px-4 py-2.5 bg-surface dark:bg-bark border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-forest/40 text-ink dark:text-parchment transition-colors appearance-none bg-[length:1rem] bg-[right_0.75rem_center] bg-no-repeat ${error ? "border-clay focus:border-clay focus:ring-clay/40" : "border-sand dark:border-bark-soft focus:border-forest"
                    }`}
                style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b5f52' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")" }}
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
            {error && <p className="text-xs text-clay mt-1">{error}</p>}
        </div>
    );
}
