let errorLog = []

export function logError(error, context = "") {
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

export function initializeErrorHandling() {
  errorLog = []
}
