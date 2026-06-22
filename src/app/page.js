import Hero from "../components/Hero";
import Card from "../components/Card";

export default function Home() {
  return (
    <div>
      <Hero />
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card 
            title="Ganges View Room" 
            desc="Wake up to the serene sounds of the holy Ganges. A perfect blend of comfort and tranquility." 
            tag="Popular" 
          />
          <Card 
            title="Forest Retreat" 
            desc="Immerse yourself in nature with this secluded, minimalist stay surrounded by lush greenery." 
            tag="Eco-Friendly" 
          />
        </div>
      </section>
    </div>
  );
}
