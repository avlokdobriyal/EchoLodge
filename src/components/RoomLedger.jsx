"use client";

import { motion, useReducedMotion } from "motion/react";

/*
 * The room ledger — one mark per real room.
 *
 * EchoLodge has twelve rooms. Not "many", not "a selection" — twelve, and you
 * can count them. So availability is drawn rather than described: every room in
 * a category gets a mark, warm if it's free for the chosen dates and hollow if
 * it isn't. "2 of 6 left" is a sentence you skim; two lit marks beside four
 * dark ones is a fact you feel.
 *
 * It also keeps the site honest. A big property can hide behind vague scarcity
 * copy. At this size the real number is the more persuasive one, and the ledger
 * can only ever show what the inventory actually says.
 *
 * Presentational only — it renders the numbers it is given and computes nothing.
 *
 * @param {Object} props
 * @param {number} props.total - Rooms in this category.
 * @param {number} [props.available] - Rooms free for the dates. Undefined = unknown.
 * @param {'sm'|'md'} [props.size]
 * @param {string} [props.className]
 */
export default function RoomLedger({
  total,
  available,
  size = "md",
  className = "",
}) {
  const reduce = useReducedMotion();

  if (!total || total < 1) return null;

  const known = typeof available === "number";
  const free = known ? Math.max(0, Math.min(available, total)) : 0;

  const bar = size === "sm" ? "h-3.5 w-[3px]" : "h-5 w-[5px]";
  // Marks need air between them or the row reads as one hatched block instead
  // of as a countable set — the whole point is that you can count them.
  const gap = size === "sm" ? "gap-[3px]" : "gap-1.5";

  return (
    <div
      className={`inline-flex items-end ${gap} ${className}`}
      role="img"
      aria-label={
        known
          ? `${free} of ${total} rooms available`
          : `${total} rooms in this category`
      }
    >
      {Array.from({ length: total }).map((_, i) => {
        const lit = known && i < free;
        return (
          <motion.span
            key={i}
            aria-hidden="true"
            className={`${bar} origin-bottom rounded-xs ${
              lit ? "bg-accent" : known ? "bg-line-strong" : "bg-ink-faint/45"
            }`}
            initial={false}
            // Only shrink a mark when we actually know it's taken. With no
            // dates chosen yet the ledger is just counting rooms, so every
            // mark stays full height — half-height marks read as broken.
            animate={
              reduce || !known
                ? {}
                : { scaleY: lit ? 1 : 0.5, opacity: lit ? 1 : 0.7 }
            }
            transition={{
              duration: 0.4,
              ease: [0.22, 1, 0.36, 1],
              // Marks resolve left to right, like a row being counted.
              delay: reduce ? 0 : i * 0.035,
            }}
          />
        );
      })}
    </div>
  );
}
