import Image from "next/image";
import { Button } from "./ui/index.js";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Photographic backdrop. The overlay carries the text contrast, so the
          heading stays legible in both themes without needing a second image. */}
      <div className="absolute inset-0">
        <Image
          src="/rooms/hero.jpg"
          alt=""
          aria-hidden="true"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-bark/75 via-bark/65 to-bark/85 dark:from-bark/85 dark:via-bark/80 dark:to-bark/90" />
      </div>

      {/* soft organic glow accents */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-moss/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-clay/15 blur-3xl" />

      <div className="relative max-w-4xl mx-auto px-4 py-24 sm:py-32 text-center animate-fade-in-up">
        <span className="inline-flex items-center gap-2 rounded-full border border-parchment/25 bg-parchment/10 px-4 py-1.5 text-sm font-medium text-parchment backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-clay" />
          Book direct · No booking-site commission
        </span>

        <h1 className="mt-6 font-display text-5xl md:text-7xl font-semibold leading-[1.05] text-parchment drop-shadow-sm">
          Stay where the
          <span className="block text-moss italic">river breathes</span>
        </h1>

        <p className="mt-6 text-lg md:text-xl text-parchment/85 max-w-2xl mx-auto leading-relaxed">
          EchoLodge is a small riverside lodge in Laxman Jhula, Rishikesh — twelve
          rooms, one terrace, and the Ganga a short walk away. Book with us
          directly and the price you see is the price we set.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button href="/rooms" size="lg">See our rooms</Button>
          <Button href="/about" size="lg" variant="outline">Our story</Button>
        </div>
      </div>
    </section>
  );
}
