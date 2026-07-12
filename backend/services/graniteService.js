import axios from "axios";

const IAM_URL = "https://iam.cloud.ibm.com/identity/token";

/**
 * Fetches an IBM Cloud IAM access token using the API key stored in .env.
 * Returns null if the key is missing or the request fails (triggers mock mode).
 */
export async function getAccessToken() {
  const apiKey = process.env.IBM_API_KEY;
  if (!apiKey || apiKey === "your_ibm_api_key_here") return null;

  try {
    const response = await axios.post(
      IAM_URL,
      new URLSearchParams({
        grant_type: "urn:ibm:params:oauth:grant-type:apikey",
        apikey: apiKey,
      }),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: 10000,
      }
    );
    return response.data.access_token;
  } catch (err) {
    console.warn("[IBM IAM] Token fetch failed — switching to mock mode:", err.message);
    return null;
  }
}

/**
 * Calls IBM watsonx.ai (Granite 3.3 8b Instruct) with the given prompt.
 * Falls back to a rich mock response when the service is unavailable.
 *
 * @param {string} prompt  The full prompt to send
 * @returns {string}       The AI-generated text
 */
export async function generateTravelPlan(prompt) {
  const accessToken = await getAccessToken();

  // ── Live IBM watsonx.ai call ──────────────────────────────────────────────
  if (accessToken) {
    try {
      const response = await axios.post(
        `${process.env.IBM_URL}/ml/v1/text/generation?version=2024-05-31`,
        {
          model_id: "ibm/granite-3-3-8b-instruct",
          project_id: process.env.PROJECT_ID,
          input: prompt,
          parameters: {
            decoding_method: "greedy",
            max_new_tokens: 900,
            stop_sequences: ["<END>"],
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        }
      );
      const result = response.data?.results?.[0]?.generated_text ?? "";
      if (result.trim()) return result.trim();
    } catch (err) {
      console.warn("[watsonx.ai] Generation failed — switching to mock mode:", err.message);
    }
  }

  // ── Mock fallback ─────────────────────────────────────────────────────────
  return buildMockResponse(prompt);
}

function buildMockResponse(prompt) {
  // Extract destination hint from prompt for a slightly personalised mock
  const destMatch = prompt.match(/destination[:\s]+([^\n,\.]+)/i) ||
                    prompt.match(/trip to ([^\n,\.]+)/i) ||
                    prompt.match(/visit ([^\n,\.]+)/i);
  const dest = destMatch ? destMatch[1].trim() : "your chosen destination";

  return `✈️  **AI Travel Plan for ${dest}** *(demo mode — connect IBM watsonx.ai for live plans)*

---

### 🗓️ Day-by-Day Itinerary

**Day 1 — Arrival & Orientation**
- Check in to your hotel and freshen up.
- Take a leisurely evening walk through the city centre.
- Dinner at a highly-rated local restaurant. Try the regional speciality!

**Day 2 — Cultural Highlights**
- Morning: Visit the main historical museum or landmark.
- Afternoon: Explore the old town / heritage quarter on foot.
- Evening: Sunset rooftop bar or harbour-front dinner.

**Day 3 — Nature & Adventure**
- Half-day guided nature tour or day trip to a nearby natural wonder.
- Afternoon: Free time for souvenir shopping at local markets.
- Evening: Live local music or a cooking class experience.

**Day 4 — Hidden Gems**
- Morning: Off-the-beaten-path neighbourhood walk.
- Afternoon: Art gallery, botanical garden, or craft brewery tour.
- Evening: Farewell dinner with a panoramic view.

**Day 5 — Departure**
- Leisurely breakfast at a neighbourhood café.
- Last-minute shopping or a quick revisit to your favourite spot.
- Head to the airport / station.

---

### 💰 Estimated Budget Breakdown
| Category | Estimated Cost |
|---|---|
| Flights (return) | $400 – $800 |
| Accommodation (4 nights) | $300 – $600 |
| Food & Drinks | $150 – $300 |
| Activities & Entry Fees | $80 – $150 |
| Local Transport | $40 – $80 |
| **Total** | **$970 – $1,930** |

---

### 🌦️ Best Time to Visit
Spring (Apr–Jun) and autumn (Sep–Nov) typically offer the best weather and fewer crowds.

### 🧳 Packing Essentials
Comfortable walking shoes · Layers for evenings · Power adapter · Travel insurance docs · Camera

### 🚨 Travel Tips
- Book popular attractions in advance to skip queues.
- Use public transport apps for real-time schedules.
- Notify your bank before departure to avoid card blocks.
- Keep digital and physical copies of your passport.

---
*This plan was generated in demo mode. Add your IBM watsonx.ai credentials to \`.env\` for a fully personalised AI plan.*`;
}
