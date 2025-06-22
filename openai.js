/****************  AI back-end wrapper  ****************/
const API = "https://0ef2a5c0-404a-44c0-984c-6234fb809245-00-pmmlq4lg7syr.riker.replit.dev/classify";

const QUEUE  = [];          // FIFO queue
const LIMIT  = 2;           // max parallel fetches
let   active = 0;

function pump() {
  if (active >= LIMIT || !QUEUE.length) return;

  const job = QUEUE.shift();
  active++;

  fetch(API, {
    method : "POST",
    headers: { "Content-Type": "application/json" },
    body   : JSON.stringify({ email: job.text })
  })
    .then(r => r.ok ? r.json() : Promise.reject("HTTP " + r.status))
    .then(j => job.res(j.category?.trim() || ""))
    .catch(err => {
      if (++job.retries <= 3) {                     // simple back-off
        setTimeout(() => { QUEUE.unshift(job); pump(); }, 1500 * job.retries);
      } else { job.rej(err); }
    })
    .finally(() => { active--; pump(); });
}

function classifyEmailWithAI(text) {
  return new Promise((res, rej) => {
    QUEUE.push({ text, res, rej, retries: 0 });
    pump();
  });
}
window.classifyEmailWithAI = classifyEmailWithAI;   // expose to content.js