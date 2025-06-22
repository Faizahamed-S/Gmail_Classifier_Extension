// category order + pretty names
const cats = [
  ["applied","Applied","applied"],
  ["next round","Next Round","next"],
  ["interview/meet","Interview/Meet","interview"],
  ["job notification","Job Notification","job"],
  ["rejection","Rejection","rejection"],
  ["not important","Not Important","notimp"]
];

chrome.storage.local.get({aiCounts:{}}, ({aiCounts})=>{
  // counts list
  const wrap = document.getElementById("counts");
  wrap.innerHTML="";
  cats.forEach(([key,label,cls])=>{
    const div=document.createElement("div");
    div.innerHTML=`<span class="dot ${cls}"></span>${label}: ${aiCounts[key]||0}`;
    wrap.appendChild(div);
  });

  // bar chart
  const ctx=document.getElementById("chart");
  new Chart(ctx,{
    type:"bar",
    data:{
      labels:cats.map(c=>c[1]),
      datasets:[{
        data:cats.map(c=>aiCounts[c[0]]||0)
      }]
    },
    options:{
      plugins:{legend:{display:false}},
      scales:{y:{beginAtZero:true,ticks:{precision:0}}}
    }
  });
});