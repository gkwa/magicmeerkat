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
 box-shadow: 0 2px 5px rgba(0,0,0,0.2);
}

.fade-out {
 animation: fadeInOut 3s ease-in-out;
}

@keyframes fadeInOut {
 0% { opacity: 0; transform: translateY(-20px); }
 10% { opacity: 1; transform: translateY(0); }
 90% { opacity: 1; transform: translateY(0); }
 100% { opacity: 0; transform: translateY(-20px); }
}`
document.head.appendChild(style)

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

function showPageNotification(message, fadeOut = false) {
 // Remove any existing notification
 const existingNotification = document.querySelector('.page-notification')
 if (existingNotification) {
   existingNotification.remove()
 }

 const notification = document.createElement("div")
 notification.className = "page-notification"
 if (fadeOut) {
   notification.classList.add("fade-out")
 }
 notification.textContent = message
 document.body.appendChild(notification)

 if (fadeOut) {
   setTimeout(() => {
     notification.remove()
   }, 3000)
 }
}

function findAndScrollToSection() {
 const pattern = /\b\d+\s+of\s+\d+\b/
 const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false)

 let node
 let found = false

 while ((node = walker.nextNode())) {
   if (pattern.test(node.textContent)) {
     found = true
     let match = node.textContent.match(pattern)[0]
     console.log("Found:", match)

     let element = node.parentElement
     while (element && !element.offsetHeight) {
       element = element.parentElement
     }

     if (element) {
       element.scrollIntoView({ behavior: "smooth", block: "center" })
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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
 if (request.action === "ping") {
   sendResponse({ status: "ready" })
 }
 if (request.action === "findSection") {
   const found = findAndScrollToSection()
   sendResponse({ found })
 }
 if (request.action === "getPageInfo") {
   const pageInfo = getPageInfo()
   sendResponse(pageInfo)
 }
 if (request.action === "showNotification") {
   // Only use fadeOut for completion message
   const fadeOut = request.message.includes("Completed processing")
   showPageNotification(request.message, fadeOut)
   sendResponse({ shown: true })
 }
 return true
})
