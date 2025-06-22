/************* draw & update the chart *****************/
function render(aiCounts){
  const cats = [
    ["applied","Applied","applied"],
    ["next round","Next Round","next"],
    ["interview/meet","Interview/Meet","interview"],
    ["job notification","Job Notification","job"],
    ["rejection","Rejection","rejection"],
    ["not important","Not Important","notimp"]
  ];

  /* text list */
  const wrap = document.getElementById("counts");
  wrap.innerHTML = "";
  cats.forEach(([k,lbl,cls])=>{
    wrap.insertAdjacentHTML("beforeend",
      `<div><span class="dot ${cls}"></span>${lbl}: ${aiCounts[k]||0}</div>`);
  });

  /* bar chart */
  const ctx = document.getElementById("chart");
  if (window._aiChart) window._aiChart.destroy();

  window._aiChart = new Chart(ctx, {
    type:"bar",
    data:{
      labels: cats.map(c=>c[1]),
      datasets:[{ data: cats.map(c=>aiCounts[c[0]]||0) }]
    },
    options:{
      plugins:{ legend:{display:false} },
      scales :{ y:{ beginAtZero:true, ticks:{precision:0} } }
    }
  });
}

/* initial draw */
chrome.storage.local.get({aiCounts:{}}, ({aiCounts})=>render(aiCounts));

/* live updates */
chrome.runtime.onMessage.addListener(msg=>{
  if (msg.type==="aiCounts") render(msg.aiCounts);
});