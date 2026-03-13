const apiKeyInput = document.getElementById("api-key") as HTMLInputElement;
const saveBtn = document.getElementById("save-btn") as HTMLButtonElement;
const statusDot = document.getElementById("status-dot") as HTMLElement;
const statusText = document.getElementById("status-text") as HTMLElement;

// Load initial state
chrome.storage.local.get(["apiKey"], (data) => {
  if (data.apiKey) {
    apiKeyInput.value = data.apiKey;
    updateStatus(true);
  }
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

saveBtn.addEventListener("click", () => {
  const key = apiKeyInput.value.trim();
  if (!key) return;

  chrome.storage.local.set({ apiKey: key }, () => {
    updateStatus(true);
    saveBtn.textContent = "Saved!";
    setTimeout(() => {
      saveBtn.textContent = "Save & Connect";
    }, 2000);
  });
});

export {};
