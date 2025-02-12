import { logError, initializeErrorHandling } from "./modules/errorHandler.js"
import { processNextPage } from "./modules/pageProcessor.js"
import { getStorageData, setStorageData } from "./modules/storageManager.js"

initializeErrorHandling()

chrome.action.onClicked.addListener(async (tab) => {
  const { uuid, isProcessing } = await getStorageData(["uuid", "isProcessing"])

  if (!uuid) {
    logError("No UUID found. Please post a business first.", "initialization")
    return
  }

  if (isProcessing) {
    console.log("Already processing pages, stopping...")
    await setStorageData({ isProcessing: false })
    return
  }

  console.log("Starting automated processing...")
  await setStorageData({ isProcessing: true, isFirstPage: true })
  await processNextPage(tab.id)
})

chrome.commands.onCommand.addListener(async (command) => {
  console.log("Command received:", command) // Moved to top of listener

  if (command === "_execute_action") {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    const { uuid, isProcessing } = await getStorageData(["uuid", "isProcessing"])

    if (uuid && !isProcessing) {
      await setStorageData({ isProcessing: true })
      await processNextPage(tab.id)
    }
  }

  if (command === "reload") {
    console.log("Reloading extension...") // Added additional logging
    chrome.runtime.reload()
  }
})
