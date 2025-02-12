import { showPageNotification } from "./notification.js"
import { findAndScrollToSection, getPageInfo } from "./pageScanner.js"

export function initializeMessageHandlers() {
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
    if (request.action === "ping") {
      sendResponse({ status: "ready" })
      return false
    }

    if (request.action === "findSection") {
      findAndScrollToSection().then((result) => {
        sendResponse(result)
      })
      return true
    }

    if (request.action === "getPageInfo") {
      getPageInfo().then((pageInfo) => {
        sendResponse(pageInfo)
      })
      return true
    }

    if (request.action === "showNotification") {
      const fadeOut = request.message.includes("Completed processing")
      showPageNotification(request.message, fadeOut)
      sendResponse({ shown: true })
      return false
    }
  })
}
