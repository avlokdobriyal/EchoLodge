/*
 * The EchoLodge mark.
 *
 * A ridge line and its echo in the water below. The name is the drawing: an
 * echo is a thing that comes back to you changed, and a reflection on the Ganga
 * is exactly that — the same ridge, softer, shorter, and warmer because it is
 * catching the first light. It also says "mountains" and "river" in one shape,
 * which is the whole of where this lodge sits.
 *
 * The reflection is compressed to 55% rather than mirrored exactly, because a
 * true mirror reads as a butterfly, not as water.
 *
 * Colour: the ridge is currentColor, so it inherits whatever the parent sets —
 * ink on canvas, quartz over the hero photograph — and needs no dark: variant.
 * Only the reflection carries its own colour.
 */

export const LOGO_VIEWBOX = "0 0 40 32";

// Ridge: two peaks, the second higher, so the silhouette has somewhere to go.
export const RIDGE_PATH = "M4 18 L13 6 L19 12 L26 3 L36 18";

// The same points mirrored about the waterline (y=19.5) and squashed to 55%.
export const REFLECTION_PATH = "M4 20.3 L13 26.9 L19 23.6 L26 28.6 L36 20.3";

/**
 * The mark on its own — no wordmark. Use in tight spaces (favicons, avatars,
 * the loading screen).
 *
 * @param {Object} props
 * @param {string} [props.className] - Sizing/colour classes for the <svg>
 * @param {string} [props.title] - Accessible name. Omit for decorative use.
 */
export function LogoMark({ className = "h-6 w-[30px]", title }) {
  return (
    <svg
      viewBox={LOGO_VIEWBOX}
      className={className}
      fill="none"
      role={title ? "img" : undefined}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : "true"}
    >
      <path
        d={RIDGE_PATH}
        stroke="currentColor"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* currentColor resolves per element, so text-accent on this path alone
          tints the reflection without touching the ridge above it. */}
      <path
        className="text-accent"
        d={REFLECTION_PATH}
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.75}
      />
    </svg>
  );
}

/**
 * Mark plus wordmark, as used in the header and footer.
 *
 * 'Lodge' is set in the same colour at 65% opacity rather than a second colour
 * token. That way the whole lockup works on canvas, on a dark panel and over a
 * photograph from one parent text colour — nothing to keep in sync.
 *
 * @param {Object} props
 * @param {string} [props.className] - Classes for the wrapping element
 * @param {string} [props.markClassName] - Sizing for the mark
 * @param {string} [props.wordClassName] - Sizing/weight for the wordmark
 */
export default function Logo({
  className = "",
  markClassName = "h-6 w-[30px]",
  wordClassName = "text-[19px]",
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark className={markClassName} />
      <span className={`tracking-tight ${wordClassName}`}>
        <span className="font-semibold">Echo</span>
        <span className="font-normal opacity-65">Lodge</span>
      </span>
    </span>
  );
}
