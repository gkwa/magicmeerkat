export async function waitForContentScript(tabId, maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await chrome.tabs.sendMessage(tabId, { action: "ping" })
      return true
    } catch (error) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }
  return false
}
