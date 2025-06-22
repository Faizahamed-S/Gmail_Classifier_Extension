const ENDPOINT = "https://0ef2a5c0-404a-44c0-984c-6234fb809245-00-pmmlq4lg7syr.riker.replit.dev/classify";

async function classifyEmailWithAI(emailText) {
  if (!emailText?.trim()) return null;

  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: emailText })
  });

  if (!response.ok) {
    console.error("❌ AI Classification Error:", response.status, await response.text());
    return null;
  }

  const data = await response.json();
  return data.category;   // <-- use 'category' not 'label'
}