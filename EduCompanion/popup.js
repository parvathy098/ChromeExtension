window.onload = function () {
  // ---------------- DISTRACTION BLOCKER ----------------

  // Elements for distraction blocker
  const blockerPopup = document.getElementById("blocker-popup");
  const blockSiteInput = document.getElementById("block-site-input");
  const addBlockSiteBtn = document.getElementById("add-block-site-btn");
  const blockedSitesList = document.getElementById("blocked-sites-list");
  const clearBlockedSitesBtn = document.getElementById(
    "clear-blocked-sites-btn"
  );
  const startBlockingBtn = document.getElementById("start-blocking-btn");
  const stopBlockingBtn = document.getElementById("stop-blocking-btn");

  // Open the popup when the "Distraction Blocker" button is clicked
  document.getElementById("distraction-blocker-btn").onclick = function () {
    blockerPopup.style.display = "block";
    fetchAndSyncBlockedSites(); // Fetch blocked sites from server and sync with local storage
  };

  // Close the popup when the close button (X) is clicked
  document.querySelector(".close-blocker-btn").onclick = function () {
    blockerPopup.style.display = "none";
  };

  // Add a new site to the block list (sync with server and local)
  addBlockSiteBtn.onclick = function () {
    const site = blockSiteInput.value.trim();
    if (site) {
      // Add site to server
      fetch("http://localhost:3002/api/blocked-sites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ site: site }),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log("Site blocked on server:", data);
          // Now sync with local storage
          syncWithLocalStorage(site);
        })
        .catch((error) => console.error("Error blocking site:", error));
    }
    blockSiteInput.value = ""; // Clear input field
  };

  // Sync blocked site with local storage and declarativeNetRequest
  function syncWithLocalStorage(site) {
    chrome.storage.sync.get({ blockedSites: [] }, function (result) {
      const blockedSites = result.blockedSites;
      blockedSites.push(site); // Add site to local storage
      chrome.storage.sync.set({ blockedSites: blockedSites }, () => {
        console.log("Blocked site synced to local storage.");
        // Also refresh UI
        displayBlockedSites(blockedSites);
      });
    });
  }

  // Fetch blocked sites from the server and sync them with local storage
  function fetchAndSyncBlockedSites() {
    fetch("http://localhost:3002/api/blocked-sites")
      .then((response) => response.json())
      .then((blockedSites) => {
        // Store blocked sites in chrome.storage.sync
        chrome.storage.sync.set({ blockedSites: blockedSites }, () => {
          console.log("Blocked sites synced to local storage.");
          displayBlockedSites(blockedSites); // Display blocked sites in UI
        });
      })
      .catch((error) => console.error("Error syncing blocked sites:", error));
  }

  // Display blocked sites in the popup
  function displayBlockedSites(blockedSites) {
    blockedSitesList.innerHTML = ""; // Clear the current list
    blockedSites.forEach((site, index) => {
      const listItem = document.createElement("li");
      listItem.textContent = site;
      blockedSitesList.appendChild(listItem);
    });
  }

  // Clear all blocked sites (both server and locally)
  clearBlockedSitesBtn.onclick = function () {
    fetch("http://localhost:3002/api/clear-blocked-sites", {
      method: "POST",
    })
      .then((response) => response.json())
      .then(() => {
        console.log("All blocked sites cleared.");
        chrome.storage.sync.set({ blockedSites: [] }, () => {
          displayBlockedSites([]); // Clear the UI
        });
      })
      .catch((error) => console.error("Error clearing blocked sites:", error));
  };

  // Start blocking the added sites using chrome.declarativeNetRequest
  startBlockingBtn.onclick = function () {
    chrome.storage.sync.get({ blockedSites: [] }, function (result) {
      const blockedSites = result.blockedSites;
      const rules = blockedSites.map((site, index) => ({
        id: index + 1, // Ensure unique ID for each rule
        priority: 1,
        action: { type: "block" },
        condition: { urlFilter: site, resourceTypes: ["main_frame"] },
      }));

      // Remove any existing rules and add new ones
      chrome.declarativeNetRequest.getDynamicRules((existingRules) => {
        const existingRuleIds = existingRules.map((rule) => rule.id);

        chrome.declarativeNetRequest.updateDynamicRules(
          { removeRuleIds: existingRuleIds, addRules: rules },
          () => {
            console.log("Blocking rules updated.");
          }
        );
      });
    });
  };

  // Stop blocking the sites
  stopBlockingBtn.onclick = function () {
    chrome.declarativeNetRequest.getDynamicRules((existingRules) => {
      const ruleIds = existingRules.map((rule) => rule.id);

      chrome.declarativeNetRequest.updateDynamicRules(
        { removeRuleIds: ruleIds },
        () => {
          console.log("Blocking stopped, all rules removed.");
        }
      );
    });
  };

  // Sync blocked sites on load
  fetchAndSyncBlockedSites();
  const todoModal = document.getElementById("todo-modal");
  const openTodoModalBtn = document.getElementById("open-todo-modal-btn");
  const closeTodoModalBtn = document.querySelector(".close-todo-modal-btn");
  const todoInput = document.getElementById("new-todo-input");
  const addTodoBtn = document.getElementById("add-todo-btn");
  const todoList = document.getElementById("todo-list");
  const clearTodosBtn = document.getElementById("clear-todos-btn");

  // Load saved To-Do items when the popup is opened
  loadTodos();

  // Open To-Do List Modal
  openTodoModalBtn.onclick = function () {
    todoModal.style.display = "block";
  };

  // Close To-Do List Modal
  closeTodoModalBtn.onclick = function () {
    todoModal.style.display = "none";
  };

  // Close modal when clicking outside of the modal content
  window.onclick = function (event) {
    if (event.target == todoModal) {
      todoModal.style.display = "none";
    }
  };

  // Add new To-Do item
  addTodoBtn.onclick = function () {
    const todoText = todoInput.value.trim();
    if (todoText) {
      addTodoItem(todoText);
      saveTodoItem(todoText);
      todoInput.value = ""; // Clear input field after adding
    }
  };

  // Clear all To-Do items
  clearTodosBtn.onclick = function () {
    chrome.storage.sync.set({ todos: [] }, function () {
      loadTodos(); // Reload the To-Do list after clearing
    });
  };

  // Function to load saved To-Do items from storage
  function loadTodos() {
    chrome.storage.sync.get({ todos: [] }, function (result) {
      const todos = result.todos;
      todoList.innerHTML = ""; // Clear existing list
      todos.forEach(function (todo, index) {
        addTodoItem(todo, index);
      });
    });
  }

  // Function to add a new To-Do item to the UI
  function addTodoItem(todoText, index) {
    const li = document.createElement("li");
    li.textContent = todoText;

    // Add delete button for each item
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.onclick = function () {
      deleteTodoItem(index);
    };

    li.appendChild(deleteBtn);
    todoList.appendChild(li);
  }

  // Function to save a new To-Do item to Chrome's storage
  function saveTodoItem(todoText) {
    chrome.storage.sync.get({ todos: [] }, function (result) {
      const todos = result.todos;
      todos.push(todoText); // Add new item to the array
      chrome.storage.sync.set({ todos: todos }, function () {
        console.log("To-Do item saved!");
      });
    });
  }

  // Function to delete a To-Do item
  function deleteTodoItem(index) {
    chrome.storage.sync.get({ todos: [] }, function (result) {
      const todos = result.todos;
      todos.splice(index, 1); // Remove the item by index
      chrome.storage.sync.set({ todos: todos }, function () {
        loadTodos(); // Reload the To-Do list after deleting
      });
    });
  }

  // ---------------- TIMER FUNCTIONALITY ----------------
  const timerModal = document.getElementById("timerModal");
  const openTimerModalBtn = document.getElementById("openTimerModal"); // Ensure this exists in your HTML
  const closeTimerModalBtn = document.getElementById("closeTimerModal");
  const timerDisplay = document.getElementById("timerDisplay");
  const startStopBtn = document.getElementById("startStopBtn");
  const resetBtn = document.getElementById("resetBtn");

  let isRunning = false;
  let minutes = 0;
  let seconds = 0;

  // Open Timer modal
  openTimerModalBtn.onclick = function () {
    timerModal.style.display = "block";
  };

  // Close Timer modal
  closeTimerModalBtn.onclick = function () {
    timerModal.style.display = "none";
  };

  // Start or stop the timer
  startStopBtn.onclick = function () {
    if (!isRunning) {
      chrome.runtime.sendMessage({ action: "startTimer" }, function (response) {
        console.log(response.status);
        isRunning = true;
        startStopBtn.textContent = "Pause";
        timerDisplay.classList.add("red-indicator"); // Highlight when running
      });
    } else {
      chrome.runtime.sendMessage({ action: "stopTimer" }, function (response) {
        console.log(response.status);
        isRunning = false;
        startStopBtn.textContent = "Start";
        timerDisplay.classList.remove("red-indicator"); // Remove highlight
      });
    }
  };

  // Reset the timer
  resetBtn.onclick = function () {
    chrome.runtime.sendMessage({ action: "resetTimer" }, function (response) {
      console.log(response.status);
      minutes = 0;
      seconds = 0;
      updateDisplay();
      startStopBtn.textContent = "Start";
      timerDisplay.classList.remove("red-indicator");
    });
  };

  // Function to update the display with the timer state
  function updateDisplay() {
    timerDisplay.textContent = `${String(minutes).padStart(2, "0")}:${String(
      seconds
    ).padStart(2, "0")}`;
  }

  // Listen for updates from the background script
  chrome.runtime.onMessage.addListener(function (
    message,
    sender,
    sendResponse
  ) {
    if (message.action === "updateTimer") {
      minutes = message.minutes;
      seconds = message.seconds;
      updateDisplay();
    }
  });

  // ---------------- RESOURCE ORGANIZER ----------------

  var popup = document.getElementById("resource-organizer-popup");
  var saveBtn = document.getElementById("save-resource-btn");
  var closeBtn = document.querySelector(".close-btn");

  // Function to get the active tab's URL
  function getCurrentTabUrl(callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      var activeTab = tabs[0];
      var activeTabUrl = activeTab.url;
      callback(activeTabUrl);
    });
  }

  // When the user clicks on the "Save Resource" button
  saveBtn.onclick = function () {
    // Capture the tag from the input field
    var resourceTag = document.getElementById("resource-tag").value;

    // Get the current tab URL
    getCurrentTabUrl(function (url) {
      // Create a resource object with the URL and tag
      var resource = {
        tag: resourceTag,
        url: url,
      };

      // Save the resource to Chrome storage
      chrome.storage.sync.get({ resources: [] }, function (result) {
        var resources = result.resources;
        resources.push(resource); // Add new resource to the array
        chrome.storage.sync.set({ resources: resources }, function () {
          console.log("Resource saved successfully!");
        });
      });
    });

    // Close the popup after saving
    popup.style.display = "none";
  };

  // Open the popup when the button is clicked
  document.getElementById("resource-organizer-btn").onclick = function () {
    popup.style.display = "block";
  };

  // Close the popup when the close button is clicked
  closeBtn.onclick = function () {
    popup.style.display = "none";
  };

  // Optionally close the popup when clicking outside of it
  window.onclick = function (event) {
    if (event.target == popup) {
      popup.style.display = "none";
    }
  };

  // Get elements for saving and displaying resources
  var viewSavedResourcesBtn = document.getElementById(
    "view-saved-resources-btn"
  );
  var closeSavedResourcesBtn = document.querySelector(
    ".close-saved-resources-btn"
  );
  var savedResourcesPopup = document.getElementById(
    "saved-resources-container"
  );
  var resourceList = document.getElementById("resource-list");
  var clearAllBtn = document.getElementById("clear-all-btn");

  // Display saved resources when "Saved Resources" button is clicked
  viewSavedResourcesBtn.onclick = function () {
    // Retrieve saved resources from Chrome storage
    chrome.storage.sync.get({ resources: [] }, function (result) {
      var resources = result.resources;
      resourceList.innerHTML = ""; // Clear the previous list

      if (resources.length > 0) {
        // Loop through each resource and create a list item with an "X" delete button
        resources.forEach(function (resource, index) {
          var resourceDiv = document.createElement("div");
          resourceDiv.className = "resource-item";
          resourceDiv.innerHTML = `
            <p><strong>Tag:</strong> ${resource.tag}</p>
            <a href="${resource.url}" target="_blank">${resource.url}</a>
            <button class="delete-btn" data-index="${index}">&times;</button> <!-- "X" button -->
          `;
          resourceList.appendChild(resourceDiv);
        });

        // Attach delete button event listeners
        var deleteButtons = document.querySelectorAll(".delete-btn");
        deleteButtons.forEach(function (button) {
          button.addEventListener("click", function () {
            var index = this.getAttribute("data-index");
            deleteResource(index); // Call function to delete the resource
          });
        });
      } else {
        resourceList.innerHTML = "<p>No resources saved yet.</p>";
      }
    });

    // Show the popup with saved resources
    savedResourcesPopup.style.display = "block";
  };

  // Delete a specific resource
  function deleteResource(index) {
    chrome.storage.sync.get({ resources: [] }, function (result) {
      var resources = result.resources;
      resources.splice(index, 1); // Remove the resource by index
      chrome.storage.sync.set({ resources: resources }, function () {
        console.log("Resource deleted!");
        viewSavedResourcesBtn.click(); // Refresh the list of saved resources
      });
    });
  }

  // Clear all resources when "Clear All" button is clicked
  clearAllBtn.onclick = function () {
    chrome.storage.sync.set({ resources: [] }, function () {
      console.log("All resources cleared!");
      resourceList.innerHTML = "<p>No resources saved yet.</p>";
    });
  };

  // Close the saved resources popup when close button is clicked
  closeSavedResourcesBtn.onclick = function () {
    savedResourcesPopup.style.display = "none";
  };

  // ---------------- NOTE-TAKING FUNCTIONALITY ----------------

  var modal = document.getElementById("noteModal");
  var openModalBtn = document.getElementById("openModal");
  var closeModalBtn = document.getElementById("closeModal");
  var showSavedNotesBtn = document.getElementById("showSavedNotes");
  var savedNotesContainer = document.getElementById("savedNotesContainer");
  var clearAllNotesBtn = document.getElementById("clearAllNotes");

  // Display saved notes from local storage on load
  displaySavedNotes();

  // Open the modal for note taking
  if (openModalBtn) {
    openModalBtn.onclick = function () {
      modal.style.display = "block";
    };
  }

  // Close the modal when user clicks the close button (x)
  if (closeModalBtn) {
    closeModalBtn.onclick = function () {
      modal.style.display = "none";
    };
  }

  // Save the note when user clicks the "Save Note" button
  document.getElementById("saveNote").onclick = function () {
    var noteContent = document.getElementById("noteText").value;

    if (noteContent.trim() !== "") {
      saveNoteToLocalStorage(noteContent);
      displaySavedNotes(); // Update the list of saved notes
      document.getElementById("noteText").value = ""; // Clear the textarea
      modal.style.display = "none"; // Close the modal
    } else {
      alert("Please enter a note before saving.");
    }
  };

  // Show saved notes when "Saved Notes" button is clicked
  if (showSavedNotesBtn) {
    showSavedNotesBtn.onclick = function () {
      savedNotesContainer.style.display = "block"; // Show the saved notes section
      displaySavedNotes(); // Display the notes
    };
  }

  // Clear all saved notes
  if (clearAllNotesBtn) {
    clearAllNotesBtn.onclick = function () {
      chrome.storage.local.set({ notes: [] }, function () {
        displaySavedNotes(); // Refresh the notes display after clearing
        alert("All notes have been cleared.");
      });
    };
  }

  // Function to save note to Chrome's local storage
  function saveNoteToLocalStorage(note) {
    chrome.storage.local.get({ notes: [] }, function (result) {
      var notes = result.notes;
      notes.push(note);
      chrome.storage.local.set({ notes: notes });
    });
  }

  // Function to display saved notes with delete functionality
  function displaySavedNotes() {
    chrome.storage.local.get({ notes: [] }, function (result) {
      var notes = result.notes;
      var savedNotesList = document.getElementById("savedNotesList");
      savedNotesList.innerHTML = ""; // Clear the list before displaying

      if (notes.length > 0) {
        notes.forEach(function (note, index) {
          // Create list item for each note
          var noteItem = document.createElement("li");
          noteItem.textContent = note;

          // Create delete button
          var deleteBtn = document.createElement("button");
          deleteBtn.textContent = "X"; // Delete button text
          deleteBtn.classList.add("delete-btn");

          // Add event listener to delete the note when clicked
          deleteBtn.onclick = function () {
            deleteNoteFromLocalStorage(index);
          };

          // Append the note and delete button to the list item
          noteItem.appendChild(deleteBtn);
          savedNotesList.appendChild(noteItem);
        });
      } else {
        savedNotesList.innerHTML = "<li>No saved notes yet.</li>";
      }
    });
  }

  // Function to delete note from local storage
  function deleteNoteFromLocalStorage(noteIndex) {
    chrome.storage.local.get({ notes: [] }, function (result) {
      var notes = result.notes;
      notes.splice(noteIndex, 1); // Remove the note at the given index
      chrome.storage.local.set({ notes: notes }, function () {
        displaySavedNotes(); // Refresh the displayed notes
      });
    });
  }
};
