"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * next/image with a designed failure state.
 *
 * A missing photograph is a normal condition on a site whose images are
 * placeholders — a broken-image glyph on a room card would undo everything
 * else on the page. When the file can't be loaded this falls back to a ridge
 * silhouette drawn in the palette, which reads as intentional rather than
 * broken.
 *
 * Purely presentational: it renders whatever `src` it is handed and never
 * decides what that should be.
 *
 * @param {Object} props
 * @param {string} [props.src] - Image path. Missing or failing → fallback.
 * @param {string} props.alt - Alt text. Empty string for decorative images.
 * @param {string} [props.className] - Classes for the <img> itself.
 * @param {string} [props.sizes] - Responsive sizes hint.
 * @param {boolean} [props.priority] - Skip lazy-loading for above-the-fold art.
 */
export default function Photo({
  src,
  alt = "",
  className = "",
  sizes = "100vw",
  priority = false,
  ...rest
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        aria-hidden={alt ? undefined : "true"}
        role={alt ? "img" : undefined}
        aria-label={alt || undefined}
        className="absolute inset-0 flex items-end justify-center overflow-hidden bg-gradient-to-b from-ridge-200 to-ridge-300 dark:from-ridge-800 dark:to-ridge-900"
      >
        {/* Ridge silhouette — the same shape the brand is built on. */}
        <svg
          viewBox="0 0 120 60"
          preserveAspectRatio="none"
          className="h-2/3 w-full text-ridge-400/50 dark:text-ridge-950/60"
          fill="currentColor"
        >
          <path d="M0 60h120V34l-18-14-13 10-16-18-19 22-12-8-16 14-26 6z" />
        </svg>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      onError={() => setFailed(true)}
      className={className}
      {...rest}
    />
  );
}
