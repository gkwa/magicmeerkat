import { logError } from "./errorHandler.js"
import { getStorageData, setStorageData } from "./storageManager.js"
import { waitForContentScript } from "./contentScriptManager.js"
import { savePage } from "./saveManager.js"
import { getRandomDelay } from "./utils.js"

export async function processNextPage(tabId) {
  try {
    const { isProcessing, isFirstPage } = await getStorageData(["isProcessing", "isFirstPage"])
    if (!isProcessing) return

    await new Promise((resolve) => setTimeout(resolve, 3000))

    const isContentScriptReady = await waitForContentScript(tabId)
    if (!isContentScriptReady) {
      throw new Error("Content script not ready after maximum attempts")
    }

    const pageInfo = await getPageInfoWithRetry(tabId, 3, 1000)
    if (!pageInfo) {
      logError("Could not determine page information", "pageInfo")
      await setStorageData({ isProcessing: false })
      return
    }

    await chrome.tabs.sendMessage(tabId, {
      action: "showNotification",
      message: `Viewing page ${pageInfo.currentPage} of ${pageInfo.totalPages}`,
    })

    const { uuid } = await getStorageData("uuid")
    await savePage(uuid, tabId)

    if (pageInfo.currentPage >= pageInfo.totalPages) {
      await chrome.tabs.sendMessage(tabId, {
        action: "showNotification",
        message: `Completed processing all pages (${pageInfo.currentPage} of ${pageInfo.totalPages})`,
      })
      await setStorageData({ isProcessing: false })
      return
    }

    const delay = getRandomDelay(3000, 5000)
    await new Promise((resolve) => setTimeout(resolve, delay))

    await updateTabURL(tabId)
    await processNextPage(tabId)
  } catch (error) {
    logError(error, "processNextPage")
    await setStorageData({ isProcessing: false })
  }
}

async function getPageInfoWithRetry(tabId, maxRetries = 3, delay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const pageInfo = await chrome.tabs.sendMessage(tabId, { action: "getPageInfo" })
      if (pageInfo) return pageInfo
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
  throw new Error("Failed to get page info after retries")
}

async function updateTabURL(tabId) {
  const tab = await chrome.tabs.get(tabId)
  const url = new URL(tab.url)
  url.searchParams.set("start", (parseInt(url.searchParams.get("start") || "0") + 10).toString())
  await chrome.tabs.update(tabId, { url: url.toString() })

  await new Promise((resolve) => {
    const listener = (updatedTabId, changeInfo) => {
      if (updatedTabId === tabId && changeInfo.status === "complete") {
        chrome.tabs.onUpdated.removeListener(listener)
        setTimeout(resolve, 2000)
      }
    }
    chrome.tabs.onUpdated.addListener(listener)
  })
}
