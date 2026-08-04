"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin/rooms", label: "Rooms" },
  { href: "/admin/reviews", label: "Reviews" },
];

// Section switcher shown at the top of every admin page. The active tab is
// marked with a warm underline rather than a filled chip — admin screens are
// dense, and a rule reads as position without adding another block of colour.
export default function AdminTabs() {
  const pathname = usePathname();
  return (
    <div className="mb-8 flex gap-6 border-b border-line">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`-mb-px border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
              active
                ? "border-accent text-ink"
                : "border-transparent text-ink-muted hover:border-line-strong hover:text-ink"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
