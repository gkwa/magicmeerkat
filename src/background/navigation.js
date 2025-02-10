export async function navigateToNextPage(tabId) {
  try {
    const pageInfo = await chrome.tabs.sendMessage(tabId, { action: "getPageInfo" })
    if (!pageInfo) {
      console.error("Could not determine page information")
      return
    }

    console.log("Page info:", pageInfo)

    if (pageInfo.currentPage >= pageInfo.totalPages) {
      console.log("Reached last page, showing notification...")
      await chrome.tabs.sendMessage(tabId, {
        action: "showNotification",
        message: `Reached the last page (${pageInfo.currentPage} of ${pageInfo.totalPages})`,
      })
      return
    }

    const tab = await chrome.tabs.get(tabId)
    const url = new URL(tab.url)
    let start = parseInt(url.searchParams.get("start") || "0")
    start += 10
    url.searchParams.set("start", start.toString())
    await chrome.tabs.update(tabId, { url: url.toString() })
  } catch (error) {
    console.error("Error navigating to next page:", error)
  }
}
