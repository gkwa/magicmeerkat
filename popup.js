document.addEventListener('DOMContentLoaded', async () => {
  // Load saved UUID if exists
  const result = await chrome.storage.local.get('uuid');
  if (result.uuid) {
    document.getElementById('uuid').value = result.uuid;
  }

  document.getElementById('save').addEventListener('click', async () => {
    const uuid = document.getElementById('uuid').value.trim();
    const status = document.getElementById('status');
    
    if (!uuid) {
      status.textContent = 'Please enter a UUID';
      return;
    }

    // Save UUID
    await chrome.storage.local.set({ uuid });
    
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Trigger save in background script
    await chrome.runtime.sendMessage({ action: 'savePage', uuid });
    
    status.textContent = 'Page saved!';
    setTimeout(() => window.close(), 1000);
  });
});
