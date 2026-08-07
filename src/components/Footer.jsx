import Link from "next/link";
import Logo from "./Logo";

const explore = [
  { href: "/rooms", label: "Rooms" },
  { href: "/reviews", label: "Reviews" },
  { href: "/about", label: "About" },
  { href: "/concierge", label: "Concierge" },
];

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto border-t border-line bg-surface-2">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          <div className="col-span-2 md:col-span-2">
            <Logo
              className="text-ink"
              markClassName="h-5 w-[26px]"
              wordClassName="text-lg"
            />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-muted">
              Twelve rooms on the river in Laxman Jhula. Family-run, booked
              direct, no commission in the middle.
            </p>
          </div>

          <div>
            <h4 className="eyebrow text-ink-faint">Explore</h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              {explore.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="link-underline text-ink-muted transition-colors hover:text-ink"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="eyebrow text-ink-faint">Visit</h4>
            <address className="mt-4 text-sm leading-relaxed text-ink-muted not-italic">
              Laxman Jhula
              <br />
              Rishikesh, Uttarakhand
              <br />
              India
            </address>
          </div>
        </div>

        {/* The dawn line — the palette's own idea, used as the divider. */}
        <hr className="rule-dawn mt-12" />

        <div className="mt-6 flex flex-col gap-2 text-xs text-ink-faint sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {year} EchoLodge</p>
          <p>Rates in INR · Settled at the property</p>
        </div>
      </div>
    </footer>
  );
}
