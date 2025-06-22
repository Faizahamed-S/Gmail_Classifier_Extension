// ─── Inject Gmail-style pill badge CSS ─────────────────────────────────────────
(function addAIBadgeStyles() {
  if (document.getElementById("ai-badge-style")) return; // already added
  const style = document.createElement("style");
  style.id = "ai-badge-style";
  style.textContent = `
    .ai-badge{
      display:inline-block;
      padding:2px 6px;
      margin-left:8px;
      font-size:11px;
      font-weight:500;
      border-radius:12px;
      color:#fff;
      user-select:none;
    }
    .ai-applied       { background:#1a73e8; }  /* blue   */
    .ai-next-round    { background:#ff8c00; }  /* orange */
    .ai-interview     { background:#34a853; }  /* green  */
    .ai-job           { background:#a142f4; }  /* purple */
    .ai-rejection     { background:#ea4335; }  /* red    */
    .ai-not-important { background:#5f6368; }  /* gray   */
    .ai-error         { background:#9aa0a6; }
    .ai-loading       { background:#5f6368; opacity:0.6; }
  `;
  document.head.appendChild(style);
})();

// ─── Main loop: attach / update labels ─────────────────────────────────────────
async function insertLabel() {
  const rows = document.querySelectorAll("div[role='main'] .zA");

  rows.forEach(async row => {
    // skip if already labeled
    if (row.querySelector(".ai-badge")) return;

    const preview = row.querySelector(".y6")?.innerText || "";
    const badge   = document.createElement("span");
    badge.className = "ai-badge ai-loading";
    badge.textContent = "Classifying…";
    row.querySelector(".y6")?.append(badge);

    try {
      const category = await classifyEmailWithAI(preview);

      if (!category) throw new Error("empty");

      // map category → [class,text]
      const map = {
        "applied":        ["ai-applied","Applied"],
        "next round":     ["ai-next-round","Next Round"],
        "interview/meet": ["ai-interview","Interview/Meet"],
        "job notification":["ai-job","Job Notification"],
        "rejection":      ["ai-rejection","Rejection"],
        "not important":  ["ai-not-important","Not Important"]
      };

      const key = category.toLowerCase();
      const [cls,text] = map[key] || ["ai-error",category];

      badge.className = `ai-badge ${cls}`;
      badge.textContent = text;

    } catch (err) {
      badge.className = "ai-badge ai-error";
      badge.textContent = "Error";
      console.error("AI Classification Error:", err);
    }
  });
}

// run every 3 s to catch new/loaded rows
setInterval(insertLabel, 3000);