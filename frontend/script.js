/**
 * AI Travel Planner — Frontend Script
 * Communicates with the Express backend at /chat
 * Works in both live (IBM watsonx.ai) and demo (mock) modes
 */

const API_BASE = window.location.port === "5500" || window.location.protocol === "file:"
  ? "http://localhost:5000"   // Live Server / file:// dev mode
  : "";                        // Same origin when served by Express

// ── DOM refs ──────────────────────────────────────────────────────────────────
const destinationInput = document.getElementById("destination");
const daysInput        = document.getElementById("days");
const travelStyleSel   = document.getElementById("travelStyle");
const freeMessageTA    = document.getElementById("freeMessage");
const generateBtn      = document.getElementById("generateBtn");
const generateBtnText  = document.getElementById("generateBtnText");
const generateSpinner  = document.getElementById("generateSpinner");
const resultBody       = document.getElementById("resultBody");
const resultTitle      = document.getElementById("resultTitle");
const resultSubtitle   = document.getElementById("resultSubtitle");
const aiBadge          = document.getElementById("aiBadge");
const copyBtn          = document.getElementById("copyBtn");
const newPlanBtn       = document.getElementById("newPlanBtn");
const statusBadge      = document.getElementById("statusBadge");
const chatBox          = document.getElementById("chatBox");
const chatInput        = document.getElementById("chatInput");
const chatSendBtn      = document.getElementById("chatSendBtn");
const stepsBar         = document.getElementById("stepsBar");
const step1            = document.getElementById("step1");
const step2            = document.getElementById("step2");
const step3            = document.getElementById("step3");
const toStep2Btn       = document.getElementById("toStep2Btn");
const toStep1Btn       = document.getElementById("toStep1Btn");

// ── State ─────────────────────────────────────────────────────────────────────
let currentStep   = 1;
let lastRawPlan   = "";
let isLiveMode    = false;

// ── On load: health check ─────────────────────────────────────────────────────
(async function init() {
  try {
    const res  = await fetch(`${API_BASE}/health`);
    const data = await res.json();
    isLiveMode = data.watsonxConfigured === true;

    if (isLiveMode) {
      statusBadge.textContent = "🟢 IBM watsonx.ai Live";
      statusBadge.className   = "badge badge--connected";
    } else {
      statusBadge.textContent = "🟡 Demo Mode";
      statusBadge.className   = "badge badge--demo";
    }
  } catch {
    statusBadge.textContent = "🔴 Backend offline";
    statusBadge.className   = "badge";
  }

  // Show chat placeholder
  chatBox.innerHTML = '<p class="chat-placeholder">Ask any travel question…</p>';
})();

// ── Step navigation ───────────────────────────────────────────────────────────
function goToStep(n) {
  [step1, step2, step3].forEach((el, i) => el.classList.toggle("hidden", i + 1 !== n));
  stepsBar.querySelectorAll(".step").forEach((el, i) => {
    el.classList.toggle("active", i + 1 === n);
    el.classList.toggle("done",   i + 1 < n);
  });
  currentStep = n;
}

toStep2Btn.addEventListener("click", () => {
  if (!destinationInput.value.trim()) {
    shake(destinationInput);
    destinationInput.focus();
    return;
  }
  goToStep(2);
});

toStep1Btn.addEventListener("click", () => goToStep(1));

newPlanBtn.addEventListener("click", () => goToStep(1));

// ── Interest chips ────────────────────────────────────────────────────────────
document.querySelectorAll(".chip").forEach(chip => {
  chip.addEventListener("click", () => chip.classList.toggle("active"));
});

// ── Budget radio cards ────────────────────────────────────────────────────────
document.querySelectorAll(".budget-card").forEach(card => {
  card.addEventListener("click", () => {
    document.querySelectorAll(".budget-card").forEach(c => c.classList.remove("selected"));
    card.classList.add("selected");
    card.querySelector("input[type=radio]").checked = true;
  });
});

// ── Generate plan ─────────────────────────────────────────────────────────────
generateBtn.addEventListener("click", async () => {
  await generatePlan();
});

async function generatePlan() {
  const destination  = destinationInput.value.trim();
  const days         = parseInt(daysInput.value) || 5;
  const travelStyle  = travelStyleSel.value;
  const interests    = [...document.querySelectorAll(".chip.active")].map(c => c.dataset.value);
  const budget       = document.querySelector("input[name=budget]:checked")?.value || "moderate";
  const freeMessage  = freeMessageTA.value.trim();

  // Loading state
  setGenerating(true);

  try {
    const body = freeMessage
      ? { message: freeMessage, destination }
      : { destination, days, budget, interests, travelStyle };

    const res  = await fetch(`${API_BASE}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      throw new Error(data.error || "Server error — please try again.");
    }

    lastRawPlan = data.plan;
    renderResult(destination, days, data.plan);
    goToStep(3);

  } catch (err) {
    showInlineError(step2, err.message);
  } finally {
    setGenerating(false);
  }
}

function renderResult(destination, days, plan) {
  resultTitle.textContent    = `${destination} — ${days}-Day Plan`;
  resultSubtitle.textContent = isLiveMode
    ? "Generated live by IBM watsonx.ai · Granite 3.3"
    : "Demo plan · Add IBM credentials for personalised AI results";

  aiBadge.className   = isLiveMode ? "ai-badge ai-badge--live" : "ai-badge ai-badge--demo";
  aiBadge.textContent = isLiveMode ? "🟢 IBM watsonx.ai Live" : "🟡 Demo Mode";

  resultBody.innerHTML = markdownToHtml(plan);
  resultBody.classList.add("fade-in");
}

// ── Copy ──────────────────────────────────────────────────────────────────────
copyBtn.addEventListener("click", async () => {
  if (!lastRawPlan) return;
  try {
    await navigator.clipboard.writeText(lastRawPlan);
    copyBtn.textContent = "✅ Copied!";
    setTimeout(() => (copyBtn.textContent = "📋 Copy"), 2000);
  } catch {
    copyBtn.textContent = "❌ Failed";
    setTimeout(() => (copyBtn.textContent = "📋 Copy"), 2000);
  }
});

// ── Chat widget ───────────────────────────────────────────────────────────────
chatSendBtn.addEventListener("click", sendChat);
chatInput.addEventListener("keydown", e => { if (e.key === "Enter") sendChat(); });

async function sendChat() {
  const msg = chatInput.value.trim();
  if (!msg) return;

  chatInput.value = "";
  appendChatBubble("user", msg);
  chatSendBtn.disabled = true;

  const typingBubble = appendChatBubble("ai", "…");

  try {
    const res  = await fetch(`${API_BASE}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg }),
    });
    const data = await res.json();

    if (!res.ok || data.error) throw new Error(data.error || "Server error");

    typingBubble.innerHTML = simpleMarkdown(data.plan);
  } catch (err) {
    typingBubble.className = "chat-bubble error";
    typingBubble.textContent = "⚠️ " + err.message;
  } finally {
    chatSendBtn.disabled = false;
    chatBox.scrollTop = chatBox.scrollHeight;
  }
}

function appendChatBubble(role, text) {
  // Remove placeholder if present
  const placeholder = chatBox.querySelector(".chat-placeholder");
  if (placeholder) placeholder.remove();

  const bubble = document.createElement("div");
  bubble.className = `chat-bubble ${role} fade-in`;
  bubble.textContent = text;
  chatBox.appendChild(bubble);
  chatBox.scrollTop = chatBox.scrollHeight;
  return bubble;
}

// ── Markdown → HTML (lightweight) ────────────────────────────────────────────
function markdownToHtml(text) {
  // Escape
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Tables
  html = html.replace(/^\|(.+)\|$/gm, (line) => {
    if (/^[\|\s\-:]+$/.test(line)) return "TABLE_DIVIDER";
    const cells = line.split("|").filter(Boolean).map(c => c.trim());
    return `<tr>${cells.map(c => `<td>${c}</td>`).join("")}</tr>`;
  });
  html = html.replace(/((<tr>.*<\/tr>\n?)+)/g, (m) => {
    const rows  = m.split("\n").filter(r => r.includes("<tr>"));
    const first = rows.shift().replace(/<td>/g, "<th>").replace(/<\/td>/g, "</th>");
    return `<table>${first}${rows.join("")}</table>`;
  });
  html = html.replace(/TABLE_DIVIDER\n?/g, "");

  // Headings
  html = html
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm,  "<h3>$1</h3>")
    .replace(/^# (.+)$/gm,   "<h3>$1</h3>");

  // Bold + italic
  html = html
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g,     "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g,         "<em>$1</em>");

  // HR
  html = html.replace(/^---+$/gm, "<hr />");

  // Lists
  html = html.replace(/^[-*] (.+)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>\n?)+/g, m => `<ul>${m}</ul>`);

  // Numbered lists
  html = html.replace(/^\d+\. (.+)$/gm, "<li>$1</li>");

  // Paragraphs (blank-line separated)
  html = html.replace(/\n{2,}/g, "</p><p>");
  html = `<p>${html}</p>`;

  // Clean up empty/spurious tags
  html = html
    .replace(/<p>\s*(<h[234]>)/g, "$1")
    .replace(/(<\/h[234]>)\s*<\/p>/g, "$1")
    .replace(/<p>\s*(<ul>)/g, "$1")
    .replace(/(<\/ul>)\s*<\/p>/g, "$1")
    .replace(/<p>\s*(<table>)/g, "$1")
    .replace(/(<\/table>)\s*<\/p>/g, "$1")
    .replace(/<p>\s*(<hr)/g, "$1")
    .replace(/(<hr[^>]*>)\s*<\/p>/g, "$1")
    .replace(/<p>\s*<\/p>/g, "");

  return html;
}

// Simple inline markdown for chat bubbles
function simpleMarkdown(text) {
  return text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br>");
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function setGenerating(loading) {
  generateBtn.disabled   = loading;
  generateBtnText.classList.toggle("hidden", loading);
  generateSpinner.classList.toggle("hidden", !loading);
  if (loading) generateBtnText.textContent = "Generating…";
  else         generateBtnText.textContent = "🤖 Generate My Plan";
}

function showInlineError(container, message) {
  let el = container.querySelector(".inline-error");
  if (!el) {
    el = document.createElement("p");
    el.className = "inline-error";
    el.style.cssText = "color:#b91c1c;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px 14px;font-size:13px;margin-top:12px;";
    container.appendChild(el);
  }
  el.textContent = "⚠️ " + message;
  setTimeout(() => el.remove(), 6000);
}

function shake(el) {
  el.style.animation = "none";
  el.offsetHeight; // reflow
  el.style.animation = "shake .35s ease";
  setTimeout(() => (el.style.animation = ""), 350);
}

// Inject shake keyframes
const shakeStyle = document.createElement("style");
shakeStyle.textContent = `@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-5px)}40%,80%{transform:translateX(5px)}}`;
document.head.appendChild(shakeStyle);
