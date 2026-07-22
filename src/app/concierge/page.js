"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button, notify } from "@/components/ui/index.js";
import RequireAuth from "@/components/RequireAuth";

const API = "http://localhost:5000/api/ai/itinerary";

const SUGGESTIONS = [
  "3 relaxed days of yoga and riverside cafes",
  "2 days of adventure — rafting and trekking",
  "A spiritual weekend: temples, aarti, and meditation",
];

// Renders **bold** spans inside a line without pulling in a markdown library.
function renderInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="font-semibold text-ink dark:text-parchment">
        {part.slice(2, -2)}
      </strong>
    ) : (
      part
    )
  );
}

// Lightweight formatter for the markdown Gemini returns: #/##/### headings,
// -/* bullet lists, and paragraphs. Anything fancier degrades to plain text.
function Itinerary({ text }) {
  const blocks = [];
  let list = null;

  const flushList = () => {
    if (list) {
      blocks.push({ type: "list", items: list });
      list = null;
    }
  };

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    const heading = line.match(/^(#{1,4})\s+(.*)/);
    const bullet = line.match(/^[-*]\s+(.*)/);

    if (heading) {
      flushList();
      blocks.push({ type: `h${heading[1].length}`, text: heading[2] });
    } else if (bullet) {
      (list ??= []).push(bullet[1]);
    } else if (line) {
      flushList();
      blocks.push({ type: "p", text: line });
    } else {
      flushList();
    }
  }
  flushList();

  return (
    <div className="space-y-3">
      {blocks.map((block, i) => {
        if (block.type === "list") {
          return (
            <ul key={i} className="list-disc pl-6 space-y-1.5 text-ink-soft dark:text-parchment/80">
              {block.items.map((item, j) => (
                <li key={j}>{renderInline(item)}</li>
              ))}
            </ul>
          );
        }
        if (block.type === "h1" || block.type === "h2") {
          return (
            <h2 key={i} className="pt-3 font-display text-2xl font-semibold text-forest dark:text-moss">
              {renderInline(block.text)}
            </h2>
          );
        }
        if (block.type === "h3" || block.type === "h4") {
          return (
            <h3 key={i} className="pt-2 font-display text-lg font-semibold text-ink dark:text-parchment">
              {renderInline(block.text)}
            </h3>
          );
        }
        return (
          <p key={i} className="leading-relaxed text-ink-soft dark:text-parchment/80">
            {renderInline(block.text)}
          </p>
        );
      })}
    </div>
  );
}

function ConciergeContent() {
  const { data: session } = useSession();
  const token = session?.backendToken;

  const [prompt, setPrompt] = useState("");
  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (prompt.trim().length < 3) {
      setError("Tell us a little more about your ideal trip first.");
      return;
    }

    setLoading(true);
    setError(null);
    setItinerary(null);
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "The concierge could not plan your trip.");
      }
      setItinerary(data.itinerary);
      notify("Your itinerary is ready!", "success");
    } catch (err) {
      const message =
        err instanceof TypeError
          ? "Network error — is the backend running?"
          : err.message;
      setError(message);
      notify(message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="text-center mb-10">
        <p className="text-sm font-medium uppercase tracking-wider text-clay">AI Concierge</p>
        <h1 className="mt-2 font-display text-4xl sm:text-5xl font-semibold text-ink dark:text-parchment">
          Plan your Rishikesh days
        </h1>
        <p className="mt-3 max-w-xl mx-auto text-ink-soft dark:text-parchment/70">
          Describe your ideal trip and our concierge will craft a day-by-day
          itinerary around your stay at EchoLodge.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-3xl bg-surface dark:bg-bark-soft border border-sand dark:border-bark-soft shadow-sm p-6 sm:p-8 space-y-4"
      >
        <label className="block text-sm font-medium text-ink dark:text-parchment">
          What does your ideal trip look like?
        </label>
        <textarea
          rows={4}
          maxLength={1000}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. 3 relaxed days — morning yoga, river views, quiet cafes, one gentle hike…"
          className="w-full px-4 py-3 bg-canvas dark:bg-bark border border-sand dark:border-bark-soft rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-forest/40 focus:border-forest text-ink dark:text-parchment placeholder-ink-soft/60 dark:placeholder-parchment/40 transition-colors resize-y"
        />

        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setPrompt(s)}
              className="px-3 py-1.5 rounded-full text-xs border border-sand dark:border-bark-soft text-ink-soft dark:text-parchment/70 hover:border-clay hover:text-clay transition-colors"
            >
              {s}
            </button>
          ))}
        </div>

        <Button type="submit" size="lg" disabled={loading} className="w-full">
          {loading ? "Planning your days…" : "Create my itinerary"}
        </Button>
      </form>

      {loading && (
        <div className="mt-10 rounded-3xl bg-surface dark:bg-bark-soft border border-sand dark:border-bark-soft shadow-sm p-6 sm:p-8 animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="flex items-end gap-1.5" aria-hidden="true">
              {[0, 150, 300].map((delay) => (
                <span
                  key={delay}
                  className="h-2 w-2 rounded-full bg-forest dark:bg-moss animate-bounce"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
            </span>
            <p className="text-sm text-ink-soft dark:text-parchment/60">
              Consulting our local concierge — crafting your days…
            </p>
          </div>
          {/* Shimmer skeleton of the itinerary that's on its way */}
          <div className="mt-6 space-y-3 animate-pulse" aria-hidden="true">
            <div className="h-5 w-1/3 rounded-full bg-sand dark:bg-bark" />
            <div className="h-3 w-full rounded-full bg-sand dark:bg-bark" />
            <div className="h-3 w-5/6 rounded-full bg-sand dark:bg-bark" />
            <div className="h-3 w-2/3 rounded-full bg-sand dark:bg-bark" />
            <div className="h-5 w-1/4 rounded-full bg-sand dark:bg-bark mt-6" />
            <div className="h-3 w-full rounded-full bg-sand dark:bg-bark" />
            <div className="h-3 w-3/4 rounded-full bg-sand dark:bg-bark" />
          </div>
        </div>
      )}

      {error && !loading && (
        <div className="mt-8 rounded-2xl border border-clay/40 bg-clay/10 p-5 text-clay-dark dark:text-clay">
          {error}
        </div>
      )}

      {itinerary && !loading && (
        <article className="mt-10 rounded-3xl bg-surface dark:bg-bark-soft border border-sand dark:border-bark-soft shadow-sm p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3 mb-4 pb-4 border-b border-sand dark:border-bark">
            <h2 className="font-display text-xl font-semibold text-ink dark:text-parchment">
              Your itinerary
            </h2>
            <Button variant="outline" size="sm" onClick={() => setItinerary(null)}>
              Start over
            </Button>
          </div>
          <Itinerary text={itinerary} />
        </article>
      )}
    </div>
  );
}

export default function ConciergePage() {
  return (
    <RequireAuth>
      <ConciergeContent />
    </RequireAuth>
  );
}
