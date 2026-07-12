import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import chatRoute from "./routes/chat.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Serve the static frontend from ../frontend
app.use(express.static(path.join(__dirname, "../frontend")));

// ── Routes ────────────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    watsonxConfigured: !!(
      process.env.IBM_API_KEY &&
      process.env.IBM_API_KEY !== "your_ibm_api_key_here" &&
      process.env.IBM_URL &&
      process.env.PROJECT_ID
    ),
    timestamp: new Date().toISOString(),
  });
});

app.use("/chat", chatRoute);

// Catch-all: serve frontend for any unmatched route (SPA support)
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅  Travel Planner backend running → http://localhost:${PORT}`);
  const configured =
    process.env.IBM_API_KEY && process.env.IBM_API_KEY !== "your_ibm_api_key_here";
  console.log(
    configured
      ? "🤖  IBM watsonx.ai: CONNECTED (live AI responses)"
      : "🔵  IBM watsonx.ai: not configured — using demo mode (mock responses)"
  );
});
