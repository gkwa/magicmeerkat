export async function waitForContentScript(tabId, maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await chrome.tabs.sendMessage(tabId, { action: "ping" })
      if (response && response.status === "ready") {
        // Add a small delay after content script is ready
        await new Promise((resolve) => setTimeout(resolve, 500))
        return true
      }
    } catch (error) {
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }
  return false
}
