// Add styles for notification
const style = document.createElement("style")
style.textContent = `
.page-notification {
 position: fixed;
 top: 20px;
 right: 20px;
 background: #333;
 color: white;
 padding: 15px 25px;
 border-radius: 5px;
 z-index: 10000;
 animation: fadeInOut 3s ease-in-out;
 box-shadow: 0 2px 5px rgba(0,0,0,0.2);
}

@keyframes fadeInOut {
 0% { opacity: 0; transform: translateY(-20px); }
 10% { opacity: 1; transform: translateY(0); }
 90% { opacity: 1; transform: translateY(0); }
 100% { opacity: 0; transform: translateY(-20px); }
}`
document.head.appendChild(style)

// Listen for UUID messages from the webpage
window.addEventListener(
  "message",
  function (event) {
    // We only accept messages from ourselves
    if (event.source != window) return

    if (event.data.action === "setUUID") {
      // Store the UUID in Chrome's storage
      chrome.storage.local.set({ uuid: event.data.uuid }, function () {
        console.log("UUID saved:", event.data.uuid)
      })
    }
  },
  false,
)

function showPageNotification(message) {
  const notification = document.createElement("div")
  notification.className = "page-notification"
  notification.textContent = message
  document.body.appendChild(notification)

  // Remove the notification after animation completes
  setTimeout(() => {
    notification.remove()
  }, 3000)
}

function findAndScrollToSection() {
  // Regex pattern for "X of Y" where X and Y are numbers
  const pattern = /\b\d+\s+of\s+\d+\b/

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false)

  let node
  let found = false

  while ((node = walker.nextNode())) {
    if (pattern.test(node.textContent)) {
      found = true
      let match = node.textContent.match(pattern)[0]
      console.log("Found:", match)

      // Get the nearest parent with actual dimensions
      let element = node.parentElement
      while (element && !element.offsetHeight) {
        element = element.parentElement
      }

      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" })
        // Highlight the section temporarily
        const originalBackground = element.style.backgroundColor
        element.style.backgroundColor = "#ffeb3b"
        setTimeout(() => {
          element.style.backgroundColor = originalBackground
        }, 2000)
      }
      break
    }
  }

  return found
}

function getPageInfo() {
  const pattern = /\b(\d+)\s+of\s+(\d+)\b/
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false)

  let node
  while ((node = walker.nextNode())) {
    const match = node.textContent.match(pattern)
    if (match) {
      return {
        currentPage: parseInt(match[1]),
        totalPages: parseInt(match[2]),
      }
    }
  }
  return null
}

// Listen for messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "findSection") {
    const found = findAndScrollToSection()
    sendResponse({ found })
  }
  if (request.action === "getPageInfo") {
    const pageInfo = getPageInfo()
    sendResponse(pageInfo)
  }
  if (request.action === "showNotification") {
    showPageNotification(request.message)
    sendResponse({ shown: true })
  }
  return true // Keep the message channel open for async response
})
