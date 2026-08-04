import RoomLedger from "@/components/RoomLedger";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/index.jsx";
import { Button } from "@/components/ui/index.js";

const values = [
  {
    label: "The valley",
    title: "Community first",
    desc: "We hire from Laxman Jhula and buy from the market down the road. The lodge belongs to this valley.",
  },
  {
    label: "The footprint",
    title: "Lightest touch",
    desc: "Solar hot water, local sourcing, and zero single-use plastic anywhere on the property.",
  },
  {
    label: "The rate",
    title: "Honest pricing",
    desc: "Booking direct means no travel-site commission — the price you see is the price we set.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <Reveal className="max-w-2xl">
        <p className="eyebrow text-ink-faint">Our story</p>
        <h1 className="display mt-4 text-ink">
          One lodge, booked directly.
        </h1>
        <p className="mt-6 text-[17px] leading-relaxed text-ink-muted">
          EchoLodge is a twelve-room lodge in the heart of Laxman Jhula,
          Rishikesh, a few minutes’ walk from the Ganga. For years most of our
          guests reached us through travel sites that took a sizeable cut of
          every night booked. So we built our own booking site. Reserve here and
          that cut simply doesn’t exist — which is how we keep the rates fair
          and the terrace chai free.
        </p>
      </Reveal>

      {/* Twelve marks for twelve rooms. The same device the booking page uses
          to show availability, here just counting — which is the honest way to
          say "we are small" without asking anyone to take our word for it. */}
      <Reveal delay={0.1} className="mt-16 border-y border-line py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow text-ink-faint">The whole property</p>
            <p className="mt-3 text-[15px] text-ink-muted">
              Twelve rooms across three categories. That’s all of it — every
              room we have is on the booking page.
            </p>
          </div>
          <RoomLedger total={12} className="shrink-0" />
        </div>
      </Reveal>

      <Stagger className="mt-16 grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-12">
        {values.map((v) => (
          <StaggerItem key={v.title} className="group">
            <div className="h-px w-full bg-line-strong transition-colors duration-500 group-hover:bg-accent" />
            <p className="eyebrow mt-5 text-ink-faint">{v.label}</p>
            <h3 className="mt-3 text-xl font-semibold tracking-tight text-ink">
              {v.title}
            </h3>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">
              {v.desc}
            </p>
          </StaggerItem>
        ))}
      </Stagger>

      <Reveal className="mt-20 rounded-md bg-ridge-900 p-8 sm:p-12">
        <h2 className="heading max-w-md text-quartz-100">
          Come stay by the river.
        </h2>
        <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-ridge-200">
          Whether you come for the river, the trails, or the quiet — there is a
          room here for you.
        </p>
        <div className="mt-8">
          <Button href="/rooms" size="lg">
            See availability
          </Button>
        </div>
      </Reveal>
    </div>
  );
}
