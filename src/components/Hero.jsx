import Photo from "./ui/Photo";
import { Button } from "./ui/index.js";

export default function Hero() {
  return (
    // -mt-16 pulls the section up under the fixed navbar so the photograph runs
    // to the very top of the window; pt-16 puts the content back below it.
    // 100svh rather than 100vh — vh jumps around as mobile browser chrome
    // hides, which makes the whole hero lurch mid-scroll.
    <section className="relative -mt-16 flex min-h-[100svh] items-end overflow-hidden">
      <div className="absolute inset-0">
        {/* Slow drift. 28s and only a few percent of travel, so it reads as air
            moving rather than as an animation playing. */}
        <Photo
          src="/rooms/hero.jpg"
          alt=""
          aria-hidden="true"
          priority
          sizes="100vw"
          className="animate-hero-drift object-cover"
        />
        {/* Two scrims doing separate jobs: the top one buys contrast for the
            navbar, the bottom one carries the heading. A single flat overlay
            would have to be dark enough for both and would kill the picture. */}
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-ridge-950/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-ridge-950/90 via-ridge-950/45 to-transparent" />
      </div>

      <div className="animate-fade-in-up relative w-full px-6 pt-24 pb-16 sm:px-8 sm:pb-20 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <p className="eyebrow text-quartz-100/70">
            Laxman Jhula · Rishikesh
          </p>

          {/* No serif in this system, so the heading has to earn its presence
              through scale and tight tracking instead. */}
          <h1 className="display-xl mt-5 max-w-4xl text-quartz-100">
            Twelve rooms
            <br />
            above the Ganga.
          </h1>

          <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-quartz-100/80">
            A small family-run lodge, ten minutes’ walk from the bridge. Book
            with us directly and the price you see is the price we set — no
            travel-site commission in the middle.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button href="/rooms" size="lg">
              See the rooms
            </Button>
            <Button
              href="/about"
              size="lg"
              variant="outline"
              className="border-quartz-100/35 text-quartz-100 hover:border-quartz-100 hover:text-quartz-100"
            >
              Our story
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
