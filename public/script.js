
const form = document.getElementById("project-form");
const nameInput = document.getElementById("name");
const statusSelect = document.getElementById("status");
const saveButton = document.getElementById("save-button");
const cancelButton = document.getElementById("cancel-button");
const projectList = document.getElementById("project-list");
const message = document.getElementById("message");
const emptyState = document.getElementById("empty-state");

// The exact key used to store projects in the browser.
const STORAGE_KEY = "workshop-projects-v1";

// These are the valid project statuses in the HTML dropdown.
const VALID_STATUSES = ["Planned", "In Progress", "Completed"];

// Projects are loaded from localStorage when the page starts.
let projects = [];
let editingId = null;
let idCounter = 0;

// If stored data cannot be read or is invalid, prevent accidental overwriting.
let storageReady = true;

// Check that saved data has the expected structure.
function isValidProjects(data) {
  if (!Array.isArray(data)) {
    return false;
  }

  const ids = new Set();

  for (const project of data) {
    if (
      project === null ||
      typeof project !== "object" ||
      typeof project.id !== "string" ||
      project.id.trim() === "" ||
      typeof project.name !== "string" ||
      project.name.trim() === "" ||
      typeof project.status !== "string" ||
      !VALID_STATUSES.includes(project.status) ||
      ids.has(project.id)
    ) {
      return false;
    }

    ids.add(project.id);
  }

  return true;
}

// Load saved projects when the page opens.
function loadProjects() {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY);

    // No saved data means this is the first visit.
    if (savedData === null) {
      projects = [];
      return;
    }

    // Convert the saved JSON text into a JavaScript value.
    const parsedData = JSON.parse(savedData);

    // Do not accept unexpected or damaged data.
    if (!isValidProjects(parsedData)) {
      storageReady = false;
      message.textContent =
        "Saved project data is invalid. It has not been overwritten. " +
        "Please check the browser storage before continuing.";
      return;
    }

    projects = parsedData;
  } catch (error) {
    storageReady = false;
    message.textContent =
      "Could not read saved projects from this browser. " +
      "Your stored data has not been intentionally changed.";
  }
}

// Save the current project array as JSON text.
function saveProjects() {
  if (!storageReady) {
    message.textContent =
      "Changes are disabled because saved data could not be loaded safely.";
    return false;
  }

  try {
    const jsonData = JSON.stringify(projects);
    localStorage.setItem(STORAGE_KEY, jsonData);
    return true;
  } catch (error) {
    message.textContent =
      "Could not save changes to this browser. " +
      "Your previous project data has been kept.";
    return false;
  }
}

// Create a unique ID for each new project.
function createId() {
  idCounter += 1;
  return "project-" + Date.now() + "-" + idCounter;
}

// Return the form to Add mode.
function exitEditMode() {
  editingId = null;
  form.reset();
  saveButton.textContent = "Save project";
  cancelButton.hidden = true;
}

// Start editing an existing project.
function startEdit(project) {
  if (!storageReady) {
    return;
  }

  editingId = project.id;
  nameInput.value = project.name;
  statusSelect.value = project.status;

  saveButton.textContent = "Update project";
  cancelButton.hidden = false;

  message.textContent = 'Editing "' + project.name + '".';
  nameInput.focus();
}

// Delete a project and save the change.
function deleteProject(id) {
  if (!storageReady) {
    return;
  }

  const index = projects.findIndex(function (project) {
    return project.id === id;
  });

  if (index === -1) {
    return;
  }

  // Keep the deleted project so we can restore it if saving fails.
  const removed = projects[index];

  projects.splice(index, 1);

  if (!saveProjects()) {
    // Restore the original project if localStorage could not save.
    projects.splice(index, 0, removed);
    renderProjects();
    return;
  }

  // Leave edit mode if the deleted project was being edited.
  if (editingId === id) {
    exitEditMode();
  }

  renderProjects();
  message.textContent = 'Deleted "' + removed.name + '".';
  nameInput.focus();
}

// Display all projects on the page.
function renderProjects() {
  projectList.textContent = "";

  projects.forEach(function (project) {
    const item = document.createElement("li");

    const text = document.createElement("span");
    text.textContent = project.name + " — " + project.status;

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.textContent = "Edit";
    editButton.setAttribute("aria-label", "Edit " + project.name);

    editButton.addEventListener("click", function () {
      startEdit(project);
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";
    deleteButton.setAttribute("aria-label", "Delete " + project.name);

    deleteButton.addEventListener("click", function () {
      deleteProject(project.id);
    });

    item.appendChild(text);
    item.appendChild(editButton);
    item.appendChild(deleteButton);

    projectList.appendChild(item);
  });

  // Show the empty message only when there are no projects.
  emptyState.hidden = projects.length > 0;
}

// Handle adding a new project or saving an edit.
form.addEventListener("submit", function (event) {
  event.preventDefault();

  if (!storageReady) {
    message.textContent =
      "Cannot save changes until the saved project data can be loaded safely.";
    return;
  }

  const name = nameInput.value.trim();
  const status = statusSelect.value;

  if (name === "") {
    message.textContent = "Please enter a project name.";
    nameInput.focus();
    return;
  }

  if (!VALID_STATUSES.includes(status)) {
    message.textContent = "Please select a valid project status.";
    return;
  }

  // EDIT an existing project.
  if (editingId !== null) {
    const project = projects.find(function (item) {
      return item.id === editingId;
    });

    if (!project) {
      message.textContent = "Could not find the project being edited.";
      exitEditMode();
      renderProjects();
      return;
    }

    // Keep the original values in case saving fails.
    const oldName = project.name;
    const oldStatus = project.status;

    project.name = name;
    project.status = status;

    if (!saveProjects()) {
      // Undo the edit if saving fails.
      project.name = oldName;
      project.status = oldStatus;
      renderProjects();
      return;
    }

    renderProjects();
    exitEditMode();
    message.textContent = "Project updated and saved.";
    nameInput.focus();
    return;
  }

  // ADD a new project.
  const newProject = {
    id: createId(),
    name: name,
    status: status
  };

  projects.push(newProject);

  if (!saveProjects()) {
    // Undo the addition if saving fails.
    projects.pop();
    renderProjects();
    return;
  }

  renderProjects();
  exitEditMode();
  message.textContent = "Project added and saved.";
  nameInput.focus();
});

// Cancel editing without changing the saved project.
cancelButton.addEventListener("click", function () {
  exitEditMode();
  message.textContent = "Edit cancelled. No changes were saved.";
  nameInput.focus();
});

// Start the application.
loadProjects();
renderProjects();