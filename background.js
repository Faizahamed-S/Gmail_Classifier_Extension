/* empty service-worker – keeps the extension awake for runtime messages */
chrome.runtime.onInstalled.addListener(() => {
  console.log("[AI-Ext] installed");
});