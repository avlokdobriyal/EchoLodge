"use client";
import Modal from "./Modal";
import Button from "./Button";

/**
 * Confirmation modal for destructive actions — replaces window.confirm so the
 * dialog matches the design system and works consistently across browsers.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {function} props.onClose - Dismiss without acting
 * @param {function} props.onConfirm - Called when the user confirms
 * @param {string} [props.title]
 * @param {React.ReactNode} [props.message]
 * @param {string} [props.confirmLabel]
 * @param {boolean} [props.busy] - Disables both buttons while the action runs
 */
export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmLabel = "Delete",
  busy = false,
}) {
  return (
    <Modal isOpen={isOpen} onClose={busy ? () => {} : onClose} title={title}>
      <p className="text-ink-soft dark:text-parchment/70 leading-relaxed">{message}</p>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={busy}>
          {busy ? "Working…" : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
