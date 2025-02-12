export function showPageNotification(message, fadeOut = false) {
  const existingNotification = document.querySelector(".page-notification")
  if (existingNotification) {
    existingNotification.remove()
  }

  const notification = document.createElement("div")
  notification.className = "page-notification"
  notification.textContent = message
  document.body.appendChild(notification)

  // Only add fade-out and timeout if fadeOut is true
  if (fadeOut) {
    notification.classList.add("fade-out")
    setTimeout(() => {
      notification.remove()
    }, 3000)
  }
}
