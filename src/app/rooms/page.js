"use client";
import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button, Input, Modal, Loader, notify } from "@/components/ui/index.js";
import EmptyState from "@/components/EmptyState";
import { API_BASE } from "@/lib/api";
import { CATEGORY_META, metaFor } from "@/lib/categories";
import { useSlowLoad } from "@/lib/useSlowLoad";

const API = `${API_BASE}/api`;

// Hoisted: Intl.NumberFormat construction is expensive relative to .format(),
// so build it once per module rather than once per call.
const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});
const formatINR = (value) => INR.format(value);

// ISO yyyy-mm-dd for today, used as the min for the date inputs.
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function nightsBetween(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;
  const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  if (Number.isNaN(ms) || ms <= 0) return 0;
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

// Collapse the flat rooms list into one entry per category, keeping the live
// inventory count so the booking UI can cap the quantity selector.
function groupByCategory(rooms) {
  const groups = new Map();
  for (const room of rooms) {
    if (!groups.has(room.category)) {
      groups.set(room.category, {
        category: room.category,
        pricePerNight: room.pricePerNight,
        description: room.description,
        inventory: 0,
      });
    }
    groups.get(room.category).inventory += 1;
  }
  return [...groups.values()].sort(
    (a, b) => (CATEGORY_META[a.category]?.order ?? 99) - (CATEGORY_META[b.category]?.order ?? 99)
  );
}

// Quantity stepper strictly clamped to [1, max] — max is the category's
// live inventory (5 / 5 / 2), so overbooking can't even be requested.
function QuantityStepper({ value, max, subtitle, onChange }) {
  const decrement = () => onChange(Math.max(1, value - 1));
  const increment = () => onChange(Math.min(max, value + 1));
  const stepBtn =
    "flex h-9 w-9 items-center justify-center rounded-full border border-sand dark:border-bark-soft text-lg font-medium text-ink dark:text-parchment transition-all hover:border-forest hover:text-forest dark:hover:border-moss dark:hover:text-moss disabled:opacity-30 disabled:hover:border-sand dark:disabled:hover:border-bark-soft disabled:hover:text-ink dark:disabled:hover:text-parchment";

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-ink dark:text-parchment">Rooms</p>
        <p className="text-xs text-ink-soft dark:text-parchment/50">{subtitle}</p>
      </div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={decrement} disabled={value <= 1} aria-label="Fewer rooms" className={stepBtn}>
          −
        </button>
        <span className="w-6 text-center font-display text-lg font-semibold text-ink dark:text-parchment">
          {value}
        </span>
        <button type="button" onClick={increment} disabled={value >= max} aria-label="More rooms" className={stepBtn}>
          +
        </button>
      </div>
    </div>
  );
}

function CategoryTile({ group, index, onOpen }) {
  const meta = metaFor(group.category);

  return (
    <button
      type="button"
      onClick={() => onOpen(group)}
      className={`card-lift animate-fade-in-up delay-${(index + 1) * 100} group flex flex-col text-left rounded-3xl bg-surface dark:bg-bark-soft border border-sand dark:border-bark-soft shadow-sm overflow-hidden focus:outline-none focus:ring-2 focus:ring-forest/40`}
    >
      {/* Banner — the room photo, with the gradient as a fallback for any
          category added later that has no image yet. */}
      <div className={`relative h-48 overflow-hidden bg-gradient-to-br ${meta.accent}`}>
        {meta.image && (
          <Image
            src={meta.image}
            alt={`${meta.label} at EchoLodge`}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            priority={index === 0}
          />
        )}
        {/* Scrim keeps the price chip legible over any photo. */}
        <div className="absolute inset-0 bg-gradient-to-t from-bark/70 via-bark/10 to-transparent" />
        <span className="absolute bottom-3 left-4 rounded-full bg-cream/90 dark:bg-bark/90 px-3 py-1 text-xs font-semibold text-ink dark:text-parchment shadow-sm">
          {group.inventory} room{group.inventory > 1 ? "s" : ""} · {formatINR(group.pricePerNight)}/night
        </span>
      </div>

      <div className="flex flex-col flex-grow p-6">
        <span className={`self-start px-3 py-1 rounded-full text-xs font-medium ${meta.chip}`}>
          {group.category}
        </span>
        <h3 className="mt-4 font-display text-2xl font-semibold text-ink dark:text-parchment">
          {meta.shortLabel}
        </h3>
        <p className="mt-2 text-sm text-ink-soft dark:text-parchment/70 flex-grow leading-relaxed">
          {meta.tagline}
        </p>
        <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-forest dark:text-moss transition-transform duration-300 group-hover:translate-x-1">
          View &amp; book
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5-5 5M6 12h12" />
          </svg>
        </span>
      </div>
    </button>
  );
}

function CategoryBookingModal({ group, isOpen, onClose, session, router }) {
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  // The server's answer, tagged with the exact range it was fetched for:
  // { key, data } | null. Tagging lets "is this answer still current?" and
  // "are we still waiting?" both be derived at render time instead of tracked
  // with extra state that effects have to keep in sync.
  const [availability, setAvailability] = useState(null);

  const category = group?.category;
  // A valid range is the precondition for asking about availability at all.
  const rangeIsValid = Boolean(
    category && checkIn && checkOut && new Date(checkOut) > new Date(checkIn)
  );
  const rangeKey = rangeIsValid ? `${category}|${checkIn}|${checkOut}` : null;

  // Ask the server how many rooms are actually free as soon as we have a valid
  // range, so the guest sees availability before filling anything else in
  // rather than being rejected with a 409 after pressing Confirm.
  useEffect(() => {
    if (!rangeKey) return;

    let cancelled = false;
    const params = new URLSearchParams({ category, checkIn, checkOut });

    (async () => {
      try {
        const res = await fetch(`${API}/rooms/availability?${params}`);
        if (!res.ok) throw new Error("lookup failed");
        const data = await res.json();
        if (!cancelled) setAvailability({ key: rangeKey, data });
      } catch {
        // Non-fatal: record the attempt so we stop showing a spinner, and let
        // the server have the final word when the guest submits.
        if (!cancelled) setAvailability({ key: rangeKey, data: null });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [rangeKey, category, checkIn, checkOut]);

  if (!group) return null;

  // An answer only counts when it belongs to the range currently on screen.
  const liveAvailability = availability?.key === rangeKey ? availability.data : null;
  const isChecking = rangeIsValid && availability?.key !== rangeKey;

  // Derived rather than stored, so the stepper can never sit above what's free.
  const maxSelectable = Math.max(1, liveAvailability?.available ?? group.inventory);
  const effectiveQuantity = Math.min(Math.max(1, quantity), maxSelectable);

  const meta = metaFor(group.category);
  const nights = nightsBetween(checkIn, checkOut);
  const total = nights * group.pricePerNight * effectiveQuantity;
  const soldOut = liveAvailability?.available === 0;

  const validate = () => {
    const next = {};
    if (!checkIn) next.checkIn = "Select a check-in date";
    if (!checkOut) next.checkOut = "Select a check-out date";
    if (checkIn && checkOut && new Date(checkOut) <= new Date(checkIn)) {
      next.checkOut = "Check-out must be after check-in";
    }
    return next;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Booking requires a signed-in user (and a backend token).
    if (!session?.backendToken) {
      notify("Please sign in to book a room", "error");
      router.push("/login");
      return;
    }

    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${API}/bookings/category`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.backendToken}`,
        },
        body: JSON.stringify({ category: group.category, quantity: effectiveQuantity, checkIn, checkOut }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        notify("Your session has expired — please sign in again", "error");
        router.push("/login");
        return;
      }
      if (!res.ok) {
        notify(data.error || "Could not complete booking", "error");
        return;
      }
      notify(
        `Booked ${effectiveQuantity} × ${meta.label} for ${nights} night${nights > 1 ? "s" : ""}!`,
        "success"
      );
      onClose();
    } catch {
      notify("Network error — is the backend running?", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={meta.shortLabel}>
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {meta.image && (
          <div className="relative h-44 w-full overflow-hidden rounded-2xl">
            <Image
              src={meta.image}
              alt={`${meta.label} at EchoLodge`}
              fill
              sizes="(max-width: 640px) 100vw, 480px"
              className="object-cover"
            />
          </div>
        )}

        <p className="text-sm text-ink-soft dark:text-parchment/70 leading-relaxed">
          {group.description}
        </p>

        {meta.highlights.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {meta.highlights.map((h) => (
              <li
                key={h}
                className="rounded-full bg-canvas dark:bg-bark border border-sand dark:border-bark-soft px-3 py-1 text-xs text-ink-soft dark:text-parchment/70"
              >
                {h}
              </li>
            ))}
          </ul>
        )}

        <p className="text-sm text-ink-soft dark:text-parchment/70">
          {formatINR(group.pricePerNight)} per night · {group.inventory} room
          {group.inventory > 1 ? "s" : ""} in this category
        </p>

        <Input
          label="Check-in"
          type="date"
          min={todayISO()}
          value={checkIn}
          onChange={(e) => setCheckIn(e.target.value)}
          error={errors.checkIn}
        />
        <Input
          label="Check-out"
          type="date"
          min={checkIn || todayISO()}
          value={checkOut}
          onChange={(e) => setCheckOut(e.target.value)}
          error={errors.checkOut}
        />

        {/* Live availability for the chosen range, resolved before submit. */}
        {(isChecking || liveAvailability) && (
          <div
            className={`rounded-2xl border p-4 text-sm animate-fade-in ${
              soldOut
                ? "border-clay/40 bg-clay/10 text-clay-dark dark:text-clay"
                : "border-sand dark:border-bark-soft bg-canvas dark:bg-bark text-ink-soft dark:text-parchment/70"
            }`}
          >
            {isChecking ? (
              <span className="flex items-center gap-2">
                <Loader className="w-4 h-4 text-forest dark:text-moss" />
                Checking availability for these dates…
              </span>
            ) : soldOut ? (
              <>
                <span className="font-medium">Fully booked for these dates.</span> Try a
                different range — other categories may still be free.
              </>
            ) : (
              <>
                <span className="font-medium text-ink dark:text-parchment">
                  {liveAvailability.available} of {liveAvailability.inventory}
                </span>{" "}
                room{liveAvailability.available === 1 ? "" : "s"} available for these dates.
              </>
            )}
          </div>
        )}

        <QuantityStepper
          value={effectiveQuantity}
          max={maxSelectable}
          subtitle={
            liveAvailability
              ? `${liveAvailability.available} free for your dates`
              : `${group.inventory} in this category`
          }
          onChange={setQuantity}
        />

        {nights > 0 && (
          <div className="rounded-2xl bg-canvas dark:bg-bark p-4 flex items-center justify-between animate-fade-in">
            <span className="text-sm text-ink-soft dark:text-parchment/70">
              {effectiveQuantity} room{effectiveQuantity > 1 ? "s" : ""} × {nights} night{nights > 1 ? "s" : ""} ×{" "}
              {formatINR(group.pricePerNight)}
            </span>
            <span className="font-display text-lg font-semibold text-ink dark:text-parchment">
              {formatINR(total)}
            </span>
          </div>
        )}

        <Button
          type="submit"
          size="lg"
          disabled={submitting || soldOut || isChecking}
          className="w-full"
        >
          {submitting
            ? "Booking…"
            : soldOut
              ? "Fully booked for these dates"
              : "Confirm booking"}
        </Button>
      </form>
    </Modal>
  );
}

export default function RoomsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeGroup, setActiveGroup] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API}/rooms`);
        if (!res.ok) throw new Error("Failed to load rooms");
        const data = await res.json();
        if (!cancelled) setRooms(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const groups = useMemo(() => groupByCategory(rooms), [rooms]);
  const isSlowLoad = useSlowLoad(loading);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="text-center mb-14 animate-fade-in-up">
        <p className="text-sm font-medium uppercase tracking-wider text-clay">Stay with us</p>
        <h1 className="mt-2 font-display text-4xl sm:text-5xl font-semibold text-ink dark:text-parchment">
          Rooms &amp; Suites
        </h1>
        <p className="mt-3 max-w-2xl mx-auto text-ink-soft dark:text-parchment/70">
          Three ways to stay by the river — every one of them with complimentary
          terrace access and the Ganga a short walk away.
        </p>
      </div>

      {loading && (
        <div className="flex flex-col items-center gap-3 py-24">
          <Loader className="w-8 h-8 text-forest dark:text-moss" />
          {isSlowLoad && (
            <p className="max-w-sm text-center text-sm text-ink-soft dark:text-parchment/60 animate-fade-in">
              Waking up our booking service — this can take up to a minute on the
              first visit of the day. Thanks for your patience.
            </p>
          )}
        </div>
      )}

      {error && !loading && (
        <p className="text-center text-clay">{error} — please try again in a moment.</p>
      )}

      {!loading && !error && groups.length === 0 && (
        <EmptyState
          title="No rooms available right now"
          hint="Our hosts are preparing the lodge — check back soon."
        />
      )}

      {!loading && !error && groups.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {groups.map((group, index) => (
            <CategoryTile key={group.category} group={group} index={index} onOpen={setActiveGroup} />
          ))}
        </div>
      )}

      {/* Keyed by category so opening a different room type remounts the form
          with fresh state, rather than clearing six fields in an effect. */}
      <CategoryBookingModal
        key={activeGroup?.category ?? "none"}
        group={activeGroup}
        isOpen={activeGroup !== null}
        onClose={() => setActiveGroup(null)}
        session={session}
        router={router}
      />
    </div>
  );
}
