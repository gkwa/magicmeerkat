chrome.action.onClicked.addListener(async (tab) => {
  try {
    // Get the current date and time for the timestamp
    const now = new Date()
    const timestamp = now.toISOString().replace(/[:.]/g, "-")

    // Generate filename with timestamp and sanitized page title
    const sanitizedTitle = tab.title.replace(/[^a-z0-9]/gi, "_").substring(0, 50)
    const filename = `${sanitizedTitle}_${timestamp}.mhtml`

    // Capture the page as MHTML
    const mhtmlData = await chrome.pageCapture.saveAsMHTML({ tabId: tab.id })

    // Save the file
    await chrome.downloads.download({
      url: URL.createObjectURL(mhtmlData),
      filename: filename,
      saveAs: false,
    })
  } catch (error) {
    console.error("Error saving MHTML:", error)
  }
})
