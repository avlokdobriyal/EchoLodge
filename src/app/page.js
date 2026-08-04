import Hero from "../components/Hero";
import FeaturedStays from "../components/FeaturedStays";
import { Reveal, Stagger, StaggerItem } from "../components/motion/index.jsx";
import { Button } from "../components/ui/index.js";

// Three reasons to book here rather than through a travel site. Not a sequence,
// so they aren't numbered — each is topped with a hairline instead, which
// separates them without implying an order that doesn't exist.
const reasons = [
  {
    label: "The rate",
    title: "Booked direct",
    desc: "No travel-site commission skimmed off the top. You pay us, we set the rate, and nobody in between takes a cut of your stay.",
  },
  {
    label: "The place",
    title: "On the river",
    desc: "Ten minutes on foot from Laxman Jhula bridge. Close enough to walk to dinner, far enough that you can hear the water at night.",
  },
  {
    label: "The people",
    title: "Run by the family",
    desc: "The same people at the desk, on the terrace, and pouring the morning chai. Twelve rooms is small enough to keep it that way.",
  },
];

export default function Home() {
  return (
    <div>
      <Hero />

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <Reveal>
          <p className="eyebrow text-ink-faint">Three ways to stay</p>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="heading max-w-xl text-ink">
              Every room, straight from the live inventory.
            </h2>
            <p className="max-w-sm text-[15px] leading-relaxed text-ink-muted">
              Real rooms, real rates, bookable right now — nothing here is a
              sample.
            </p>
          </div>
        </Reveal>

        <FeaturedStays />
      </section>

      {/* The valley still in shadow. A deep cool band here is the palette's
          whole idea stated once at full size, and it gives the page a rhythm —
          bright photograph, warm stone, cold shadow, warm stone again — that
          three tinted-beige sections in a row never would. */}
      <section className="bg-ridge-900">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
          <Stagger className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-12">
            {reasons.map((r) => (
              <StaggerItem key={r.title} className="group">
                {/* Hairline warms on hover — the dawn line at column scale. */}
                <div className="h-px w-full bg-ridge-700 transition-colors duration-500 group-hover:bg-accent" />
                <p className="eyebrow mt-5 text-ridge-300">{r.label}</p>
                <h3 className="mt-3 text-xl font-semibold tracking-tight text-quartz-100">
                  {r.title}
                </h3>
                <p className="mt-3 text-[15px] leading-relaxed text-ridge-200">
                  {r.desc}
                </p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <Reveal className="flex flex-col items-start gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="heading max-w-lg text-ink">
              Check the dates you want.
            </h2>
            <p className="mt-3 max-w-md text-[15px] leading-relaxed text-ink-muted">
              Availability is shown before you commit to anything — pick your
              nights and see exactly what’s free.
            </p>
          </div>
          <Button href="/rooms" size="lg">
            See availability
          </Button>
        </Reveal>
      </section>
    </div>
  );
}
