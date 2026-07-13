"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button, Input, Modal, Loader, notify } from "@/components/ui/index.js";

const API = "http://localhost:5000/api";

const categoryAccent = {
  "Ganga View Balcony": "bg-forest/10 text-forest dark:bg-moss/20 dark:text-moss",
  "Standard Balcony": "bg-sand text-ink-soft dark:bg-bark dark:text-parchment/70",
  "Super Deluxe Ganga View Suite": "bg-clay/15 text-clay-dark dark:bg-clay/25 dark:text-clay",
};

function formatINR(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

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

function RoomCard({ room, onBook }) {
  const accent = categoryAccent[room.category] || categoryAccent["Standard Balcony"];
  return (
    <div className="flex flex-col rounded-3xl bg-surface dark:bg-bark-soft border border-sand dark:border-bark-soft shadow-sm overflow-hidden">
      <div className="p-6 flex flex-col flex-grow">
        <span className={`self-start px-3 py-1 rounded-full text-xs font-medium ${accent}`}>
          {room.category}
        </span>
        <h3 className="mt-4 font-display text-xl font-semibold text-ink dark:text-parchment">
          {room.name}
        </h3>
        <p className="mt-2 text-sm text-ink-soft dark:text-parchment/70 flex-grow">
          {room.description}
        </p>
        <div className="mt-5 flex items-end justify-between">
          <div>
            <p className="font-display text-2xl font-semibold text-ink dark:text-parchment">
              {formatINR(room.pricePerNight)}
            </p>
            <p className="text-xs text-ink-soft dark:text-parchment/50">per night</p>
          </div>
          <Button size="sm" onClick={() => onBook(room)}>
            Book Now
          </Button>
        </div>
      </div>
    </div>
  );
}

function BookingModal({ room, isOpen, onClose, onBooked, session, router }) {
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Reset the fields whenever a different room's modal opens.
  useEffect(() => {
    setCheckIn("");
    setCheckOut("");
    setErrors({});
  }, [room?.id]);

  if (!room) return null;

  const nights = nightsBetween(checkIn, checkOut);
  const total = nights * room.pricePerNight;

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
      const res = await fetch(`${API}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.backendToken}`,
        },
        body: JSON.stringify({ roomId: room.id, checkIn, checkOut }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        notify(data.error || "Could not complete booking", "error");
        return;
      }
      notify(`Booked ${room.name} for ${nights} night${nights > 1 ? "s" : ""}!`, "success");
      onBooked?.(data);
      onClose();
    } catch {
      notify("Network error — is the backend running?", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Book — ${room.name}`}>
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <p className="text-sm text-ink-soft dark:text-parchment/70">
          {formatINR(room.pricePerNight)} per night · {room.category}
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

        {nights > 0 && (
          <div className="rounded-2xl bg-canvas dark:bg-bark p-4 flex items-center justify-between">
            <span className="text-sm text-ink-soft dark:text-parchment/70">
              {nights} night{nights > 1 ? "s" : ""} × {formatINR(room.pricePerNight)}
            </span>
            <span className="font-display text-lg font-semibold text-ink dark:text-parchment">
              {formatINR(total)}
            </span>
          </div>
        )}

        <Button type="submit" size="lg" disabled={submitting} className="w-full">
          {submitting ? "Booking…" : "Confirm booking"}
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
  const [activeRoom, setActiveRoom] = useState(null);

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="text-center mb-12">
        <p className="text-sm font-medium uppercase tracking-wider text-clay">Stay with us</p>
        <h1 className="mt-2 font-display text-4xl sm:text-5xl font-semibold text-ink dark:text-parchment">
          Our Rooms
        </h1>
        <p className="mt-3 max-w-2xl mx-auto text-ink-soft dark:text-parchment/70">
          Riverside rooms and suites in the heart of the valley — every stay includes
          complimentary terrace access.
        </p>
      </div>

      {loading && (
        <div className="flex justify-center py-24">
          <Loader className="w-8 h-8 text-forest dark:text-moss" />
        </div>
      )}

      {error && !loading && (
        <p className="text-center text-clay">{error} — is the backend running on port 5000?</p>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} onBook={setActiveRoom} />
          ))}
        </div>
      )}

      <BookingModal
        room={activeRoom}
        isOpen={activeRoom !== null}
        onClose={() => setActiveRoom(null)}
        session={session}
        router={router}
      />
    </div>
  );
}
