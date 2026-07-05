import Link from "next/link";

/**
 * @param {Object} props
 * @param {React.ReactNode} props.children - The content of the button
 * @param {'primary' | 'secondary' | 'outline' | 'danger'} [props.variant='primary'] - Visual variant
 * @param {'sm' | 'md' | 'lg'} [props.size='md'] - Sizing variant
 * @param {boolean} [props.disabled=false] - Whether the button is disabled
 * @param {function} [props.onClick] - Click handler
 * @param {string} [props.href] - If provided, renders a Next.js Link styled as a button
 * @param {string} [props.className] - Extra classes, merged after the variant classes
 */
export default function Button({ children, variant = "primary", size = "md", disabled = false, onClick, href, className = "", ...props }) {
    const baseClasses = "inline-flex justify-center items-center font-medium rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-cream dark:focus:ring-offset-bark disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-clay hover:bg-clay-dark text-white focus:ring-clay",
        secondary: "bg-forest hover:bg-forest-light text-parchment focus:ring-forest",
        outline: "border border-forest/30 dark:border-moss/40 text-forest dark:text-moss hover:bg-forest/5 dark:hover:bg-moss/10 focus:ring-forest",
        danger: "border border-clay/40 text-clay hover:bg-clay hover:text-white focus:ring-clay",
    };

    const sizes = {
        sm: "px-4 py-1.5 text-sm",
        md: "px-5 py-2 text-sm",
        lg: "px-7 py-3 text-base",
    };

    const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`.trim();

    if (href && !disabled) {
        return (
            <Link href={href} className={classes} {...props}>
                {children}
            </Link>
        );
    }

    return (
        <button className={classes} disabled={disabled} onClick={onClick} {...props}>
            {children}
        </button>
    );
}
