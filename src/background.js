import { navigateToNextPage } from "./background/navigation.js"
import { savePage } from "./background/page_capture.js"

chrome.action.onClicked.addListener(async (tab) => {
  const result = await chrome.storage.local.get("uuid")
  if (result.uuid) {
    await savePage(result.uuid)
    await navigateToNextPage(tab.id)
  } else {
    console.error("No UUID found. Please post a business first.")
  }
})

// Handle keyboard shortcut
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "_execute_action") {
    const result = await chrome.storage.local.get("uuid")
    if (result.uuid) {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      await savePage(result.uuid)
      await navigateToNextPage(tab.id)
    }
  }
})
