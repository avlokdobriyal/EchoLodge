"use client";

import {
  motion,
  useReducedMotion,
  useSpring,
  useTransform,
  AnimatePresence,
} from "motion/react";
import { useEffect } from "react";

/*
 * Shared motion vocabulary.
 *
 * Everything here is presentational — these components wrap content and never
 * touch the data or state that flows through them. The rule throughout is that
 * an animation either explains something (this arrived, this changed, this
 * opened) or it doesn't ship.
 *
 * Every export checks useReducedMotion() and degrades to a plain element, so
 * "respects reduced motion" is a property of the system rather than something
 * each call site has to remember.
 */

const EASE = [0.22, 1, 0.36, 1];

/** Fade and rise as the element scrolls into view. Fires once, not on every pass. */
export function Reveal({
  children,
  delay = 0,
  y = 18,
  className = "",
  ...rest
}) {
  const reduce = useReducedMotion();

  if (reduce) {
    return (
      <div className={className} {...rest}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-64px" }}
      transition={{ duration: 0.65, ease: EASE, delay }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/**
 * Parent for a group that should arrive in sequence rather than all at once.
 * Pair with <StaggerItem>. 60ms apart reads as "settling"; much more than that
 * and it starts to feel like the page is loading slowly.
 */
export function Stagger({ children, className = "", gap = 0.06, ...rest }) {
  const reduce = useReducedMotion();

  if (reduce) {
    return (
      <div className={className} {...rest}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, margin: "-48px" }}
      variants={{
        hidden: {},
        shown: { transition: { staggerChildren: gap } },
      }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className = "", y = 20, ...rest }) {
  const reduce = useReducedMotion();

  if (reduce) {
    return (
      <div className={className} {...rest}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y },
        shown: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
      }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/**
 * A number that travels to its new value instead of jumping.
 *
 * Used for room availability: when the dates change and four rooms become one,
 * watching the number fall communicates scarcity in a way that re-rendering a
 * different digit does not.
 */
export function Counter({ value, className = "" }) {
  const reduce = useReducedMotion();
  const spring = useSpring(value, { stiffness: 190, damping: 26 });
  const rounded = useTransform(spring, (v) => Math.round(v));

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  if (reduce) return <span className={className}>{value}</span>;

  return <motion.span className={className}>{rounded}</motion.span>;
}

/** Spring-in for dialogs. Scale starts near 1 — anything smaller reads as a popup toy. */
export const dialogMotion = {
  initial: { opacity: 0, scale: 0.97, y: 12 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.98, y: 6 },
  transition: { type: "spring", stiffness: 320, damping: 30, mass: 0.7 },
};

export const scrimMotion = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.22, ease: "easeOut" },
};

export { motion, AnimatePresence, useReducedMotion, EASE };
