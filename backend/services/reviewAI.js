const { GoogleGenAI, Type } = require('@google/genai');
const { z } = require('zod');

// Same model strategy as routes/ai.js: a stable alias that tracks the current
// flash tier, overridable via env.
const MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';
const REQUEST_TIMEOUT_MS = 20_000;

let client = null;
function getClient() {
  if (!client) {
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return client;
}

const SYSTEM_INSTRUCTION = [
  'You are the guest-relations analyst for EchoLodge, a boutique riverside hotel in Rishikesh, Uttarakhand.',
  'You will be given a single guest review. Analyse it and respond with a JSON object only.',
  'sentiment: the overall sentiment of the review — exactly one of POSITIVE, NEUTRAL, NEGATIVE.',
  'aiTags: 1 to 3 short internal categorisation tags describing what the review is about.',
  'Prefer tags from this vocabulary when they fit: Cleanliness, Location, Staff, Food, Amenities, Value, Noise, View, Booking, Wifi.',
  'suggestedReply: a warm, professional 2-4 sentence draft reply to the guest from "The EchoLodge Team".',
  'The reply must thank the guest by name, acknowledge their specific points (apologise briefly if negative), and never promise refunds or compensation.',
].join(' ');

// Gemini-side structured output contract: forces valid JSON with these fields.
const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    sentiment: { type: Type.STRING, enum: ['POSITIVE', 'NEUTRAL', 'NEGATIVE'] },
    aiTags: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      minItems: 1,
      maxItems: 3,
    },
    suggestedReply: { type: Type.STRING },
  },
  required: ['sentiment', 'aiTags', 'suggestedReply'],
};

// App-side validation: never trust model output, even in JSON mode.
const aiResultSchema = z.object({
  sentiment: z.enum(['POSITIVE', 'NEUTRAL', 'NEGATIVE']),
  aiTags: z.array(z.string().trim().min(1).max(40)).min(1).max(3),
  suggestedReply: z.string().trim().min(1).max(2000),
});

/**
 * Analyses a guest review with Gemini.
 * Returns { sentiment, aiTags, suggestedReply } — or null on ANY failure
 * (missing key, timeout, API error, malformed output), so callers can save
 * the review with empty AI fields instead of losing the submission.
 */
async function analyzeReview({ guestName, roomType, reviewText, rating }) {
  if (!process.env.GEMINI_API_KEY) {
    console.error('reviewAI: GEMINI_API_KEY is not set — skipping analysis');
    return null;
  }

  const prompt = [
    `Guest name: ${guestName}`,
    `Room type: ${roomType}`,
    rating ? `Star rating: ${rating}/5` : null,
    `Review: """${reviewText}"""`,
  ]
    .filter(Boolean)
    .join('\n');

  try {
    const response = await getClient().models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
        abortSignal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      },
    });

    const parsed = aiResultSchema.safeParse(JSON.parse(response.text));
    if (!parsed.success) {
      console.error('reviewAI: model output failed validation:', parsed.error.message);
      return null;
    }
    return parsed.data;
  } catch (err) {
    console.error('reviewAI: analysis failed:', err.message);
    return null;
  }
}

module.exports = { analyzeReview };
