"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from "motion/react";
import { useTheme } from "./ThemeContext";
import Logo from "./Logo";

const baseLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/rooms", label: "Rooms" },
  { href: "/reviews", label: "Reviews" },
];

function ThemeToggle({ theme, toggleTheme, onDark }) {
  return (
    <button
      onClick={toggleTheme}
      className={`rounded-sm p-2 transition-colors ${
        onDark
          ? "text-quartz-100/80 hover:bg-quartz-100/10 hover:text-quartz-100"
          : "text-ink-muted hover:bg-surface-2 hover:text-ink"
      }`}
      aria-label={
        theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
      }
    >
      {theme === "dark" ? (
        // Sun icon
        <svg
          className="h-[18px] w-[18px]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ) : (
        // Moon icon
        <svg
          className="h-[18px] w-[18px]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      )}
    </button>
  );
}

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const authed = status === "authenticated";
  const isAdmin = session?.user?.role === "ADMIN";

  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 24));

  const links = authed
    ? [
        ...baseLinks,
        { href: "/concierge", label: "Concierge" },
        ...(isAdmin ? [{ href: "/admin/rooms", label: "Admin" }] : []),
        { href: "/profile", label: "Profile" },
      ]
    : [...baseLinks, { href: "/login", label: "Login" }];

  const isActive = (href) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const handleLogout = () => {
    setMenuOpen(false);
    signOut({ callbackUrl: "/login" });
  };

  // On the homepage the bar floats over the hero photograph, so it stays
  // transparent with light type until you scroll past it. Everywhere else the
  // page starts on canvas, where light type would be invisible.
  const onDark = pathname === "/" && !scrolled && !menuOpen;

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300 ${
        onDark
          ? "border-b border-transparent bg-transparent"
          : "border-b border-line bg-canvas/85 backdrop-blur-md"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* The lockup is one colour all the way through — the parent sets it
              and Logo inherits, so floating over the hero photograph is a
              single class change rather than four. */}
          <Link
            href="/"
            onClick={() => setMenuOpen(false)}
            aria-label="EchoLodge — home"
            className={`flex flex-shrink-0 transition-colors ${
              onDark ? "text-quartz-100" : "text-ink"
            }`}
          >
            <Logo />
          </Link>

          {/* Desktop links */}
          <div className="hidden items-center gap-1 md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={`relative px-3 py-2 text-sm font-medium transition-colors ${
                  onDark
                    ? isActive(link.href)
                      ? "text-quartz-100"
                      : "text-quartz-100/70 hover:text-quartz-100"
                    : isActive(link.href)
                      ? "text-ink"
                      : "text-ink-muted hover:text-ink"
                }`}
              >
                {link.label}
                {isActive(link.href) && (
                  // Shared layout id: the marker slides between links on
                  // navigation instead of blinking out and back in.
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-x-3 -bottom-px h-0.5 rounded-xs bg-accent"
                    transition={{
                      type: "spring",
                      stiffness: 380,
                      damping: 32,
                    }}
                  />
                )}
              </Link>
            ))}
            <span className="ml-1">
              <ThemeToggle
                theme={theme}
                toggleTheme={toggleTheme}
                onDark={onDark}
              />
            </span>
            {authed && (
              <button
                onClick={handleLogout}
                className={`ml-1 rounded-sm px-3 py-2 text-sm font-medium transition-colors ${
                  onDark
                    ? "text-quartz-100/70 hover:text-quartz-100"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                Log out
              </button>
            )}
          </div>

          {/* Mobile: theme toggle + hamburger */}
          <div className="flex items-center gap-1 md:hidden">
            <ThemeToggle
              theme={theme}
              toggleTheme={toggleTheme}
              onDark={onDark}
            />
            <button
              onClick={() => setMenuOpen((open) => !open)}
              className={`rounded-sm p-2 transition-colors ${
                onDark
                  ? "text-quartz-100 hover:bg-quartz-100/10"
                  : "text-ink hover:bg-surface-2"
              }`}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
            >
              {/* Two rules that cross into an X — cheaper to read than swapping
                  between two different icons. */}
              <span className="relative block h-4 w-5">
                <motion.span
                  className="absolute left-0 block h-px w-5 bg-current"
                  animate={
                    menuOpen
                      ? { top: 7, rotate: 45 }
                      : { top: 3, rotate: 0 }
                  }
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                />
                <motion.span
                  className="absolute left-0 block h-px w-5 bg-current"
                  animate={
                    menuOpen
                      ? { top: 7, rotate: -45 }
                      : { top: 11, rotate: 0 }
                  }
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                />
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu panel — stacked links with comfortable tap targets */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="overflow-hidden border-t border-line bg-canvas md:hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="space-y-0.5 px-4 py-3">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  className={`flex items-center justify-between rounded-sm px-3 py-3 text-[15px] font-medium transition-colors ${
                    isActive(link.href)
                      ? "bg-surface-2 text-ink"
                      : "text-ink-muted hover:bg-surface-2 hover:text-ink"
                  }`}
                >
                  {link.label}
                  {isActive(link.href) && (
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  )}
                </Link>
              ))}
              {authed && (
                <button
                  onClick={handleLogout}
                  className="block w-full rounded-sm px-3 py-3 text-left text-[15px] font-medium text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
                >
                  Log out
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
