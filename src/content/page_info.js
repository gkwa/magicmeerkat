export function findAndScrollToSection() {
  const pattern = /\b\d+\s+of\s+\d+\b/
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false)

  let node
  let found = false

  while ((node = walker.nextNode())) {
    if (pattern.test(node.textContent)) {
      found = true
      let match = node.textContent.match(pattern)[0]
      console.log("Found:", match)

      let element = findParentWithDimensions(node.parentElement)
      if (element) {
        highlightAndScrollTo(element)
      }
      break
    }
  }

  return found
}

export function getPageInfo() {
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

function findParentWithDimensions(element) {
  while (element && !element.offsetHeight) {
    element = element.parentElement
  }
  return element
}

function highlightAndScrollTo(element) {
  element.scrollIntoView({ behavior: "smooth", block: "center" })
  const originalBackground = element.style.backgroundColor
  element.style.backgroundColor = "#ffeb3b"
  setTimeout(() => {
    element.style.backgroundColor = originalBackground
  }, 2000)
}
