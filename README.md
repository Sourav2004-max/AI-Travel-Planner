# ✈️ AI Travel Planner — Powered by IBM watsonx.ai

A full-stack AI travel planning application that generates personalised day-by-day itineraries, budget breakdowns, and travel tips using **IBM watsonx.ai (Granite 3.3 8b Instruct)**.

> **Works out of the box** — if IBM credentials are not configured, the app automatically falls back to rich demo (mock) responses so you can explore the UI immediately.

---

## 🗂️ Project Structure

```
travelplanner/
├── backend/
│   ├── routes/
│   │   └── chat.js              # POST /chat — builds prompt & calls AI
│   ├── services/
│   │   └── graniteService.js    # IBM IAM auth + watsonx.ai call + mock fallback
│   ├── config/
│   │   └── ibmclient.js
│   ├── .env.example             # Copy to .env and fill in your credentials
│   ├── package.json
│   └── server.js                # Express server, serves static frontend
└── frontend/
    ├── index.html               # 3-step wizard UI
    ├── style.css                # Modern responsive styles
    └── script.js                # Wizard, AI call, markdown render, chat widget
```

---

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/ai-travel-planner.git
cd ai-travel-planner/travelplanner/backend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
```bash
cp .env.example .env
```

Edit `.env` with your IBM credentials:
```env
IBM_API_KEY=your_actual_api_key
IBM_URL=https://us-south.ml.cloud.ibm.com
PROJECT_ID=your_project_id
PORT=5000
```

> **Don't have credentials?** Skip this step — the app runs in demo mode automatically.

### 4. Start the server
```bash
npm start
```

Open **http://localhost:5000** in your browser.

---

## 🌐 How It Works

1. User fills in destination, duration, travel style, interests, and budget.
2. Frontend sends a `POST /chat` request to the Express backend.
3. Backend builds a structured prompt and calls IBM watsonx.ai.
4. If IBM is unavailable or not configured, a rich mock plan is returned instantly.
5. The response is rendered as formatted HTML with a built-in chat widget for follow-ups.

---

## 🔑 Getting IBM watsonx.ai Credentials

1. Sign up / log in at [IBM Cloud](https://cloud.ibm.com/)
2. Create a **watsonx.ai** project
3. Generate an **API key** from *Manage → Access (IAM)*
4. Copy your **Project ID** from the watsonx project settings
5. Note your **service URL** (e.g. `https://us-south.ml.cloud.ibm.com`)

---

## 📡 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Returns server status + whether watsonx.ai is configured |
| POST | `/chat` | Generates a travel plan (structured or free-form) |
| GET | `/*` | Serves the static frontend |

### POST `/chat` — body options

**Structured (wizard)**
```json
{
  "destination": "Tokyo, Japan",
  "days": 7,
  "budget": "moderate",
  "travelStyle": "couple",
  "interests": ["food", "culture", "history"]
}
```

**Free-form (chat)**
```json
{ "message": "Plan a 5-day trip to Lisbon for a solo budget traveller." }
```

---

## 🛡️ Security

- API credentials are stored in `.env` (never committed — see `.gitignore`).
- CORS is enabled for all origins in development; restrict in production.

---

## 🏗️ Deployment

The backend serves the frontend as static files, so only **one process** needs to run.

```bash
# Production
NODE_ENV=production npm start
```

Compatible with **Railway**, **Render**, **Heroku**, **IBM Code Engine**, and any Node.js host.

---

## 🧰 Tech Stack

| Layer | Tech |
|---|---|
| AI | IBM watsonx.ai · Granite 3.3 8b Instruct |
| Backend | Node.js · Express · Axios · dotenv |
| Frontend | Vanilla HTML/CSS/JS (no framework, no build step) |

---

*Made with ❤️ for IBM watsonx.ai*
