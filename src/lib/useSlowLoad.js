"use client";
import { useEffect, useState } from "react";

/**
 * True once `active` has been continuously true for `delay` ms.
 *
 * The API runs on Render's free tier, which spins the service down after a
 * period of inactivity; the first request afterwards waits for a cold start.
 * The backend keeps itself warm, but a genuinely cold hit can still happen
 * (e.g. right after a deploy). Rather than leaving a spinner looking hung, this
 * lets a page explain what's going on once the wait stops being normal.
 *
 * @param {boolean} active - Whether the thing we're waiting on is still loading
 * @param {number} [delay] - Milliseconds before the wait counts as slow
 */
export function useSlowLoad(active, delay = 4000) {
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!active) return;
    const id = setTimeout(() => setTimedOut(true), delay);
    // Reset on cleanup rather than in the effect body, so a finished load
    // doesn't trigger an extra render pass just to clear the flag.
    return () => {
      clearTimeout(id);
      setTimedOut(false);
    };
  }, [active, delay]);

  // Derived, so the flag can never outlive the load it describes.
  return active && timedOut;
}
