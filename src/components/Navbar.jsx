"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "./ThemeContext";

const baseLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/rooms", label: "Rooms" },
  { href: "/dashboard", label: "Dashboard" },
];

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { data: session, status } = useSession();
  const authed = status === "authenticated";
  const isAdmin = session?.user?.role === "ADMIN";

  const links = authed
    ? [
        ...baseLinks,
        ...(isAdmin ? [{ href: "/admin/rooms", label: "Admin" }] : []),
        { href: "/profile", label: "Profile" },
      ]
    : [...baseLinks, { href: "/login", label: "Login" }];

  return (
    <nav className="sticky top-0 z-50 bg-cream/80 dark:bg-bark/80 backdrop-blur-md border-b border-sand dark:border-bark-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <Link
              href="/"
              className="font-display text-2xl font-semibold tracking-tight text-forest dark:text-moss"
            >
              Echo<span className="text-clay">Lodge</span>
            </Link>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 rounded-full text-sm font-medium text-ink-soft dark:text-parchment/70 hover:text-forest dark:hover:text-moss hover:bg-sand/60 dark:hover:bg-bark-soft transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <button
              onClick={toggleTheme}
              className="ml-1 p-2 rounded-full bg-sand dark:bg-bark-soft text-forest dark:text-moss hover:bg-parchment dark:hover:bg-bark hover:ring-2 hover:ring-clay/40 transition-all focus:outline-none focus:ring-2 focus:ring-clay/50"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                // Sun icon
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                // Moon icon
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            {authed && (
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="ml-1 px-3 py-2 rounded-full text-sm font-medium text-clay hover:bg-clay/10 transition-colors focus:outline-none focus:ring-2 focus:ring-clay/50"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
