/********************************************************************
 * Gmail-AI Classifier  – stable universal edition (22 Jun 2025)
 * • Pill badges in *every* Gmail view (hash-change handled)
 * • Global counts  (dedup by message-ID, persisted in storage)
 * • Popup chart updates in real-time via runtime messages
 ********************************************************************/

/* ---------- 1 | inject CSS once ------------------------------- */
(() => {
  if (document.getElementById("ai-badge-css")) return;
  const css = `
    .ai-badge{display:inline-block;padding:2px 6px;margin-left:8px;
      font:500 11px/14px Arial;border-radius:12px;color:#fff;user-select:none}
    .ai-applied{background:#1a73e8}.ai-next{background:#ff8c00}
    .ai-interview{background:#34a853}.ai-job{background:#a142f4}
    .ai-rejection{background:#ea4335}.ai-notimp{background:#5f6368}
    .ai-error{background:#9aa0a6}.ai-load{background:#5f6368;opacity:.6}`;
  Object.assign(document.head.appendChild(document.createElement("style")),
                { id:"ai-badge-css", textContent:css });
})();

/* ---------- 2 | helpers -------------------------------------- */
const MAP = {
  "applied"        : ["ai-applied",  "Applied"],
  "next round"     : ["ai-next",     "Next Round"],
  "interview/meet" : ["ai-interview","Interview/Meet"],
  "job notification":["ai-job",      "Job Notification"],
  "rejection"      : ["ai-rejection","Rejection"],
  "not important"  : ["ai-notimp",   "Not Important"]
};

let visitedRows     = new WeakSet();   // per-view dedup   // per-view dedup
let disposers       = [];              // stop observers on view change

/* ---------- 3 | global counter (dedup by message-ID) --------- */
function bump(cat,id){
  if (!id) return;
  chrome.storage.local.get({aiCounts:{}, aiSeenIDs:{}}, ({aiCounts,aiSeenIDs})=>{
    if (aiSeenIDs[id]) return;
    aiSeenIDs[id] = true;
    aiCounts[cat] = (aiCounts[cat] || 0) + 1;
    chrome.storage.local.set({aiCounts, aiSeenIDs}, () =>
      chrome.runtime.sendMessage({type:"aiCounts", aiCounts})
    );
  });
}

/* ---------- 4 | classify one row ----------------------------- */
async function classifyRow(row){
  if (visitedRows.has(row)) return;
  visitedRows.add(row);

  const subject = row.querySelector(".y6")?.innerText.trim();
  if (!subject) return;                     // text not ready yet

  // badge skeleton
  const pill = document.createElement("span");
  pill.className = "ai-badge ai-load";
  pill.textContent = "Classifying…";
  (row.querySelector(".y6 span:last-child") || row.querySelector(".y6"))
      ?.appendChild(pill);

  const mid = row.getAttribute("data-legacy-message-id") ||
              row.getAttribute("data-message-id")||         
        row.getAttribute("data-thread-id")        ||          
        (Date.now() + Math.random().toString(36));  

  try{
    const cat       = await classifyEmailWithAI(subject) || "";
    const key       = cat.toLowerCase();
    const [cls,lab] = MAP[key] || ["ai-error", cat || "Error"];
    pill.className  = `ai-badge ${cls}`;
    pill.textContent= lab;
    bump(key, mid);
 } catch (e) {
   pill.className  = "ai-badge ai-error";
   pill.textContent= "Error";
   console.error("[AI-Ext]", e);
 }
+ visitedRows.add(row);
}

/* ---------- 5 | start for one <div role="main"> -------------- */
function start(main){
  const io = new IntersectionObserver(
    es => es.forEach(e=>e.isIntersecting && classifyRow(e.target)),
    { root: main, threshold:0.01 }
  );

  main.querySelectorAll(".zA").forEach(r=>io.observe(r));

  const domObs = new MutationObserver(ms=>{
    ms.forEach(m=>m.addedNodes.forEach(n=>{
      if (n.nodeType===1 && n.classList.contains("zA")) io.observe(n);
    }));
  }).observe(main,{childList:true});

  const sweep = setInterval(()=>
    main.querySelectorAll(".zA").forEach(r=>classifyRow(r)), 3000);

  disposers.push(()=>{ io.disconnect(); domObs.disconnect(); clearInterval(sweep); });
  console.log("%c[AI-Ext] active in view →", "color:#34a853", location.hash||"(inbox)");
}

/* ---------- 6 | wait until the main container exists --------- */
function waitMain(cb){
  const ready = ()=>document.querySelector('div[role="main"]');
  if (ready()) return cb(ready());
  const mo = new MutationObserver(()=>{
    const m = ready(); if (m){ mo.disconnect(); cb(m); }
  });
  mo.observe(document.body,{childList:true,subtree:true});
}

/* ---------- 7 | handle view switches ------------------------- */
function reset(){
  disposers.forEach(fn=>fn()); disposers = [];
  visitedRows     = new WeakSet(); 
  waitMain(start);
}
window.addEventListener("hashchange", reset, false);

/* ---------- 8 | boot on first load --------------------------- */
waitMain(start);