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
