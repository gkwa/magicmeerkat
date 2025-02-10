export function initializeNotificationStyles() {
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
}

export function showPageNotification(message) {
  const notification = document.createElement("div")
  notification.className = "page-notification"
  notification.textContent = message
  document.body.appendChild(notification)

  setTimeout(() => {
    notification.remove()
  }, 3000)
}
