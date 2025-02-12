export async function waitForContentScript(tabId, maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await chrome.tabs.sendMessage(tabId, { action: "ping" })
      if (response && response.status === "ready") {
        return true
      }
    } catch (error) {
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }
  return false
}
