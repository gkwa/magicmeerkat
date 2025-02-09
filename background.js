chrome.action.onClicked.addListener(async (tab) => {
  try {
    // Get the current date and time for metadata
    const now = new Date()
    const timestamp = now.toISOString()
    const timestampForFilename = timestamp.replace(/[:.]/g, "-")

    // Generate base filename with timestamp and sanitized page title
    const sanitizedTitle = tab.title.replace(/[^a-z0-9]/gi, "_").substring(0, 50)
    const baseFilename = `${sanitizedTitle}_${timestampForFilename}`

    // Prepare metadata
    const metadata = {
      url: tab.url,
      title: tab.title,
      timestamp: timestamp,
      savedAt: now.toLocaleString(),
      mhtmlFile: baseFilename + ".mhtml",
    }

    // Save metadata as JSON
    const metadataBlob = new Blob([JSON.stringify(metadata, null, 2)], { type: "application/json" })
    const metadataUrl = await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.readAsDataURL(metadataBlob)
    })

    // Save the JSON metadata file
    await chrome.downloads.download({
      url: metadataUrl,
      filename: baseFilename + ".json",
      saveAs: false,
    })

    // Capture and save the MHTML
    const mhtmlData = await chrome.pageCapture.saveAsMHTML({ tabId: tab.id })
    const mhtmlUrl = await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.readAsDataURL(mhtmlData)
    })

    // Save the MHTML file
    await chrome.downloads.download({
      url: mhtmlUrl,
      filename: baseFilename + ".mhtml",
      saveAs: false,
    })
  } catch (error) {
    console.error("Error saving files:", error)
  }
})
