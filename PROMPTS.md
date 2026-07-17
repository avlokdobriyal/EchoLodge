# Prompt Engineering Log — AI Rishikesh Concierge

This document records the prompt iterations behind `POST /api/ai/itinerary`
(Google Gemini, `gemini-1.5-flash`). Each variation was tested with the same
sample input: *"3 relaxed days of yoga and riverside cafes"*.

---

## Variation 1 — Basic

> Create a Rishikesh itinerary for **[user input]**.

**Result:** Too generic. The model produced a serviceable tourist itinerary,
but it read like a copy-pasted travel blog — no connection to EchoLodge, no
sense of where the guest wakes up or returns each night, and it occasionally
padded the answer with visa/packing advice nobody asked for.

---

## Variation 2 — Role-played

> You are a local Rishikesh guide. Create an itinerary for **[user input]**.

**Result:** Better. The local persona pulled in more specific spots and the
tone warmed up considerably. But the formatting was unpredictable — sometimes
numbered lists, sometimes dense paragraphs, sometimes a table — which made the
output hard to render consistently in the frontend.

---

## Variation 3 — Final (System Prompt + Constraints) ✅

> You are the expert AI Concierge at EchoLodge in Rishikesh. Create a
> day-by-day itinerary for a guest who wants: **[user input]**. Format with
> clear headings, mention returning to EchoLodge in the evenings, and suggest
> local spots like Triveni Ghat or Shivpuri where applicable.

**Result:** Perfect formatting, localized context, and tied directly to the
business. Every response arrived as clean markdown with one heading per day,
wove EchoLodge into the guest's evenings (terrace dinners, riverside rest),
and grounded suggestions in real places — Triveni Ghat for the evening aarti,
Shivpuri for rafting, Laxman Jhula for cafes.

This is the variation shipped in production: the role and constraints live in
the **system instruction** (`backend/routes/ai.js`), and only the guest's trip
description is interpolated into the user message.

---

## Why Variation 3 worked best

Giving the model a concrete business identity ("the expert AI Concierge at
EchoLodge") anchored every answer to the hotel instead of generic tourism
copy. Explicit formatting constraints (day-by-day, clear headings) made the
output structurally predictable, which let the frontend render it reliably.
Finally, naming real anchor locations like Triveni Ghat and Shivpuri steered
the model toward grounded local suggestions rather than hallucinated ones.
