let isBlocking = false;
let blockedSites = [];
let isRunning = false;
let minutes = 0;
let seconds = 0;
let timer = null;

// Listener to handle the blocking and timer-related actions
chrome.runtime.onInstalled.addListener(() => {
  console.log("EduCompanion Extension Installed");
});

// Consolidated onMessage listener for blocking, timer, and other functionality
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "startBlocking") {
    startBlocking(sendResponse);
    return true; // Indicates the response will be sent asynchronously
  } else if (message.action === "stopBlocking") {
    stopBlocking(sendResponse);
    return true; // Indicates the response will be sent asynchronously
  } else if (message.action === "startTimer") {
    startTimer();
    sendResponse({ status: "timer started" });
  } else if (message.action === "stopTimer") {
    stopTimer();
    sendResponse({ status: "timer stopped" });
  } else if (message.action === "resetTimer") {
    resetTimer(sendResponse);
  } else if (message.action === "getTimerState") {
    sendResponse({
      minutes: minutes,
      seconds: seconds,
      isRunning: isRunning,
    });
  }
});

// ---------------- BLOCKING FUNCTIONALITY ----------------

// Start blocking function
function startBlocking(sendResponse) {
  chrome.storage.sync.get({ blockedSites: [] }, function (result) {
    blockedSites = result.blockedSites;
    isBlocking = true;
    updateBlockingRules(sendResponse); // Call the function to update the blocking rules
  });
}

// Stop blocking function
function stopBlocking(sendResponse) {
  isBlocking = false;
  removeAllRules(sendResponse); // Call the function to remove all rules
}

// Update blocking rules based on the current list of blocked sites
function updateBlockingRules(sendResponse) {
  chrome.declarativeNetRequest.getDynamicRules((existingRules) => {
    const existingRuleIds = existingRules.map((rule) => rule.id);

    // Remove all old rules before adding new ones
    chrome.declarativeNetRequest.updateDynamicRules(
      { removeRuleIds: existingRuleIds }, // Remove old rules
      () => {
        const rules = blockedSites.map((site, index) => ({
          id: index + 1, // Unique ID for each rule
          priority: 1,
          action: { type: "block" },
          condition: { urlFilter: site, resourceTypes: ["main_frame"] }, // Block only main page requests
        }));

        // Add new blocking rules dynamically
        chrome.declarativeNetRequest.updateDynamicRules(
          { addRules: rules }, // Add new rules
          () => {
            console.log("Blocking rules updated.");
            sendResponse({ status: "blocking started" });
          }
        );
      }
    );
  });
}

// Remove all dynamic rules
function removeAllRules(sendResponse) {
  chrome.declarativeNetRequest.getDynamicRules((existingRules) => {
    const ruleIdsToRemove = existingRules.map((rule) => rule.id); // Get all existing rule IDs

    // Remove all dynamic rules
    chrome.declarativeNetRequest.updateDynamicRules(
      { removeRuleIds: ruleIdsToRemove }, // Remove all existing rules
      () => {
        console.log("All dynamic rules removed.");
        sendResponse({ status: "blocking stopped, all rules removed" });
      }
    );
  });
}

// ---------------- TIMER FUNCTIONALITY ----------------

function startTimer() {
  if (!timer) {
    isRunning = true; // Set isRunning when the timer starts
    timer = setInterval(() => {
      seconds++;
      if (seconds === 60) {
        minutes++;
        seconds = 0;
      }

      // Save the current timer state to chrome storage
      chrome.storage.local.set({
        timerMinutes: minutes,
        timerSeconds: seconds,
        timerRunning: true,
      });

      // Send an update to any popup that might be open
      chrome.runtime.sendMessage({
        action: "updateTimer",
        minutes: minutes,
        seconds: seconds,
      });
    }, 1000);
  }
}

function stopTimer() {
  if (timer) {
    clearInterval(timer);
    timer = null;
    isRunning = false; // Set isRunning when the timer stops
    chrome.storage.local.set({
      timerRunning: false,
    });
  }
}

function resetTimer(sendResponse) {
  stopTimer();
  minutes = 0;
  seconds = 0;
  chrome.storage.local.set({
    timerMinutes: minutes,
    timerSeconds: seconds,
    timerRunning: false,
  });
  sendResponse({ status: "timer reset" });
}

// ---------------- RESOURCE ORGANIZER AND NOTES (Optional Future Use) ----------------
// Here, you can add background functionality related to the Resource Organizer or Notes if needed
// These functionalities might not need background scripts unless you have specific long-running actions.
