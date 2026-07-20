"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin/rooms", label: "Rooms" },
  { href: "/admin/reviews", label: "Reviews" },
];

// Section switcher shown at the top of every admin page.
export default function AdminTabs() {
  const pathname = usePathname();
  return (
    <div className="inline-flex gap-1 p-1 rounded-full bg-sand/60 dark:bg-bark mb-8">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              active
                ? "bg-surface dark:bg-bark-soft text-forest dark:text-moss shadow-sm"
                : "text-ink-soft dark:text-parchment/60 hover:text-forest dark:hover:text-moss"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
