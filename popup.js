document.addEventListener('DOMContentLoaded', async () => {
  // Load saved UUID if exists
  const result = await chrome.storage.local.get('uuid');
  const uuidInput = document.getElementById('uuid');
  const saveButton = document.getElementById('save');
  
  if (result.uuid) {
    uuidInput.value = result.uuid;
  }
  
  // Auto-focus the save button
  saveButton.focus();

  saveButton.addEventListener('click', async () => {
    const uuid = uuidInput.value.trim();
    const status = document.getElementById('status');
    
    if (!uuid) {
      status.textContent = 'Please enter a UUID';
      return;
    }

    // First try to scroll to the section
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    try {
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'findSection' });
      if (!response.found) {
        status.textContent = 'Section not found, saving page...';
      }
    } catch (error) {
      console.error('Error finding section:', error);
    }

    // Save UUID
    await chrome.storage.local.set({ uuid });
    
    // Trigger save in background script
    await chrome.runtime.sendMessage({ action: 'savePage', uuid });
    
    status.textContent = 'Page saved!';
    setTimeout(() => window.close(), 1000);
  });
});
