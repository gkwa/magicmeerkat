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
