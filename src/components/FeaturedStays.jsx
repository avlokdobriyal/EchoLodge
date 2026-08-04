"use client";
import { useState, useEffect } from "react";
import Card from "./Card";
import RoomLedger from "./RoomLedger";
import { Stagger, StaggerItem } from "./motion/index.jsx";
import { API_BASE } from "@/lib/api";
import { metaFor } from "@/lib/categories";

const API = `${API_BASE}/api/rooms`;

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
    <div className="overflow-hidden rounded-md border border-line bg-surface">
      <div className="skeleton aspect-[4/3] w-full" />
      <div className="space-y-3 p-5">
        <div className="skeleton h-4 w-2/3 rounded-xs" />
        <div className="skeleton h-3 w-full rounded-xs" />
        <div className="skeleton h-3 w-4/5 rounded-xs" />
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
      <p className="mt-10 rounded-md border border-line bg-surface-2/60 px-5 py-4 text-[15px] text-ink-muted">
        The live room list is taking a moment to wake up. You can see everything
        on the{" "}
        <a
          href="/rooms"
          className="text-accent-text underline underline-offset-2"
        >
          rooms page
        </a>
        .
      </p>
    );
  }

  if (!groups) {
    return (
      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <Stagger className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {groups.map((group, index) => {
        const meta = metaFor(group.category);
        return (
          <StaggerItem key={group.category} className="flex flex-col">
            <Card
              title={group.category}
              desc={group.description}
              image={meta.image}
              priority={index === 0}
              tag={meta.tag ?? `${group.count} rooms`}
            />
            <div className="mt-3 flex items-end justify-between gap-4">
              <p className="text-sm text-ink-muted">
                From{" "}
                <span className="num font-semibold text-ink">
                  {formatINR(group.pricePerNight)}
                </span>
                <span className="text-ink-faint"> / night</span>
              </p>
              {/* The ledger, counting only. It fills in with real availability
                  on the rooms page once there are dates to check against. */}
              <div className="flex items-center gap-2">
                <RoomLedger total={group.count} size="sm" />
                <span className="num text-xs text-ink-faint">
                  {group.count} room{group.count > 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </StaggerItem>
        );
      })}
    </Stagger>
  );
}
