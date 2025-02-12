export function showPageNotification(message, fadeOut = false) {
  const existingNotification = document.querySelector(".page-notification")
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
