import { showPageNotification } from "./notification.js"
import { findAndScrollToSection, getPageInfo } from "./pageScanner.js"

function waitForContentStable(targetNode, timeWindow = 2000) {
  return new Promise((resolve) => {
    let timeoutId
    const observer = new MutationObserver(() => {
      // Reset timeout on each change
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        observer.disconnect()
        resolve()
      }, timeWindow)
    })

    // Start observing
    observer.observe(targetNode, {
      attributes: true,
      childList: true,
      subtree: true,
      characterData: true,
    })

    // Also resolve if no changes occur within timeWindow
    timeoutId = setTimeout(() => {
      observer.disconnect()
      resolve()
    }, timeWindow)
  })
}

function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    // Check if element already exists
    const element = document.querySelector(selector)
    if (element) {
      resolve(element)
      return
    }

    // Set timeout
    const timeoutId = setTimeout(() => {
      observer.disconnect()
      reject(new Error(`Element ${selector} did not appear within ${timeout}ms`))
    }, timeout)

    // Watch for element
    const observer = new MutationObserver((mutations) => {
      const element = document.querySelector(selector)
      if (element) {
        observer.disconnect()
        clearTimeout(timeoutId)
        resolve(element)
      }
    })

    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })
  })
}

async function waitForPageContent() {
  const contentStabilized = await waitForContentStable(document.body, 2000)
  const reviews = await waitForElement("#reviews")
  return reviews.outerHTML
}

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
    if (request.action === "waitForPageContent") {
      waitForPageContent()
        .then((reviews) => {
          sendResponse(reviews)
        })
        .catch((error) => {
          console.error("Error waiting for page content:", error)
          sendResponse(null)
        })
      return true
    }
    if (request.action === "showNotification") {
      const fadeOut = !request.message.includes("Completed processing")
      showPageNotification(request.message, fadeOut)
      sendResponse({ shown: true })
      return false
    }
  })
}
