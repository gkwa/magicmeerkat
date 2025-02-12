import { logError } from "./errorHandler.js"
import { getStorageData, setStorageData } from "./storageManager.js"
import { waitForContentScript } from "./contentScriptManager.js"
import { savePage } from "./saveManager.js"
import { getRandomDelay } from "./utils.js"

export async function processNextPage(tabId) {
  try {
    const { isProcessing, isFirstPage } = await getStorageData(["isProcessing", "isFirstPage"])
    if (!isProcessing) return

    const isContentScriptReady = await waitForContentScript(tabId)
    if (!isContentScriptReady) {
      throw new Error("Content script not ready after maximum attempts")
    }

    const pageInfo = await getPageInfoWithRetry(tabId, 5, 500)
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

    const delay = getRandomDelay(500, 1500)
    await new Promise((resolve) => setTimeout(resolve, delay))

    await updateTabURL(tabId)
    await processNextPage(tabId)
  } catch (error) {
    logError(error, "processNextPage")
    await setStorageData({ isProcessing: false })
  }
}

async function getPageInfoWithRetry(tabId, maxRetries = 5, delay = 500) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const pageInfo = await chrome.tabs.sendMessage(tabId, { action: "getPageInfo" })
      if (pageInfo && pageInfo.currentPage && pageInfo.totalPages) {
        return pageInfo
      }
      await new Promise((resolve) => setTimeout(resolve, delay))
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

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener)
      resolve()
    }, 5000)

    const listener = async (updatedTabId, changeInfo) => {
      if (updatedTabId === tabId && changeInfo.status === "complete") {
        let attempts = 0
        while (attempts < 10) {
          try {
            const pageInfo = await chrome.tabs.sendMessage(tabId, { action: "getPageInfo" })
            if (pageInfo && pageInfo.currentPage && pageInfo.totalPages) {
              chrome.tabs.onUpdated.removeListener(listener)
              clearTimeout(timeout)
              resolve()
              return
            }
          } catch (error) {
            // Continue trying if error
          }
          attempts++
          await new Promise((resolve) => setTimeout(resolve, 200))
        }
        resolve()
      }
    }
    chrome.tabs.onUpdated.addListener(listener)
  })
}
