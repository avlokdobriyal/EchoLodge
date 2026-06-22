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
        toastOptions={{
          className: 'dark:bg-slate-800 dark:text-slate-100',
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