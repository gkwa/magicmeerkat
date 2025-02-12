const styleContent = `
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

export function initializeStyles() {
  const style = document.createElement("style")
  style.textContent = styleContent
  document.head.appendChild(style)
}
