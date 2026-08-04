import Photo from "./ui/Photo";

/**
 * @param {Object} props
 * @param {string} props.title - Card heading
 * @param {string} props.desc - Description text
 * @param {string} [props.tag] - Optional pill tag
 * @param {string} [props.image] - Optional image path under /public (renders a media header)
 * @param {boolean} [props.priority] - Skip lazy-loading (for above-the-fold cards)
 * @param {number} [props.rating] - Optional rating out of 5
 */
export default function Card({
  title,
  desc,
  tag,
  image,
  priority = false,
  rating,
}) {
  return (
    <article className="group card-lift flex h-full flex-col overflow-hidden rounded-md border border-line bg-surface">
      {image && (
        <div className="photo-wake relative aspect-[4/3] overflow-hidden bg-surface-2">
          <Photo
            src={image}
            alt={title}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={priority}
            className="object-cover"
          />
          {/* Scrim only across the lower third, so the tag stays legible on a
              bright photograph without dulling the whole image. */}
          <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-ridge-950/70 to-transparent" />
          {tag && (
            <span className="eyebrow absolute bottom-3 left-3 rounded-xs bg-ridge-950/45 px-2 py-1 text-quartz-100 backdrop-blur-sm">
              {tag}
            </span>
          )}
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        {/* Without a photo there's nowhere to overlay the tag, so it sits above
            the title instead of crowding it on the same line. */}
        {tag && !image && (
          <span className="eyebrow mb-2 text-ink-faint">{tag}</span>
        )}
        <h3 className="text-lg font-semibold tracking-tight text-ink">
          {title}
        </h3>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-muted">{desc}</p>
        {typeof rating === "number" && (
          <div
            className="mt-4 flex items-center gap-1 text-accent"
            aria-label={`Rated ${rating} out of 5`}
          >
            {Array.from({ length: 5 }).map((_, i) => (
              <svg
                key={i}
                aria-hidden="true"
                className={`h-3.5 w-3.5 ${
                  i < Math.round(rating) ? "fill-accent" : "fill-line-strong"
                }`}
                viewBox="0 0 20 20"
              >
                <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 15l-5.2 2.6 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
              </svg>
            ))}
            <span className="num ml-1.5 text-sm font-medium text-ink-muted">
              {rating.toFixed(1)}
            </span>
          </div>
        )}
      </div>
    </article>
  );
}
