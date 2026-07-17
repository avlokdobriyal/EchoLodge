const express = require('express');
const { z } = require('zod');
const { GoogleGenAI } = require('@google/genai');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

// The spec called for gemini-1.5-flash, but Google has retired it (and gates
// the 2.x-flash models) for new API keys as of mid-2026. gemini-flash-latest
// is a stable alias that always tracks the current fast/low-cost flash model,
// so it won't break the next time a specific version is deprecated. Override
// with GEMINI_MODEL to pin a version.
const MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';
const REQUEST_TIMEOUT_MS = 30_000;

// Lazily constructed so the server can boot without a key; requests without
// one fail cleanly below instead of crashing at require-time.
let client = null;
function getClient() {
  if (!client) {
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return client;
}

const itinerarySchema = z.object({
  prompt: z
    .string()
    .min(3, 'Describe your trip in at least a few words')
    .max(1000, 'Please keep your trip description under 1000 characters'),
});

// Variation 3 from PROMPTS.md — role + constraints + business tie-in.
const SYSTEM_INSTRUCTION = [
  'You are the expert AI Concierge at EchoLodge, a boutique riverside hotel in Rishikesh, Uttarakhand, India.',
  'Create a day-by-day itinerary for the guest based on their stated trip preferences.',
  'Format the response in clean markdown with a clear heading for each day (e.g. "## Day 1 — ...").',
  'Mention returning to EchoLodge in the evenings (dinner on the terrace, riverside rest, etc.).',
  'Suggest real local spots such as Triveni Ghat, Shivpuri, Laxman Jhula, Ram Jhula, the Beatles Ashram, or Neer Garh waterfall where they fit the guest\'s interests.',
  'Keep it practical: rough timings, travel notes, and one food suggestion per day. Do not invent prices.',
].join(' ');

// --- POST /api/ai/itinerary — authenticated -------------------------------
router.post('/itinerary', requireAuth, async (req, res) => {
  const parsed = itinerarySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten().fieldErrors });
  }

  if (!process.env.GEMINI_API_KEY) {
    // Config problem, not a client problem — surface a clean 500.
    console.error('GEMINI_API_KEY is not set');
    return res.status(500).json({ error: 'AI service is not configured' });
  }

  try {
    const response = await getClient().models.generateContent({
      model: MODEL,
      contents: `Create a day-by-day Rishikesh itinerary for a guest who wants: ${parsed.data.prompt}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        abortSignal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      },
    });

    const itinerary = response.text;
    if (!itinerary) {
      // Safety-blocked or empty candidate — treat as a service failure.
      return res.status(500).json({ error: 'The AI could not generate an itinerary. Please try rephrasing.' });
    }

    res.status(200).json({ itinerary, model: MODEL });
  } catch (err) {
    // Timeouts surface as AbortError; everything else is an upstream failure.
    // Never leak SDK/stack details to the client.
    const timedOut = err.name === 'AbortError' || err.name === 'TimeoutError';
    console.error('Gemini request failed:', err.message);
    res.status(500).json({
      error: timedOut
        ? 'The AI took too long to respond. Please try again.'
        : 'The AI concierge is unavailable right now. Please try again shortly.',
    });
  }
});

module.exports = router;
