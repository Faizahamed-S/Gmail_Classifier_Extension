/********************************************************************
 * Gmail-AI Classifier – resilient version  ✨ 2025-06-22
 * • Pill badges + per-category counts
 * • Deduplicate by DOM element (WeakSet) – works in every Gmail view
 * • IntersectionObserver + 3 s sweep fallback
 ********************************************************************/

/* ---------- 1. Inject pill-badge CSS once -------------------- */
(function addStyles () {
  if (document.getElementById('ai-badge-style')) return;
  const s = document.createElement('style');
  s.id = 'ai-badge-style';
  s.textContent = `
    .ai-badge{display:inline-block;padding:2px 6px;margin-left:8px;
      font:500 11px/14px Arial;border-radius:12px;color:#fff;user-select:none}
    .ai-applied{background:#1a73e8}.ai-next{background:#ff8c00}
    .ai-interview{background:#34a853}.ai-job{background:#a142f4}
    .ai-rejection{background:#ea4335}.ai-notimp{background:#5f6368}
    .ai-error{background:#9aa0a6}.ai-load{background:#5f6368;opacity:.6}
  `;
  document.head.appendChild(s);
  console.log('%c[AI-Ext] CSS injected','color:#34a853');
})();

/* ---------- 2. Helpers --------------------------------------- */
const MAP = {
  'applied'        : ['ai-applied',  'Applied'],
  'next round'     : ['ai-next',     'Next Round'],
  'interview/meet' : ['ai-interview','Interview/Meet'],
  'job notification':['ai-job',      'Job Notification'],
  'rejection'      : ['ai-rejection','Rejection'],
  'not important'  : ['ai-notimp',   'Not Important']
};
const visitedRows = new WeakSet();   // <-- new dedup mechanism

/* ---------- 3. Classify one row ------------------------------ */
async function classifyRow (row) {
  if (visitedRows.has(row)) return;      // skip if already processed
  visitedRows.add(row);                  // mark as processed

  const preview = row.querySelector('.y6')?.innerText || '';
  if (!preview.trim()) return;

  // badge skeleton
  const badge = document.createElement('span');
  badge.className = 'ai-badge ai-load';
  badge.textContent = 'Classifying…';

  // anchor → last span in .y6 (covers all Gmail layouts)
  const anchor = row.querySelector('.y6 span:last-child') || row.querySelector('.y6');
  anchor?.appendChild(badge);

  try {
    const category = await classifyEmailWithAI(preview);
    if (!category) throw new Error('empty');

    const key = category.toLowerCase();
    const [cls, txt] = MAP[key] || ['ai-error', category];

    badge.className = `ai-badge ${cls}`;
    badge.textContent = txt;

    updateCounts(key);
  } catch (err) {
    badge.className = 'ai-badge ai-error';
    badge.textContent = 'Error';
    console.error('[AI-Ext] classify error:', err);
  }
}

/* ---------- 4. Update dashboard counts ----------------------- */
function updateCounts (cat) {
  chrome.storage.local.get({ aiCounts:{} }, ({ aiCounts }) => {
    aiCounts[cat] = (aiCounts[cat] || 0) + 1;
    chrome.storage.local.set({ aiCounts });
  });
}

/* ---------- 5. Wait for Gmail to finish building DOM --------- */
function whenMainReady (cb) {
  const tryMain = () => document.querySelector('div[role="main"]');
  const main = tryMain();
  if (main) { cb(main); return; }

  const mo = new MutationObserver(() => {
    const m = tryMain();
    if (m) { mo.disconnect(); cb(m); }
  });
  mo.observe(document.body, { childList:true, subtree:true });
}

/* ---------- 6. Kick-off logic ------------------------------- */
whenMainReady(main => {
  console.log('%c[AI-Ext] Main container ready','color:#34a853');

  /* (a) IntersectionObserver for smooth scrolling */
  const io = new IntersectionObserver(
    ents => ents.forEach(e => { if (e.isIntersecting) classifyRow(e.target); }),
    { root: main, threshold: 0.01 }   // 1 % visible is enough
  );

  /* (b) Observe rows already in DOM */
  main.querySelectorAll('.zA').forEach(r => io.observe(r));

  /* (c) Watch for new rows Gmail adds */
  new MutationObserver(muts => {
    muts.forEach(m => m.addedNodes.forEach(n => {
      if (n.nodeType === 1 && n.classList.contains('zA')) io.observe(n);
    }));
  }).observe(main, { childList:true });

  /* (d) Fallback sweep every 3 s (covers rows missed by IO) */
  setInterval(() => {
    main.querySelectorAll('.zA').forEach(r => classifyRow(r));
  }, 3000);
});