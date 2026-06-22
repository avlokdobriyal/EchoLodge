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
      {label && <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`px-3 py-2 bg-white dark:bg-slate-900 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition-colors ${
          error ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-slate-300 dark:border-slate-700 focus:border-emerald-500"
        }`}
        {...props}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}