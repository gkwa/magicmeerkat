import { initializeNotificationStyles, showPageNotification } from "./content/notifications.js"
import { findAndScrollToSection, getPageInfo } from "./content/page_info.js"

initializeNotificationStyles()

window.addEventListener(
  "message",
  function (event) {
    if (event.source != window) return

    if (event.data.action === "setUUID") {
      chrome.storage.local.set({ uuid: event.data.uuid }, function () {
        console.log("UUID saved:", event.data.uuid)
      })
    }
  },
  false,
)

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
  return true
})
