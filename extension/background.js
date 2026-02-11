// Perplexity Comet Share - Background Service Worker
// Handles native messaging from macOS Share Extension

const NATIVE_HOST = "com.perplexity.comet.share";
const PERPLEXITY_URL = "https://www.perplexity.ai/";

// Default settings
const DEFAULT_SETTINGS = {
  promptTemplate: "Analyze {url}",
  autoSubmit: true,
  openInNewTab: true
};

// Get user settings from storage
async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
      resolve(settings);
    });
  });
}

// Format the prompt with the URL
function formatPrompt(template, url) {
  return template.replace("{url}", url);
}

// Open Perplexity and inject the prompt
async function sendToPerplexity(url) {
  const settings = await getSettings();
  const prompt = formatPrompt(settings.promptTemplate, url);

  if (settings.openInNewTab) {
    // Open new tab with Perplexity
    const tab = await chrome.tabs.create({ url: PERPLEXITY_URL });
    // Wait for the tab to finish loading
    chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
      if (tabId === tab.id && changeInfo.status === "complete") {
        chrome.tabs.onUpdated.removeListener(listener);
        // Send the prompt to the content script
        chrome.tabs.sendMessage(tab.id, {
          action: "injectPrompt",
          prompt: prompt,
          autoSubmit: settings.autoSubmit
        });
      }
    });
  } else {
    // Find existing Perplexity tab or create new one
    const tabs = await chrome.tabs.query({ url: "https://www.perplexity.ai/*" });
    if (tabs.length > 0) {
      const tab = tabs[0];
      await chrome.tabs.update(tab.id, { active: true });
      await chrome.windows.update(tab.windowId, { focused: true });
      chrome.tabs.sendMessage(tab.id, {
        action: "injectPrompt",
        prompt: prompt,
        autoSubmit: settings.autoSubmit
      });
    } else {
      const tab = await chrome.tabs.create({ url: PERPLEXITY_URL });
      chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
        if (tabId === tab.id && changeInfo.status === "complete") {
          chrome.tabs.onUpdated.removeListener(listener);
          chrome.tabs.sendMessage(tab.id, {
            action: "injectPrompt",
            prompt: prompt,
            autoSubmit: settings.autoSubmit
          });
        }
      });
    }
  }
}

// Listen for native messages from the share handler
chrome.runtime.onConnectExternal.addListener((port) => {
  port.onMessage.addListener((message) => {
    if (message.action === "share" && message.url) {
      sendToPerplexity(message.url);
    }
  });
});

// Listen for native messaging connection
try {
  const port = chrome.runtime.connectNative(NATIVE_HOST);
  port.onMessage.addListener((message) => {
    if (message.url) {
      sendToPerplexity(message.url);
    }
  });
  port.onDisconnect.addListener(() => {
    console.log("Native host disconnected");
  });
} catch (e) {
  // Native host not available - extension still works via other triggers
  console.log("Native host not connected:", e.message);
}

// Also listen for messages from popup or other extension pages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "shareUrl" && message.url) {
    sendToPerplexity(message.url);
    sendResponse({ status: "ok" });
  }
  return true;
});

// Context menu for right-click share
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "shareToPerplexity",
    title: "Analyze with Perplexity",
    contexts: ["page", "link"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "shareToPerplexity") {
    const url = info.linkUrl || info.pageUrl;
    sendToPerplexity(url);
  }
});
