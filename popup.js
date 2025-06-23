/* helper that draws the list + chart ---------------- */
function render(aiCounts) {
  const cats = [
    ["applied","Applied","applied"],
    ["next round","Next Round","next"],
    ["interview/meet","Interview/Meet","interview"],
    ["job notification","Job Notification","job"],
    ["rejection","Rejection","rejection"],
    ["not important","Not Important","notimp"]
  ];

  // text list
  const wrap = document.getElementById("counts");
  wrap.innerHTML = "";
  cats.forEach(([key,label,cls]) => {
    const div = document.createElement("div");
    div.innerHTML =
      `<span class="dot ${cls}"></span>${label}: ${aiCounts[key] || 0}`;
    wrap.appendChild(div);
  });

  // bar chart
  const ctx = document.getElementById("chart");
  if (window._aiChart) window._aiChart.destroy();

  window._aiChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: cats.map(c => c[1]),
      datasets: [{
        data: cats.map(c => aiCounts[c[0]] || 0),
        backgroundColor: cats.map(c => getColor(c[0]))
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales : { y: { beginAtZero: true, ticks:{ precision:0 } } }
    }
  });
}

/* keep colours in sync with pills */
function getColor(key){
  switch(key){
    case "applied":        return "#1a73e8";
    case "next round":     return "#ff8c00";
    case "interview/meet": return "#34a853";
    case "job notification":return "#a142f4";
    case "rejection":      return "#ea4335";
    default:               return "#5f6368";
  }
}

/* first load */
chrome.storage.local.get({ aiCounts:{} }, ({ aiCounts }) => render(aiCounts));

/* live updates */
chrome.runtime.onMessage.addListener(msg => {
  if (msg.type === "aiCounts") render(msg.aiCounts);
});