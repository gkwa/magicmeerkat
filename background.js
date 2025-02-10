chrome.action.onClicked.addListener(async (tab) => {
  const result = await chrome.storage.local.get("uuid")
  if (result.uuid) {
    await savePage(result.uuid)
    // After saving, navigate to next page
    await navigateToNextPage(tab.id)
  } else {
    console.error("No UUID found. Please post a business first.")
  }
})

async function navigateToNextPage(tabId) {
  try {
    // First get page info
    const pageInfo = await chrome.tabs.sendMessage(tabId, { action: "getPageInfo" })
    if (!pageInfo) {
      console.error("Could not determine page information")
      return
    }

    console.log("Page info:", pageInfo) // Debug log

    if (pageInfo.currentPage >= pageInfo.totalPages) {
      console.log("Reached last page, showing notification...") // Debug log

      // Show in-page notification instead of system notification
      await chrome.tabs.sendMessage(tabId, {
        action: "showNotification",
        message: `Reached the last page (${pageInfo.currentPage} of ${pageInfo.totalPages})`,
      })

      return
    }

    const tab = await chrome.tabs.get(tabId)
    const url = new URL(tab.url)

    // Get current start value
    let start = parseInt(url.searchParams.get("start") || "0")

    // Increment by 10
    start += 10

    // Update URL
    url.searchParams.set("start", start.toString())

    // Navigate to new URL
    await chrome.tabs.update(tabId, { url: url.toString() })
  } catch (error) {
    console.error("Error navigating to next page:", error)
  }
}

async function savePage(uuid) {
  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

    // Get the current date and time for metadata
    const now = new Date()
    const timestamp = now.toISOString()

    // Capture the MHTML
    const mhtmlData = await chrome.pageCapture.saveAsMHTML({ tabId: tab.id })

    // Convert MHTML to base64
    const base64Mhtml = await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => {
        const base64Data = reader.result.split(",")[1]
        resolve(base64Data)
      }
      reader.readAsDataURL(mhtmlData)
    })

    // Create payload
    const payload = {
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

    // Send to server
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

    console.log("Page data sent to server successfully")
  } catch (error) {
    console.error("Error sending page to server:", error)
    throw error // Re-throw to handle in the caller
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
