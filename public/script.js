const form = document.getElementById("project-form");
const nameInput = document.getElementById("name");
const statusSelect = document.getElementById("status");
const saveButton = document.getElementById("save-button");
const cancelButton = document.getElementById("cancel-button");
const projectList = document.getElementById("project-list");
const message = document.getElementById("message");
const emptyState = document.getElementById("empty-state");

// The only place projects are stored. Starts empty on every page load.
const projects = [];
let idCounter = 0;

// null means "adding a new project"; otherwise the id of the project being edited.
let editingId = null;

function createId() {
  idCounter += 1;
  return "project-" + Date.now() + "-" + idCounter;
}

function exitEditMode() {
  editingId = null;
  form.reset();
  saveButton.textContent = "Save project";
  cancelButton.hidden = true;
}

function startEdit(project) {
  editingId = project.id;
  nameInput.value = project.name;
  statusSelect.value = project.status;
  saveButton.textContent = "Update project";
  cancelButton.hidden = false;
  message.textContent = "Editing \"" + project.name + "\".";
  nameInput.focus();
}

function deleteProject(id) {
  const index = projects.findIndex(function (p) {
    return p.id === id;
  });

  if (index === -1) {
    return;
  }

  const removed = projects.splice(index, 1)[0];

  // If the deleted project was being edited, leave edit mode.
  if (editingId === id) {
    exitEditMode();
  }

  renderProjects();
  message.textContent = "Deleted \"" + removed.name + "\".";
  nameInput.focus();
}

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

  if (emptyState) {
    emptyState.hidden = projects.length > 0;
  }
}

form.addEventListener("submit", function (event) {
  event.preventDefault();

  const name = nameInput.value.trim();
  const status = statusSelect.value;

  if (name === "") {
    message.textContent = "Please enter a project name.";
    nameInput.focus();
    return;
  }

  if (editingId !== null) {
    const project = projects.find(function (p) {
      return p.id === editingId;
    });

    if (project) {
      project.name = name;
      project.status = status;
    }

    message.textContent = "Project updated.";
  } else {
    projects.push({
      id: createId(),
      name: name,
      status: status
    });

    message.textContent = "";
  }

  renderProjects();
  exitEditMode();
  nameInput.focus();
});

cancelButton.addEventListener("click", function () {
  exitEditMode();
  message.textContent = "Edit cancelled.";
  nameInput.focus();
});

renderProjects();