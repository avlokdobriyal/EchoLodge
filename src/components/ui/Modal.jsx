"use client";
import { useEffect, useRef } from "react";

/**
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {function} props.onClose - Function to call when requesting to close
 * @param {string} [props.title] - Modal title
 * @param {React.ReactNode} props.children - Modal content
 */
export default function Modal({ isOpen, onClose, title, children }) {
    const modalRef = useRef(null);

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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div
                ref={modalRef}
                tabIndex={-1}
                className="bg-surface dark:bg-bark-soft rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto outline-none border border-sand dark:border-bark-soft"
                role="dialog"
                aria-modal="true"
            >
                <div className="flex items-center justify-between p-4 border-b border-sand dark:border-bark">
                    <h2 className="font-display text-lg font-semibold text-ink dark:text-parchment">{title}</h2>
                    <button
                        onClick={onClose}
                        className="text-ink-soft hover:text-ink dark:text-parchment/60 dark:hover:text-parchment transition-colors focus:outline-none"
                        aria-label="Close"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
}