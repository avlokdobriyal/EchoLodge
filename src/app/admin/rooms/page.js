"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Button, Input, Loader, notify } from "@/components/ui/index.js";
import RequireAdmin from "@/components/RequireAdmin";

const API = "http://localhost:5000/api/rooms";

const CATEGORIES = [
  "Ganga View Balcony",
  "Standard Balcony",
  "Super Deluxe Ganga View Suite",
];

function formatINR(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

const EMPTY_FORM = { name: "", category: CATEGORIES[0], description: "", pricePerNight: "" };

function AdminRoomsContent() {
  const { data: session } = useSession();
  const token = session?.backendToken;

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(API);
      if (!res.ok) throw new Error("Failed to load rooms");
      setRooms(await res.json());
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = "Name is required";
    if (!form.description.trim()) next.description = "Description is required";
    const price = Number(form.pricePerNight);
    if (!form.pricePerNight || Number.isNaN(price) || price <= 0) {
      next.pricePerNight = "Enter a price greater than 0";
    }
    return next;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name.trim(),
          category: form.category,
          description: form.description.trim(),
          pricePerNight: Number(form.pricePerNight),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        notify(data.error || "Could not create room", "error");
        return;
      }
      notify("Room created", "success");
      setForm(EMPTY_FORM);
      setRooms((prev) => [...prev, data]);
    } catch {
      notify("Network error — is the backend running?", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (room) => {
    if (!window.confirm(`Delete "${room.name}"? This also removes its bookings.`)) return;
    try {
      const res = await fetch(`${API}/${room.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => ({}));
        notify(data.error || "Could not delete room", "error");
        return;
      }
      notify("Room deleted", "success");
      setRooms((prev) => prev.filter((r) => r.id !== room.id));
    } catch {
      notify("Network error — is the backend running?", "error");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="mb-10">
        <p className="text-sm font-medium uppercase tracking-wider text-clay">Admin</p>
        <h1 className="mt-2 font-display text-4xl font-semibold text-ink dark:text-parchment">
          Manage Rooms
        </h1>
        <p className="mt-2 text-ink-soft dark:text-parchment/70">
          Add new rooms to the catalogue or remove existing ones.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add-room form */}
        <form
          onSubmit={handleCreate}
          noValidate
          className="lg:col-span-1 h-fit rounded-3xl bg-surface dark:bg-bark-soft border border-sand dark:border-bark-soft shadow-sm p-6 space-y-4"
        >
          <h2 className="font-display text-lg font-semibold text-ink dark:text-parchment">
            Add a room
          </h2>
          <Input
            label="Name"
            placeholder="Ganga View Balcony 6"
            value={form.name}
            onChange={setField("name")}
            error={errors.name}
          />
          <div className="flex flex-col space-y-1 w-full">
            <label className="text-sm font-medium text-ink dark:text-parchment">Category</label>
            <select
              value={form.category}
              onChange={setField("category")}
              className="px-4 py-2.5 bg-surface dark:bg-bark border border-sand dark:border-bark-soft rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-forest/40 text-ink dark:text-parchment transition-colors"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col space-y-1 w-full">
            <label className="text-sm font-medium text-ink dark:text-parchment">Description</label>
            <textarea
              rows={3}
              placeholder="Include Complimentary Terrace Access…"
              value={form.description}
              onChange={setField("description")}
              className={`px-4 py-2.5 bg-surface dark:bg-bark border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-forest/40 text-ink dark:text-parchment placeholder-ink-soft/60 dark:placeholder-parchment/40 transition-colors ${
                errors.description ? "border-clay" : "border-sand dark:border-bark-soft"
              }`}
            />
            {errors.description && <p className="text-xs text-clay mt-1">{errors.description}</p>}
          </div>
          <Input
            label="Price per night (₹)"
            type="number"
            min="1"
            placeholder="6500"
            value={form.pricePerNight}
            onChange={setField("pricePerNight")}
            error={errors.pricePerNight}
          />
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Adding…" : "Add room"}
          </Button>
        </form>

        {/* Room list */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="flex justify-center py-24">
              <Loader className="w-8 h-8 text-forest dark:text-moss" />
            </div>
          ) : rooms.length === 0 ? (
            <p className="text-ink-soft dark:text-parchment/70">No rooms yet. Add one to get started.</p>
          ) : (
            <ul className="space-y-3">
              {rooms.map((room) => (
                <li
                  key={room.id}
                  className="flex items-center justify-between gap-4 rounded-2xl bg-surface dark:bg-bark-soft border border-sand dark:border-bark-soft p-4"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-ink dark:text-parchment truncate">{room.name}</p>
                    <p className="text-xs text-ink-soft dark:text-parchment/60">
                      {room.category} · {formatINR(room.pricePerNight)}/night
                    </p>
                  </div>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(room)}>
                    Delete
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminRoomsPage() {
  return (
    <RequireAdmin>
      <AdminRoomsContent />
    </RequireAdmin>
  );
}
