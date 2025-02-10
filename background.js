chrome.action.onClicked.addListener(async (tab) => {
  const result = await chrome.storage.local.get("uuid")
  if (result.uuid) {
    savePage(result.uuid)
  } else {
    console.error("No UUID found. Please post a business first.")
  }
})

async function savePage(uuid) {
  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

    // Get the current date and time for metadata
    const now = new Date()
    const timestamp = now.toISOString()
    const timestampForFilename = timestamp.replace(/[:.]/g, "-")

    // Generate filename with timestamp and sanitized page title
    const sanitizedTitle = tab.title.replace(/[^a-z0-9]/gi, "_").substring(0, 50)
    const filename = `${sanitizedTitle}_${timestampForFilename}.yaml`

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

    // Create YAML content
    const yamlContent = `metadata:
  url: "${tab.url}"
  title: "${tab.title.replace(/"/g, '\\"')}"
  timestamp: "${timestamp}"
  savedAt: "${now.toLocaleString()}"
  uuid: "${uuid}"
content:
  encoding: base64
  mimeType: application/x-mimearchive
  data: |
    ${base64Mhtml.replace(/\n/g, "\n    ")}`

    // Create and save the YAML file
    const yamlBlob = new Blob([yamlContent], { type: "application/yaml" })
    const yamlUrl = await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.readAsDataURL(yamlBlob)
    })

    // Save the combined YAML file
    await chrome.downloads.download({
      url: yamlUrl,
      filename: filename,
      saveAs: false,
    })
  } catch (error) {
    console.error("Error saving file:", error)
  }
}

// Handle keyboard shortcut
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "_execute_action") {
    const result = await chrome.storage.local.get("uuid")
    if (result.uuid) {
      savePage(result.uuid)
    }
  }
})
