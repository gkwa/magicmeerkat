import { logError } from "./errorHandler.js"

export async function savePage(uuid, tabId, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      if (typeof tabId !== "number" || tabId <= 0) {
        throw new Error(`Invalid tab ID: ${tabId}`)
      }

      const tab = await chrome.tabs.get(tabId)
      const now = new Date()
      const timestamp = now.toISOString()

      // Wait for page to be fully loaded
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Extract reviews content using content script
      const reviewsContent = await chrome.tabs.sendMessage(tabId, { action: "extractReviews" })
      if (!reviewsContent) {
        throw new Error("Failed to extract reviews content")
      }

      const payload = createPayload(tab, timestamp, now, uuid, reviewsContent)
      await sendToServer(payload)
      console.log("Reviews data sent to server successfully")
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

function createPayload(tab, timestamp, now, uuid, reviewsContent) {
  return {
    metadata: {
      url: tab.url,
      title: tab.title,
      timestamp: timestamp,
      savedAt: now.toLocaleString(),
      uuid: uuid,
    },
    content: {
      html: reviewsContent,
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
