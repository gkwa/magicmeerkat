window.addEventListener('message', function(event) {
    // We only accept messages from ourselves
    if (event.source != window) return;

    if (event.data.action === 'setUUID') {
        // Store the UUID in Chrome's storage
        chrome.storage.local.set({ uuid: event.data.uuid }, function() {
            console.log('UUID saved:', event.data.uuid);
        });
    }
}, false);

function findAndScrollToSection() {
    // Regex pattern for "X of Y" where X and Y are numbers
    const pattern = /\b\d+\s+of\s+\d+\b/;
    
    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );

    let node;
    let found = false;

    while ((node = walker.nextNode())) {
        if (pattern.test(node.textContent)) {
            found = true;
            let match = node.textContent.match(pattern)[0];
            console.log('Found:', match);
            
            // Get the nearest parent with actual dimensions
            let element = node.parentElement;
            while (element && !element.offsetHeight) {
                element = element.parentElement;
            }
            
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Highlight the section temporarily
                const originalBackground = element.style.backgroundColor;
                element.style.backgroundColor = '#ffeb3b';
                setTimeout(() => {
                    element.style.backgroundColor = originalBackground;
                }, 2000);
            }
            break;
        }
    }

    return found;
}

// Listen for messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'findSection') {
        const found = findAndScrollToSection();
        sendResponse({ found });
    }
});
