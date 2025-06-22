function insertLabel() {
  const emailItems = document.querySelectorAll("div[role='main'] .zA");

  emailItems.forEach((item) => {
    if (!item.querySelector('.ai-label')) {
      const label = document.createElement("span");
      label.textContent = "🔍 Classifying...";
      label.className = "ai-label";
      label.style.marginLeft = "10px";
      label.style.color = "blue";
      label.style.fontSize = "12px";
      item.querySelector(".y6")?.appendChild(label);
    }
  });
}

// Wait for Gmail to load content
setInterval(insertLabel, 2000);