"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "./ThemeContext";

const baseLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/rooms", label: "Rooms" },
  { href: "/reviews", label: "Reviews" },
];

function ThemeToggle({ theme, toggleTheme }) {
  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full bg-sand dark:bg-bark-soft text-forest dark:text-moss hover:bg-parchment dark:hover:bg-bark hover:ring-2 hover:ring-clay/40 transition-all focus:outline-none focus:ring-2 focus:ring-clay/50"
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
  );
}

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const authed = status === "authenticated";
  const isAdmin = session?.user?.role === "ADMIN";

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

  return (
    <nav className="sticky top-0 z-50 bg-cream/80 dark:bg-bark/80 backdrop-blur-md border-b border-sand dark:border-bark-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <Link
              href="/"
              onClick={() => setMenuOpen(false)}
              className="font-display text-2xl font-semibold tracking-tight text-forest dark:text-moss"
            >
              Echo<span className="text-clay">Lodge</span>
            </Link>
          </div>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? "text-forest dark:text-moss bg-sand/60 dark:bg-bark-soft"
                    : "text-ink-soft dark:text-parchment/70 hover:text-forest dark:hover:text-moss hover:bg-sand/60 dark:hover:bg-bark-soft"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <span className="ml-1">
              <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
            </span>
            {authed && (
              <button
                onClick={handleLogout}
                className="ml-1 px-3 py-2 rounded-full text-sm font-medium text-clay hover:bg-clay/10 transition-colors focus:outline-none focus:ring-2 focus:ring-clay/50"
              >
                Logout
              </button>
            )}
          </div>

          {/* Mobile: theme toggle + hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
            <button
              onClick={() => setMenuOpen((open) => !open)}
              className="p-2 rounded-full text-ink dark:text-parchment hover:bg-sand/60 dark:hover:bg-bark-soft transition-colors focus:outline-none focus:ring-2 focus:ring-forest/40"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu panel — stacked links with comfortable tap targets */}
      {menuOpen && (
        <div className="md:hidden border-t border-sand dark:border-bark-soft bg-cream/95 dark:bg-bark/95 backdrop-blur-md animate-fade-in">
          <div className="px-4 py-3 space-y-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`block px-4 py-3 rounded-2xl text-base font-medium transition-colors ${
                  isActive(link.href)
                    ? "text-forest dark:text-moss bg-sand/60 dark:bg-bark-soft"
                    : "text-ink-soft dark:text-parchment/80 hover:text-forest dark:hover:text-moss hover:bg-sand/60 dark:hover:bg-bark-soft"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {authed && (
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-3 rounded-2xl text-base font-medium text-clay hover:bg-clay/10 transition-colors"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
