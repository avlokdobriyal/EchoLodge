import Link from "next/link";

/**
 * @param {Object} props
 * @param {React.ReactNode} props.children - The content of the button
 * @param {'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'} [props.variant='primary'] - Visual variant
 * @param {'sm' | 'md' | 'lg'} [props.size='md'] - Sizing variant
 * @param {boolean} [props.disabled=false] - Whether the button is disabled
 * @param {function} [props.onClick] - Click handler
 * @param {string} [props.href] - If provided, renders a Next.js Link styled as a button
 * @param {string} [props.className] - Extra classes, merged after the variant classes
 */
export default function Button({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  onClick,
  href,
  className = "",
  ...props
}) {
  // Rectangular with a small radius, not a pill. Pills read friendly-app; this
  // site is trying to read like a place with a front desk.
  const baseClasses =
    "inline-flex justify-center items-center gap-2 rounded-sm font-medium tracking-tight " +
    "transition-[background-color,border-color,color,box-shadow,transform] duration-200 " +
    "active:translate-y-px disabled:opacity-45 disabled:cursor-not-allowed disabled:active:translate-y-0";

  const variants = {
    // The warm fill takes dark ink, never white: white on #c9764a measures
    // 3.4:1 and fails AA. Dark-on-warm is 5.33:1 — and looks better besides.
    primary: "bg-accent text-on-accent hover:bg-accent-hover hover:shadow-glow",
    // Cool fill for the secondary path: present, but visibly not the main move.
    secondary:
      "bg-ridge-800 text-quartz-100 hover:bg-ridge-700 dark:bg-ridge-700 dark:hover:bg-ridge-600",
    outline:
      "border border-line-strong text-ink hover:border-accent hover:text-accent-text",
    ghost: "text-ink-muted hover:text-ink hover:bg-surface-2",
    // Destructive gets the alert tone, never the accent. Painting "delete this"
    // the same colour as "book this" is how people click the wrong one.
    danger:
      "border border-alert/45 text-alert hover:bg-alert hover:text-quartz-100 hover:border-alert",
  };

  const sizes = {
    sm: "px-3.5 py-1.5 text-[13px]",
    md: "px-5 py-2.5 text-sm",
    lg: "px-7 py-3.5 text-[15px]",
  };

  const classes =
    `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`.trim();

  if (href && !disabled) {
    return (
      <Link href={href} className={classes} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button
      className={classes}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}
