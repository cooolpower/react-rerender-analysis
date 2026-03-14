const apiKeyInput = document.getElementById("api-key") as HTMLInputElement;
const backendUrlInput = document.getElementById("backend-url") as HTMLInputElement;
const showHighlightInput = document.getElementById("show-highlight") as HTMLInputElement;
const showBadgeInput = document.getElementById("show-badge") as HTMLInputElement;
const badgeModeInput = document.getElementById("badge-mode") as HTMLSelectElement;
const saveBtn = document.getElementById("save-btn") as HTMLButtonElement;
const statusDot = document.getElementById("status-dot") as HTMLElement;
const statusText = document.getElementById("status-text") as HTMLElement;

// Load initial state
chrome.storage.local.get(["apiKey", "backendUrl", "showHighlight", "showBadge", "badgeMode"], (data) => {
  if (data.apiKey) {
    apiKeyInput.value = data.apiKey;
    updateStatus(true);
  }
  if (data.backendUrl) {
    backendUrlInput.value = data.backendUrl;
  } else {
    backendUrlInput.value = "http://localhost:3000";
  }

  // New settings defaults
  showHighlightInput.checked = data.showHighlight !== false;
  showBadgeInput.checked = data.showBadge !== false;
  badgeModeInput.value = data.badgeMode || "1000";
});

function updateStatus(connected: boolean): void {
  if (connected) {
    statusDot.classList.add("online");
    statusText.textContent = "Connected & Capturing";
    statusText.style.color = "#22c55e";
  } else {
    statusDot.classList.remove("online");
    statusText.textContent = "Disconnected";
    statusText.style.color = "#6b7280";
  }
}

// 시각 효과 설정 즉시 반영을 위한 리스너 추가
[showHighlightInput, showBadgeInput, badgeModeInput].forEach(input => {
  input.addEventListener("change", () => {
    chrome.storage.local.set({
      showHighlight: showHighlightInput.checked,
      showBadge: showBadgeInput.checked,
      badgeMode: badgeModeInput.value
    });
  });
});

saveBtn.addEventListener("click", () => {
  const key = apiKeyInput.value.trim();
  const url = backendUrlInput.value.trim() || "http://localhost:3000";
  const showHighlight = showHighlightInput.checked;
  const showBadge = showBadgeInput.checked;
  const badgeMode = badgeModeInput.value;

  if (!key) return;

  chrome.storage.local.set({ 
    apiKey: key, 
    backendUrl: url,
    showHighlight,
    showBadge,
    badgeMode
  }, () => {
    updateStatus(true);
    saveBtn.textContent = "Changes Saved!";
    setTimeout(() => {
      saveBtn.textContent = "Save Changes";
    }, 2000);
  });
});

export {};
