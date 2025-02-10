chrome.action.onClicked.addListener(async (tab) => {
  const result = await chrome.storage.local.get("uuid")
  if (result.uuid) {
    await savePage(result.uuid)
    await navigateToNextPage(tab.id)
  } else {
    console.error("No UUID found. Please post a business first.")
  }
})

async function navigateToNextPage(tabId) {
  try {
    const pageInfo = await chrome.tabs.sendMessage(tabId, { action: "getPageInfo" })
    if (!pageInfo) {
      console.error("Could not determine page information")
      return
    }

    console.log("Page info:", pageInfo)

    if (pageInfo.currentPage >= pageInfo.totalPages) {
      console.log("Reached last page, showing notification...")
      await chrome.tabs.sendMessage(tabId, {
        action: "showNotification",
        message: `Reached the last page (${pageInfo.currentPage} of ${pageInfo.totalPages})`,
      })
      return
    }

    const tab = await chrome.tabs.get(tabId)
    const url = new URL(tab.url)
    let start = parseInt(url.searchParams.get("start") || "0")
    start += 10
    url.searchParams.set("start", start.toString())
    await chrome.tabs.update(tabId, { url: url.toString() })
  } catch (error) {
    console.error("Error navigating to next page:", error)
  }
}

async function savePage(uuid) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    const now = new Date()
    const timestamp = now.toISOString()
    const mhtmlData = await chrome.pageCapture.saveAsMHTML({ tabId: tab.id })
    const base64Mhtml = await convertToBase64(mhtmlData)
    const payload = createPayload(tab, timestamp, now, uuid, base64Mhtml)
    await sendToServer(payload)
    console.log("Page data sent to server successfully")
  } catch (error) {
    console.error("Error sending page to server:", error)
    throw error
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
}

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
