import { Button } from "./ui/index.js";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-sand via-cream to-cream dark:from-bark-soft dark:via-bark dark:to-bark">
      {/* soft organic glow accents */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-moss/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-clay/15 blur-3xl" />

      <div className="relative max-w-4xl mx-auto px-4 py-24 sm:py-28 text-center animate-fade-in-up">
        <span className="inline-flex items-center gap-2 rounded-full border border-forest/20 dark:border-moss/30 bg-forest/5 dark:bg-moss/10 px-4 py-1.5 text-sm font-medium text-forest dark:text-moss">
          <span className="h-1.5 w-1.5 rounded-full bg-clay" />
          Zero commission · Direct bookings
        </span>

        <h1 className="mt-6 font-display text-5xl md:text-7xl font-semibold leading-[1.05] text-ink dark:text-parchment">
          Stay where the
          <span className="block text-forest dark:text-moss italic">river breathes</span>
        </h1>

        <p className="mt-6 text-lg md:text-xl text-ink-soft dark:text-parchment/70 max-w-2xl mx-auto leading-relaxed">
          Boutique eco-homestays in the heart of Laxman Jhula, Rishikesh. Book
          direct with the hosts — better margins for them, warmer stays for you.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button href="/rooms" size="lg">Find your lodge</Button>
          <Button href="/about" size="lg" variant="outline">Our story</Button>
        </div>
      </div>
    </section>
  );
}
