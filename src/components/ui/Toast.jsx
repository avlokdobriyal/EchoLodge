"use client";
import toast, { Toaster } from "react-hot-toast";

/**
 * Global Toast Provider to wrap the application
 */
export function ToastProvider({ children }) {
  return (
    <>
      <Toaster
        position="top-right"
        // react-hot-toast writes inline styles, so classes lose to its own
        // defaults. Pointing at the CSS variables instead means toasts follow
        // the theme toggle live, with no dark: twin to keep in sync.
        toastOptions={{
          style: {
            background: "var(--color-surface)",
            color: "var(--color-ink)",
            border: "1px solid var(--color-line)",
            borderRadius: "var(--radius-sm)",
            boxShadow: "var(--shadow-lg)",
            fontSize: "14px",
            padding: "10px 14px",
            maxWidth: "22rem",
          },
          success: {
            iconTheme: {
              primary: "var(--color-ridge-600)",
              secondary: "var(--color-surface)",
            },
          },
          error: {
            iconTheme: {
              primary: "var(--color-alert)",
              secondary: "var(--color-surface)",
            },
          },
        }}
      />
      {children}
    </>
  );
}

/**
 * Toast notification trigger
 * @param {string} message - Notification message
 * @param {'success' | 'error' | 'loading' | 'blank'} [type='success'] - Toast type
 */
export const notify = (message, type = "success") => {
  switch (type) {
    case "success":
      return toast.success(message);
    case "error":
      return toast.error(message);
    case "loading":
      return toast.loading(message);
    default:
      return toast(message);
  }
};
