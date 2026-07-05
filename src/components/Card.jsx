/**
 * @param {Object} props
 * @param {string} props.title - Card heading
 * @param {string} props.desc - Description text
 * @param {string} [props.tag] - Optional pill tag
 * @param {string} [props.image] - Optional image URL (renders a media header)
 * @param {number} [props.rating] - Optional rating out of 5
 */
export default function Card({ title, desc, tag, image, rating }) {
    return (
        <div className="group overflow-hidden rounded-3xl bg-surface dark:bg-bark-soft border border-sand dark:border-bark-soft shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            {image && (
                <div className="relative h-48 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={image}
                        alt={title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-bark/30 to-transparent" />
                </div>
            )}
            <div className="p-6">
                <div className="flex justify-between items-start gap-3 mb-3">
                    <h3 className="font-display text-xl font-semibold text-ink dark:text-parchment">{title}</h3>
                    {tag && (
                        <span className="shrink-0 inline-flex items-center rounded-full bg-forest/10 dark:bg-moss/15 px-3 py-1 text-xs font-medium text-forest dark:text-moss">
                            {tag}
                        </span>
                    )}
                </div>
                <p className="text-ink-soft dark:text-parchment/70 leading-relaxed">{desc}</p>
                {typeof rating === "number" && (
                    <div className="mt-4 flex items-center gap-1 text-clay" aria-label={`Rated ${rating} out of 5`}>
                        {Array.from({ length: 5 }).map((_, i) => (
                            <svg
                                key={i}
                                className={`h-4 w-4 ${i < Math.round(rating) ? "fill-clay" : "fill-sand dark:fill-bark"}`}
                                viewBox="0 0 20 20"
                            >
                                <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 15l-5.2 2.6 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
                            </svg>
                        ))}
                        <span className="ml-1.5 text-sm font-medium text-ink-soft dark:text-parchment/70">{rating.toFixed(1)}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
