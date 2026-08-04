"use client";
import { useEffect, useRef } from "react";
import {
  motion,
  AnimatePresence,
  dialogMotion,
  scrimMotion,
} from "../motion/index.jsx";

/**
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {function} props.onClose - Function to call when requesting to close
 * @param {string} [props.title] - Modal title
 * @param {'md'|'lg'} [props.size='md'] - Panel width. 'lg' for flows with media.
 * @param {React.ReactNode} props.children - Modal content
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  size = "md",
  children,
}) {
  const modalRef = useRef(null);
  const maxWidth = size === "lg" ? "max-w-lg" : "max-w-md";

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Focus trap basic setup
      modalRef.current?.focus();
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  // Hold the page still behind the dialog. Without this the background scrolls
  // under the scrim on mobile, which makes the modal feel detached.
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ridge-950/55 p-4 backdrop-blur-[3px]"
          // Dismiss on the scrim only — a click that started inside the panel
          // bubbles up here, so compare the target against the scrim itself.
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          {...scrimMotion}
        >
          <motion.div
            ref={modalRef}
            tabIndex={-1}
            className={`max-h-[90vh] w-full ${maxWidth} overflow-y-auto rounded-lg border border-line bg-surface shadow-lg outline-none`}
            role="dialog"
            aria-modal="true"
            {...dialogMotion}
          >
            <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
              <h2 className="text-[17px] font-semibold tracking-tight text-ink">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="-m-1 rounded-sm p-1 text-ink-faint transition-colors hover:text-ink"
                aria-label="Close"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
