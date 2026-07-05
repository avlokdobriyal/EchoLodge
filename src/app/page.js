import Hero from "../components/Hero";
import Card from "../components/Card";

const features = [
  {
    title: "Zero commission",
    desc: "Every rupee goes to the host and the community — never a booking platform.",
    icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V6m0 12v-2",
  },
  {
    title: "Rooted in nature",
    desc: "Stays chosen for their footprint, from riverside rooms to forest retreats.",
    icon: "M12 3v18m0 0c-3.5 0-6-2.5-6-6 3.5 0 6 2.5 6 6zm0-6c0-3.5 2.5-6 6-6 0 3.5-2.5 6-6 6z",
  },
  {
    title: "Hosted by locals",
    desc: "Real people from Laxman Jhula who know the river, the trails, and the chai.",
    icon: "M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4 0M12 4a4 4 0 100 8 4 4 0 000-8z",
  },
];

export default function Home() {
  return (
    <div>
      <Hero />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-ink dark:text-parchment">
            Featured stays
          </h2>
          <p className="mt-3 text-ink-soft dark:text-parchment/70">
            A handpicked pair to start with — more from the community coming soon.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card
            title="Ganges View Room"
            desc="Wake up to the serene sounds of the holy Ganges. A perfect blend of comfort and tranquility."
            tag="Popular"
            rating={4.8}
          />
          <Card
            title="Forest Retreat"
            desc="Immerse yourself in nature with this secluded, minimalist stay surrounded by lush greenery."
            tag="Eco-Friendly"
            rating={4.6}
          />
        </div>
      </section>

      <section className="border-t border-sand dark:border-bark-soft bg-sand/40 dark:bg-bark-soft/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {features.map((f) => (
              <div key={f.title}>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-forest/10 dark:bg-moss/15 text-forest dark:text-moss">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={f.icon} />
                  </svg>
                </div>
                <h3 className="mt-5 font-display text-xl font-semibold text-ink dark:text-parchment">{f.title}</h3>
                <p className="mt-2 text-ink-soft dark:text-parchment/70 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
