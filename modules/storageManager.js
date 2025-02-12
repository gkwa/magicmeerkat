export async function getStorageData(keys) {
  return await chrome.storage.local.get(keys)
}

export async function setStorageData(data) {
  return await chrome.storage.local.set(data)
}
