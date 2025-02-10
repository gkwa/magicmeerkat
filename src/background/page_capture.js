export async function savePage(uuid) {
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
