async function waitForContentScript(tabId, maxAttempts = 10) {
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

let errorLog = []
function logError(error, context = "") {
  const errorEntry = {
    message: error.message || error,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  }
  errorLog.push(errorEntry)
  console.error(`[${context}]`, error)
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "showError",
        error: errorEntry,
      })
    }
  })
}

function getRandomDelay(min = 2000, max = 5000) {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

chrome.action.onClicked.addListener(async (tab) => {
  const result = await chrome.storage.local.get(["uuid", "isProcessing"])
  if (!result.uuid) {
    logError("No UUID found. Please post a business first.", "initialization")
    return
  }
  if (result.isProcessing) {
    console.log("Already processing pages, stopping...")
    await chrome.storage.local.set({ isProcessing: false })
    return
  }
  console.log("Starting automated processing...")
  await chrome.storage.local.set({ isProcessing: true, isFirstPage: true })
  await processNextPage(tab.id)
})

async function processNextPage(tabId) {
  try {
    const status = await chrome.storage.local.get(["isProcessing", "isFirstPage"])
    if (!status.isProcessing) return
    // Consistent initial load delay: 3 seconds
    await new Promise((resolve) => setTimeout(resolve, 3000))
    const isContentScriptReady = await waitForContentScript(tabId)
    if (!isContentScriptReady) {
      throw new Error("Content script not ready after maximum attempts")
    }
    const pageInfo = await getPageInfoWithRetry(tabId, 3, 1000)
    if (!pageInfo) {
      logError("Could not determine page information", "pageInfo")
      await chrome.storage.local.set({ isProcessing: false })
      return
    }
    await chrome.tabs.sendMessage(tabId, {
      action: "showNotification",
      message: `Viewing page ${pageInfo.currentPage} of ${pageInfo.totalPages}`,
    })
    const result = await chrome.storage.local.get("uuid")
    await savePage(result.uuid, tabId)
    if (pageInfo.currentPage >= pageInfo.totalPages) {
      await chrome.tabs.sendMessage(tabId, {
        action: "showNotification",
        message: `Completed processing all pages (${pageInfo.currentPage} of ${pageInfo.totalPages})`,
      })
      await chrome.storage.local.set({ isProcessing: false })
      return
    }
    // Consistent delay between pages: 3-5 seconds
    const delay = getRandomDelay(3000, 5000)
    await new Promise((resolve) => setTimeout(resolve, delay))
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
    await processNextPage(tabId)
  } catch (error) {
    logError(error, "processNextPage")
    await chrome.storage.local.set({ isProcessing: false })
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

async function savePage(uuid, tabId, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      if (typeof tabId !== "number" || tabId <= 0) {
        throw new Error(`Invalid tab ID: ${tabId}`)
      }

      const tab = await chrome.tabs.get(tabId)
      const now = new Date()
      const timestamp = now.toISOString()
      // Consistent delay before saving: 2 seconds
      await new Promise((resolve) => setTimeout(resolve, 2000))
      const mhtmlData = await chrome.pageCapture.saveAsMHTML({ tabId: tabId })
      if (!mhtmlData) throw new Error("Failed to generate MHTML")
      const base64Mhtml = await convertToBase64(mhtmlData)
      const payload = createPayload(tab, timestamp, now, uuid, base64Mhtml)
      await sendToServer(payload)
      console.log("Page data sent to server successfully")
      return
    } catch (error) {
      if (i === maxRetries - 1) {
        logError(error, "savePage")
        throw error
      }
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }
}

async function convertToBase64(mhtmlData) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => {
      const base64Data = reader.result.split(",")[1]
      resolve(base64Data)
    }
    reader.readAsDataURL(mhtmlData)
  })
}

function createPayload(tab, timestamp, now, uuid, base64Mhtml) {
  return {
    metadata: {
      url: tab.url,
      title: tab.title,
      timestamp: timestamp,
      savedAt: now.toLocaleString(),
      uuid: uuid,
    },
    content: {
      encoding: "base64",
      mimeType: "application/x-mimearchive",
      data: base64Mhtml,
    },
  }
}

async function sendToServer(payload) {
  try {
    const response = await fetch("http://localhost:8080/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
  } catch (error) {
    logError(error, "sendToServer")
    throw error
  }
}

chrome.commands.onCommand.addListener(async (command) => {
  if (command === "_execute_action") {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    const result = await chrome.storage.local.get(["uuid", "isProcessing"])
    if (result.uuid && !result.isProcessing) {
      await chrome.storage.local.set({ isProcessing: true })
      await processNextPage(tab.id)
    }
  }
})
