const values = [
    {
        title: "Community first",
        desc: "Hosts are neighbours, not listings. Every booking keeps income within Laxman Jhula.",
    },
    {
        title: "Lightest footprint",
        desc: "Solar hot water, local sourcing, and zero single-use plastic across our stays.",
    },
    {
        title: "Honest pricing",
        desc: "Zero commission means the price you see is the price the host actually earns.",
    },
];

const stats = [
    { value: "0%", label: "Commission" },
    { value: "12+", label: "Local hosts" },
    { value: "4.7", label: "Avg. rating" },
];

export default function AboutPage() {
    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="text-center">
                <p className="text-sm font-medium uppercase tracking-wider text-clay">Our story</p>
                <h1 className="mt-2 font-display text-4xl md:text-6xl font-semibold text-ink dark:text-parchment">
                    Eco-tourism, done directly
                </h1>
                <p className="mt-6 text-lg text-ink-soft dark:text-parchment/70 leading-relaxed">
                    We are dedicated to community eco-tourism and beautiful homestays right in the heart of
                    Laxman Jhula, Rishikesh. EchoLodge connects travellers with local hosts directly — no
                    middlemen, no commission — so more of your stay supports the people and the valley you came to see.
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
                <h2 className="font-display text-2xl md:text-3xl font-semibold">Join us in embracing nature</h2>
                <p className="mt-3 text-parchment/80 max-w-xl mx-auto">
                    Whether you come for the river, the trails, or the quiet — there is a homestay here for you.
                </p>
            </div>
        </div>
    );
}
