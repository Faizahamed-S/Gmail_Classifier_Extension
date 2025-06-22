async function insertLabel() {
  const emailItems = document.querySelectorAll("div[role='main'] .zA");

  emailItems.forEach(async (item) => {
    if (!item.querySelector('.ai-label')) {
      const preview = item.querySelector(".y6")?.innerText || "";
      const label = document.createElement("span");
      label.textContent = "🔍 Classifying...";
      label.className = "ai-label";
      label.style.marginLeft = "10px";
      label.style.color = "blue";
      label.style.fontSize = "12px";
      item.querySelector(".y6")?.appendChild(label);

      try {
        const result = await classifyEmailWithAI(preview);

        if (!result || typeof result !== "string") {
          label.textContent = "⚠️ Failed";
          label.style.color = "gray";
          return;
        }

        label.textContent = `📌 ${result}`;
        label.style.color = getColor(result);
      } catch (e) {
        label.textContent = "⚠️ Error";
        label.style.color = "gray";
        console.error("AI Classification Error:", e);
      }
    }
  });
}

// Category colors
function getColor(category) {
  switch (category.toLowerCase()) {
    case "applied": return "blue";
    case "next round": return "orange";
    case "interview/meet": return "green";
    case "job notification": return "purple";
    case "rejection": return "red";
    case "not important": return "gray";
    default: return "black";
  }
}

// Run every 3 seconds
setInterval(insertLabel, 3000);