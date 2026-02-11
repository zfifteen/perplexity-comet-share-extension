// Perplexity Comet Share - Content Script
// Injects shared URL prompt into Perplexity's input field

(function() {
  "use strict";

  // Selectors for Perplexity's textarea input
  // These may need updating if Perplexity changes their DOM
  const SELECTORS = [
    'textarea[placeholder*="Ask"]',
    'textarea[placeholder*="ask"]',
    'textarea[class*="textarea"]',
    'div[contenteditable="true"]',
    'textarea'
  ];

  function findInputElement() {
    for (const selector of SELECTORS) {
      const el = document.querySelector(selector);
      if (el) return el;
    }
    return null;
  }

  function setInputValue(element, text) {
    if (element.tagName === "TEXTAREA" || element.tagName === "INPUT") {
      // For standard input elements
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype, "value"
      ).set;
      nativeInputValueSetter.call(element, text);
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
    } else if (element.contentEditable === "true") {
      // For contenteditable divs
      element.textContent = text;
      element.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }

  function submitInput() {
    // Try pressing Enter via keyboard event
    const input = findInputElement();
    if (input) {
      input.focus();
      const enterEvent = new KeyboardEvent("keydown", {
        key: "Enter",
        code: "Enter",
        keyCode: 13,
        which: 13,
        bubbles: true
      });
      input.dispatchEvent(enterEvent);
    }

    // Also try clicking the submit button
    setTimeout(() => {
      const submitBtn = document.querySelector(
        'button[aria-label="Submit"], button[type="submit"], button svg[data-icon="arrow-right"]'
      );
      if (submitBtn) {
        const btn = submitBtn.closest("button") || submitBtn;
        btn.click();
      }
    }, 100);
  }

  function injectPrompt(prompt, autoSubmit) {
    const maxRetries = 20;
    let retries = 0;

    function tryInject() {
      const input = findInputElement();
      if (input) {
        input.focus();
        setInputValue(input, prompt);

        if (autoSubmit) {
          // Small delay to let React state update
          setTimeout(submitInput, 500);
        }

        // Show brief notification
        showNotification("Prompt injected from Share Sheet");
      } else if (retries < maxRetries) {
        retries++;
        setTimeout(tryInject, 500);
      } else {
        console.error("Perplexity Comet Share: Could not find input element");
        showNotification("Error: Could not find input field", true);
      }
    }

    tryInject();
  }

  function showNotification(message, isError = false) {
    const notification = document.createElement("div");
    notification.textContent = message;
    Object.assign(notification.style, {
      position: "fixed",
      top: "20px",
      right: "20px",
      padding: "12px 20px",
      borderRadius: "8px",
      backgroundColor: isError ? "#ef4444" : "#22c55e",
      color: "white",
      fontSize: "14px",
      fontWeight: "500",
      zIndex: "999999",
      boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
      transition: "opacity 0.3s ease",
      opacity: "1"
    });
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.opacity = "0";
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "injectPrompt") {
      injectPrompt(message.prompt, message.autoSubmit);
      sendResponse({ status: "ok" });
    }
    return true;
  });
})();
