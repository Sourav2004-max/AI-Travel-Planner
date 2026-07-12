import express from "express";
import { generateTravelPlan } from "../services/graniteService.js";

const router = express.Router();

/**
 * POST /chat
 * Body: {
 *   destination: string,
 *   days: number,
 *   budget: string,          // "budget" | "moderate" | "luxury"
 *   interests: string[],
 *   travelStyle: string,     // "solo" | "couple" | "family" | "group"
 *   message?: string         // free-form override
 * }
 */
router.post("/", async (req, res) => {
  const { destination, days, budget, interests, travelStyle, message } = req.body;

  if (!destination && !message) {
    return res.status(400).json({ error: "Provide at least a destination or a message." });
  }

  // Build a rich, structured prompt for IBM Granite
  const prompt = message
    ? message.trim()
    : buildPrompt({ destination, days, budget, interests, travelStyle });

  try {
    const plan = await generateTravelPlan(prompt);
    res.json({ plan });
  } catch (err) {
    console.error("[chat route] Unexpected error:", err.message);
    res.status(500).json({ error: "Failed to generate travel plan. Please try again." });
  }
});

function buildPrompt({ destination, days, budget, interests, travelStyle }) {
  const interestList = Array.isArray(interests) && interests.length
    ? interests.join(", ")
    : "culture, food, sightseeing";

  return `You are an expert travel planner AI. Create a detailed, practical travel plan with the following details:

Destination: ${destination}
Duration: ${days ?? 5} days
Budget level: ${budget ?? "moderate"}
Travel style: ${travelStyle ?? "solo"}
Interests: ${interestList}

Please provide:
1. A day-by-day itinerary with morning, afternoon, and evening activities
2. Specific attraction and restaurant recommendations
3. An estimated budget breakdown in USD
4. Best time to visit and weather notes
5. Essential packing list for this trip
6. Top travel tips and local customs

Format the response using clear headings and bullet points. Be specific and practical.`;
}

export default router;
