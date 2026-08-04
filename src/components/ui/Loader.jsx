/**
 * @param {Object} props
 * @param {string} [props.className] - Additional classes
 */
// Renders a <span>, not a <div>: spinners routinely sit inside a sentence, and
// a <div> inside a <p> is invalid HTML that React reports as a hydration error.
// Keeping it phrasing content makes the component safe in every context.
export default function Loader({ className = "" }) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] ${className}`}
      role="status"
    >
      <span className="sr-only">Loading…</span>
    </span>
  );
}
