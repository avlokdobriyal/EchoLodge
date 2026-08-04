"use client";
import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button, Input, Modal, Loader, notify } from "@/components/ui/index.js";
import Photo from "@/components/ui/Photo";
import EmptyState from "@/components/EmptyState";
import RoomLedger from "@/components/RoomLedger";
import { Reveal, Stagger, StaggerItem, Counter } from "@/components/motion/index.jsx";
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
    (a, b) =>
      (CATEGORY_META[a.category]?.order ?? 99) -
      (CATEGORY_META[b.category]?.order ?? 99)
  );
}

// Quantity stepper strictly clamped to [1, max] — max is the category's
// live inventory (5 / 5 / 2), so overbooking can't even be requested.
function QuantityStepper({ value, max, subtitle, onChange }) {
  const decrement = () => onChange(Math.max(1, value - 1));
  const increment = () => onChange(Math.min(max, value + 1));
  const stepBtn =
    "flex h-9 w-9 items-center justify-center rounded-sm border border-line-strong text-lg leading-none text-ink transition-colors hover:border-accent hover:text-accent-text disabled:opacity-30 disabled:hover:border-line-strong disabled:hover:text-ink";

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-ink">Rooms</p>
        <p className="text-xs text-ink-faint">{subtitle}</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={decrement}
          disabled={value <= 1}
          aria-label="Fewer rooms"
          className={stepBtn}
        >
          −
        </button>
        <span className="num w-7 text-center text-lg font-semibold text-ink">
          {value}
        </span>
        <button
          type="button"
          onClick={increment}
          disabled={value >= max}
          aria-label="More rooms"
          className={stepBtn}
        >
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
      className="card-lift group flex h-full w-full flex-col overflow-hidden rounded-md border border-line bg-surface text-left"
    >
      <div className="photo-wake relative aspect-[4/3] overflow-hidden bg-surface-2">
        <Photo
          src={meta.image}
          alt={`${meta.label} at EchoLodge`}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          priority={index === 0}
          className="object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-ridge-950/70 to-transparent" />
        {meta.tag && (
          <span className="eyebrow absolute bottom-3 left-3 rounded-xs bg-ridge-950/45 px-2 py-1 text-quartz-100 backdrop-blur-sm">
            {meta.tag}
          </span>
        )}
      </div>

      <div className="flex flex-grow flex-col p-5">
        <h3 className="text-xl font-semibold tracking-tight text-ink">
          {meta.shortLabel}
        </h3>
        <p className="mt-2 flex-grow text-[15px] leading-relaxed text-ink-muted">
          {meta.tagline}
        </p>

        {/* Price and inventory on one baseline: the two facts a guest compares
            across categories, so they sit in the same place on every tile. */}
        <div className="mt-5 flex items-end justify-between gap-4 border-t border-line pt-4">
          <div>
            <p className="num text-lg font-semibold text-ink">
              {formatINR(group.pricePerNight)}
            </p>
            <p className="text-xs text-ink-faint">per night</p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <RoomLedger total={group.inventory} size="sm" />
            <span className="num text-xs text-ink-faint">
              {group.inventory} room{group.inventory > 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent-text">
          Check dates
          <svg
            aria-hidden="true"
            className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M13 7l5 5-5 5M6 12h12"
            />
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
  const liveAvailability =
    availability?.key === rangeKey ? availability.data : null;
  const isChecking = rangeIsValid && availability?.key !== rangeKey;

  // Derived rather than stored, so the stepper can never sit above what's free.
  const maxSelectable = Math.max(
    1,
    liveAvailability?.available ?? group.inventory
  );
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
        body: JSON.stringify({
          category: group.category,
          quantity: effectiveQuantity,
          checkIn,
          checkOut,
        }),
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
    <Modal isOpen={isOpen} onClose={onClose} title={meta.shortLabel} size="lg">
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-sm bg-surface-2">
          <Photo
            src={meta.image}
            alt={`${meta.label} at EchoLodge`}
            sizes="(max-width: 640px) 100vw, 512px"
            className="object-cover"
          />
        </div>

        <p className="text-[15px] leading-relaxed text-ink-muted">
          {group.description}
        </p>

        {meta.highlights.length > 0 && (
          <ul className="space-y-1.5">
            {meta.highlights.map((h) => (
              <li
                key={h}
                className="flex items-start gap-2.5 text-sm text-ink-muted"
              >
                <span
                  aria-hidden="true"
                  className="mt-2 h-px w-3 flex-shrink-0 bg-line-strong"
                />
                {h}
              </li>
            ))}
          </ul>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
        </div>

        {/* Live availability for the chosen range, resolved before submit.
            The ledger is the point here: one mark per real room, lit if it's
            free. A guest reads "two left" off the marks before they read it
            off the sentence. */}
        {(isChecking || liveAvailability) && (
          <div
            className={`animate-fade-in rounded-md border p-4 ${
              soldOut
                ? "border-alert/40 bg-alert/5"
                : "border-line bg-surface-2"
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              <p className="eyebrow text-ink-faint">
                {soldOut ? "Fully booked" : "Availability"}
              </p>
              {!isChecking && liveAvailability && (
                <RoomLedger
                  total={liveAvailability.inventory}
                  available={liveAvailability.available}
                />
              )}
            </div>

            <p className="mt-3 text-sm text-ink-muted">
              {isChecking ? (
                <span className="flex items-center gap-2">
                  <Loader className="h-3.5 w-3.5 text-ink-faint" />
                  Checking these dates…
                </span>
              ) : soldOut ? (
                <>
                  Nothing free in this category for these dates. Try a different
                  range, or another room type.
                </>
              ) : (
                <>
                  <span className="num font-semibold text-ink">
                    <Counter value={liveAvailability.available} /> of{" "}
                    {liveAvailability.inventory}
                  </span>{" "}
                  room{liveAvailability.available === 1 ? "" : "s"} free for
                  these dates.
                </>
              )}
            </p>
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
          <div className="animate-fade-in flex items-center justify-between gap-4 border-t border-line pt-4">
            <span className="num text-sm text-ink-muted">
              {effectiveQuantity} × {nights} night{nights > 1 ? "s" : ""} ×{" "}
              {formatINR(group.pricePerNight)}
            </span>
            <span className="num text-xl font-semibold text-ink">
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

        <p className="text-center text-xs text-ink-faint">
          No payment now — settle at the property.
        </p>
      </form>
    </Modal>
  );
}

function TileSkeleton() {
  return (
    <div className="overflow-hidden rounded-md border border-line bg-surface">
      <div className="skeleton aspect-[4/3] w-full" />
      <div className="space-y-3 p-5">
        <div className="skeleton h-5 w-1/2 rounded-xs" />
        <div className="skeleton h-3 w-full rounded-xs" />
        <div className="skeleton h-3 w-3/4 rounded-xs" />
      </div>
    </div>
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
  const totalRooms = groups.reduce((n, g) => n + g.inventory, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <Reveal className="max-w-3xl">
        <p className="eyebrow text-ink-faint">
          {totalRooms > 0
            ? `${totalRooms} rooms · three categories`
            : "Rooms & suites"}
        </p>
        <h1 className="display mt-4 text-ink">Pick your nights.</h1>
        <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-ink-muted">
          Every room here has complimentary terrace access and the Ganga a short
          walk away. Choose a category and we’ll show you exactly what’s free
          before you book anything.
        </p>
      </Reveal>

      <div className="mt-12">
        {loading && (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <TileSkeleton />
              <TileSkeleton />
              <TileSkeleton />
            </div>
            {isSlowLoad && (
              <p className="animate-fade-in mx-auto mt-8 max-w-md text-center text-sm text-ink-muted">
                Waking up our booking service — this can take up to a minute on
                the first visit of the day. Thanks for your patience.
              </p>
            )}
          </>
        )}

        {error && !loading && (
          <EmptyState
            title="We couldn't load the rooms"
            hint={`${error}. Give it a moment and reload — the booking service may still be waking up.`}
          />
        )}

        {!loading && !error && groups.length === 0 && (
          <EmptyState
            title="No rooms available right now"
            hint="We're preparing the lodge — check back soon."
          />
        )}

        {!loading && !error && groups.length > 0 && (
          <Stagger className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((group, index) => (
              <StaggerItem key={group.category} className="h-full">
                <CategoryTile
                  group={group}
                  index={index}
                  onOpen={setActiveGroup}
                />
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </div>

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
