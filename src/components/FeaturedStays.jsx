"use client";
import { useState, useEffect } from "react";
import Card from "./Card";

const API = "http://localhost:5000/api/rooms";

const CATEGORY_TAGS = {
  "Ganga View Balcony": "River view",
  "Standard Balcony": "Best value",
  "Super Deluxe Ganga View Suite": "Signature",
};

// Hoisted: built once per module rather than once per call.
const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});
const formatINR = (value) => INR.format(value);

// One card per room category, straight from the live inventory.
function groupByCategory(rooms) {
  const groups = new Map();
  for (const room of rooms) {
    if (!groups.has(room.category)) {
      groups.set(room.category, {
        category: room.category,
        description: room.description,
        pricePerNight: room.pricePerNight,
        count: 0,
      });
    }
    groups.get(room.category).count += 1;
  }
  return [...groups.values()].sort((a, b) => a.pricePerNight - b.pricePerNight);
}

function SkeletonCard() {
  return (
    <div className="rounded-3xl bg-surface dark:bg-bark-soft border border-sand dark:border-bark-soft p-6 animate-pulse">
      <div className="h-5 w-2/3 rounded-full bg-sand dark:bg-bark" />
      <div className="mt-4 space-y-2">
        <div className="h-3 w-full rounded-full bg-sand dark:bg-bark" />
        <div className="h-3 w-5/6 rounded-full bg-sand dark:bg-bark" />
        <div className="h-3 w-1/2 rounded-full bg-sand dark:bg-bark" />
      </div>
    </div>
  );
}

export default function FeaturedStays() {
  const [groups, setGroups] = useState(null); // null = loading
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(API);
        if (!res.ok) throw new Error();
        const rooms = await res.json();
        if (!cancelled) setGroups(groupByCategory(rooms));
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (failed) {
    return (
      <p className="mt-10 text-ink-soft dark:text-parchment/60">
        Our live room inventory is taking a moment — see everything on the{" "}
        <a href="/rooms" className="text-forest dark:text-moss underline underline-offset-2">
          rooms page
        </a>
        .
      </p>
    );
  }

  if (!groups) {
    return (
      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8">
      {groups.map((group, index) => (
        <div key={group.category} className={`animate-fade-in-up ${index < 3 ? `delay-${(index + 1) * 100}` : ""}`}>
          <Card
            title={group.category}
            desc={group.description}
            tag={CATEGORY_TAGS[group.category] ?? `${group.count} rooms`}
          />
          <p className="mt-3 px-2 text-sm text-ink-soft dark:text-parchment/60">
            From{" "}
            <span className="font-semibold text-ink dark:text-parchment">
              {formatINR(group.pricePerNight)}
            </span>
            /night · {group.count} room{group.count > 1 ? "s" : ""}
          </p>
        </div>
      ))}
    </div>
  );
}
