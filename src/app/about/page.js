const values = [
    {
        title: "Community first",
        desc: "We hire from Laxman Jhula and buy from the market down the road. The lodge belongs to this valley.",
    },
    {
        title: "Lightest footprint",
        desc: "Solar hot water, local sourcing, and zero single-use plastic anywhere on the property.",
    },
    {
        title: "Honest pricing",
        desc: "Booking direct means no travel-site commission — the price you see is the price we set.",
    },
];

// Figures describe this one property. Room counts come from the same inventory
// the booking page reads, so they stay true if the catalogue changes.
const stats = [
    { value: "12", label: "Rooms" },
    { value: "3", label: "Room types" },
    { value: "0%", label: "Commission" },
];

export default function AboutPage() {
    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="text-center">
                <p className="text-sm font-medium uppercase tracking-wider text-clay">Our story</p>
                <h1 className="mt-2 font-display text-4xl md:text-6xl font-semibold text-ink dark:text-parchment">
                    One lodge, booked directly
                </h1>
                <p className="mt-6 text-lg text-ink-soft dark:text-parchment/70 leading-relaxed">
                    EchoLodge is a twelve-room lodge in the heart of Laxman Jhula, Rishikesh, a few
                    minutes&rsquo; walk from the Ganga. For years most of our guests reached us through
                    travel sites that took a sizeable cut of every night booked. So we built our own
                    booking site. Reserve here and that cut simply doesn&rsquo;t exist — which is how we
                    keep the rates fair and the terrace chai free.
                </p>
            </div>

            <div className="mt-14 grid grid-cols-3 gap-4">
                {stats.map((s) => (
                    <div key={s.label} className="rounded-3xl bg-sand/60 dark:bg-bark-soft border border-sand dark:border-bark-soft py-8 text-center">
                        <div className="font-display text-3xl md:text-4xl font-semibold text-forest dark:text-moss">{s.value}</div>
                        <div className="mt-1 text-sm text-ink-soft dark:text-parchment/60">{s.label}</div>
                    </div>
                ))}
            </div>

            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
                {values.map((v) => (
                    <div key={v.title}>
                        <h3 className="font-display text-xl font-semibold text-ink dark:text-parchment">{v.title}</h3>
                        <p className="mt-2 text-ink-soft dark:text-parchment/70 leading-relaxed">{v.desc}</p>
                    </div>
                ))}
            </div>

            <div className="mt-16 rounded-3xl bg-forest text-parchment p-10 text-center">
                <h2 className="font-display text-2xl md:text-3xl font-semibold">Come stay by the river</h2>
                <p className="mt-3 text-parchment/80 max-w-xl mx-auto">
                    Whether you come for the river, the trails, or the quiet — there is a room here for you.
                </p>
            </div>
        </div>
    );
}
