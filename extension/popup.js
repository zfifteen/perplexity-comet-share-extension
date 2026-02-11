// Perplexity Comet Share - Popup Script
// Handles settings UI and manual share button

const DEFAULT_SETTINGS = {
  promptTemplate: "Analyze {url}",
  autoSubmit: true,
  openInNewTab: true
};

// DOM elements
const promptTemplateInput = document.getElementById("promptTemplate");
const autoSubmitToggle = document.getElementById("autoSubmit");
const openInNewTabToggle = document.getElementById("openInNewTab");
const shareBtn = document.getElementById("shareCurrentPage");
const statusDiv = document.getElementById("status");

// Load settings
chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
  promptTemplateInput.value = settings.promptTemplate;
  autoSubmitToggle.checked = settings.autoSubmit;
  openInNewTabToggle.checked = settings.openInNewTab;
});

// Save settings on change
function saveSettings() {
  const settings = {
    promptTemplate: promptTemplateInput.value || DEFAULT_SETTINGS.promptTemplate,
    autoSubmit: autoSubmitToggle.checked,
    openInNewTab: openInNewTabToggle.checked
  };
  chrome.storage.sync.set(settings, () => {
    showStatus("Settings saved");
  });
}

promptTemplateInput.addEventListener("change", saveSettings);
promptTemplateInput.addEventListener("blur", saveSettings);
autoSubmitToggle.addEventListener("change", saveSettings);
openInNewTabToggle.addEventListener("change", saveSettings);

// Share current page button
shareBtn.addEventListener("click", async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url) {
      chrome.runtime.sendMessage(
        { action: "shareUrl", url: tab.url },
        (response) => {
          if (response && response.status === "ok") {
            showStatus("Shared to Perplexity!");
          } else {
            showStatus("Error sharing", true);
          }
        }
      );
    } else {
      showStatus("No URL to share", true);
    }
  } catch (err) {
    showStatus("Error: " + err.message, true);
  }
});

function showStatus(message, isError = false) {
  statusDiv.textContent = message;
  statusDiv.style.color = isError ? "#ef4444" : "#22c55e";
  setTimeout(() => {
    statusDiv.textContent = "";
  }, 3000);
}
