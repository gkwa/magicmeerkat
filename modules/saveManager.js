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

      // Wait for content and check for reviews
      const reviews = await chrome.tabs.sendMessage(tabId, { action: "waitForPageContent" })
      if (!reviews) {
        console.log("No reviews section found on this page - skipping")
        return // Just skip this page instead of treating it as an error
      }

      // Convert HTML to base64 using TextEncoder for proper Unicode handling
      const base64Html = btoa(
        new TextEncoder()
          .encode(reviews)
          .reduce((data, byte) => data + String.fromCharCode(byte), ""),
      )
      const payload = createPayload(tab, timestamp, now, uuid, base64Html)
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

function createPayload(tab, timestamp, now, uuid, base64Html) {
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
      mimeType: "text/html",
      data: base64Html,
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
