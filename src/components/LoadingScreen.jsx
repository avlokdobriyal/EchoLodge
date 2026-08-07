"use client";

import { motion, useReducedMotion } from "motion/react";
import Logo, {
  LOGO_VIEWBOX,
  RIDGE_PATH,
  REFLECTION_PATH,
} from "./Logo";

/*
 * The loading state, built on the logo rather than beside it.
 *
 * The mark is a ridge and its echo in the water, so the animation is just that
 * happening in time: the ridge draws itself, and half a beat later the
 * reflection follows. An echo is a thing that arrives late — the delay is the
 * whole point, and it's why this reads as EchoLodge loading rather than as a
 * generic spinner with a logo parked on top of it.
 *
 * Both strokes are currentColor, so the screen needs no dark: variant at all —
 * it inherits ink on canvas and flips with the theme for free.
 */

const EASE = [0.65, 0, 0.35, 1];
const CYCLE = 2.6; // seconds for one full draw-hold-exit

// Draw, hold, then let the tail run off the end. The first version faded the
// stroke out over half the cycle, which meant that at any given moment there
// was a good chance of catching an empty screen — the one thing a loading state
// must never look like. Holding pathLength at 1 through the middle and then
// sliding pathOffset to 1 keeps a mark on screen for all but an instant, and
// the exit reads as the line travelling on rather than switching off.
const DRAW = {
  pathLength: [0, 1, 1, 0],
  pathOffset: [0, 0, 0, 1],
};
// Draw 38% · hold 40% · exit 22%. Weighted towards the hold so the completed
// mark is what you mostly see, and the near-empty instant between exit and
// redraw stays under a third of a second.
const DRAW_TIMES = [0, 0.38, 0.78, 1];

/**
 * @param {Object} props
 * @param {string} [props.label] - Announced to screen readers and shown under the mark.
 * @param {string} [props.className] - Extra classes for the wrapper.
 * @param {boolean} [props.fullScreen] - Cover the viewport instead of filling the slot.
 */
export default function LoadingScreen({
  label = "Loading",
  className = "",
  fullScreen = false,
}) {
  const reduce = useReducedMotion();

  const wrapper = fullScreen
    ? "fixed inset-0 z-50 bg-canvas"
    : "min-h-[60vh] w-full";

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center gap-6 ${wrapper} ${className}`}
    >
      {/* A drawn stroke can't be reproduced without motion, so the reduced
          version simply shows the finished mark. No pulse, no fade — "reduce"
          means reduce, not "animate something smaller instead". */}
      {reduce ? (
        <Logo markClassName="h-12 w-[60px]" wordClassName="text-2xl" />
      ) : (
        <div className="flex flex-col items-center gap-5">
          <svg
            viewBox={LOGO_VIEWBOX}
            className="h-20 w-[100px] text-ink"
            fill="none"
            aria-hidden="true"
          >
            <motion.path
              d={RIDGE_PATH}
              stroke="currentColor"
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
              animate={DRAW}
              transition={{
                duration: CYCLE,
                times: DRAW_TIMES,
                repeat: Infinity,
                ease: EASE,
              }}
            />
            <motion.path
              className="text-accent"
              d={REFLECTION_PATH}
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.8}
              animate={DRAW}
              transition={{
                duration: CYCLE,
                times: DRAW_TIMES,
                repeat: Infinity,
                ease: EASE,
                // The echo lands after the sound. Anything under ~0.2s and the
                // two strokes read as one gesture rather than as a reply.
                delay: 0.34,
              }}
            />
          </svg>

          <motion.span
            className="eyebrow text-ink-faint"
            animate={{ opacity: [0.35, 1, 0.35] }}
            transition={{ duration: CYCLE, repeat: Infinity, ease: "easeInOut" }}
          >
            EchoLodge
          </motion.span>
        </div>
      )}

      <span className="sr-only">{label}</span>
    </div>
  );
}
