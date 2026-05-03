const state = {
  files: [],
  activePath: null,
  previewToken: null,
  mediaTargets: [],
  isCreatePanelOpen: false,
};

const elements = {
  fileTree: document.getElementById("file-tree"),
  activeLabel: document.getElementById("active-label"),
  activePath: document.getElementById("active-path"),
  markdownEditor: document.getElementById("markdown-editor"),
  renderedPreview: document.getElementById("rendered-preview"),
  editorToolbar: document.getElementById("editor-toolbar"),
  errorList: document.getElementById("error-list"),
  warningList: document.getElementById("warning-list"),
  validateButton: document.getElementById("validate-button"),
  previewButton: document.getElementById("preview-button"),
  saveButton: document.getElementById("save-button"),
  preview: document.getElementById("preview"),
  previewCount: document.getElementById("preview-count"),
  previewList: document.getElementById("preview-list"),
  uploadTarget: document.getElementById("upload-target"),
  uploadFile: document.getElementById("upload-file"),
  uploadButton: document.getElementById("upload-button"),
  uploadResult: document.getElementById("upload-result"),
  createProjectForm: document.getElementById("create-project-form"),
  createCompanyForm: document.getElementById("create-company-form"),
  createAboutForm: document.getElementById("create-about-form"),
  quickCreatePanel: document.getElementById("quick-create-panel"),
  toggleCreateButton: document.getElementById("toggle-create-button"),
  createResult: document.getElementById("create-result"),
  newProjectTitle: document.getElementById("new-project-title"),
  newProjectOrganization: document.getElementById("new-project-organization"),
  newProjectSummary: document.getElementById("new-project-summary"),
  newCompanyName: document.getElementById("new-company-name"),
  newCompanySummary: document.getElementById("new-company-summary"),
  aboutSection: document.getElementById("about-section"),
  aboutText: document.getElementById("about-text"),
};

let renderDebounce = null;

function setCreatePanelOpen(open) {
  state.isCreatePanelOpen = open;

  elements.quickCreatePanel.classList.toggle("hidden", !open);
  elements.quickCreatePanel.setAttribute("aria-hidden", String(!open));
  elements.toggleCreateButton.textContent = open ? "Close Add" : "Add New";
}

function toggleCreatePanel() {
  setCreatePanelOpen(!state.isCreatePanelOpen);
}

function clearMessages() {
  elements.errorList.innerHTML = "";
  elements.warningList.innerHTML = "";
}

function renderMessages(errors = [], warnings = []) {
  clearMessages();

  errors.forEach((message) => {
    const item = document.createElement("li");
    item.className = "error";
    item.textContent = message;
    elements.errorList.appendChild(item);
  });

  warnings.forEach((message) => {
    const item = document.createElement("li");
    item.className = "warning";
    item.textContent = message;
    elements.warningList.appendChild(item);
  });
}

function resetPreview() {
  state.previewToken = null;
  elements.saveButton.disabled = true;
  elements.preview.classList.add("hidden");
  elements.previewCount.textContent = "";
  elements.previewList.innerHTML = "";
}

async function apiGet(url) {
  const response = await fetch(url);
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "Request failed");
  return payload;
}

async function apiPost(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const payload = await response.json();
  if (!response.ok) {
    const error = new Error(payload.error || "Request failed");
    error.payload = payload;
    throw error;
  }

  return payload;
}

function groupFiles(files) {
  const grouped = {
    about: files.filter((file) => file.section === "about"),
    companies: files.filter((file) => file.section === "companies"),
    projects: files.filter((file) => file.section === "projects"),
    other: files.filter(
      (file) => !["about", "companies", "projects"].includes(file.section),
    ),
  };

  const projectsByOrg = new Map();
  grouped.projects.forEach((file) => {
    const org = file.organization || "Independent";
    if (!projectsByOrg.has(org)) projectsByOrg.set(org, []);
    projectsByOrg.get(org).push(file);
  });

  return { grouped, projectsByOrg };
}

function createFileButton(file) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `file-button ${state.activePath === file.path ? "active" : ""}`;

  const title = document.createElement("div");
  title.className = "file-title";
  title.textContent = file.label;

  const meta = document.createElement("div");
  meta.className = "file-meta";
  meta.textContent = file.path;

  button.appendChild(title);
  button.appendChild(meta);

  button.addEventListener("click", () => {
    loadFile(file.path).catch((error) => renderMessages([error.message], []));
  });

  return button;
}

function renderSection(title, files) {
  if (files.length === 0) return null;

  const wrapper = document.createElement("details");
  wrapper.className = "tree-group";
  wrapper.open = true;

  const summary = document.createElement("summary");
  summary.textContent = title;
  wrapper.appendChild(summary);

  const body = document.createElement("div");
  body.className = "tree-group-body";
  files.forEach((file) => body.appendChild(createFileButton(file)));

  wrapper.appendChild(body);
  return wrapper;
}

function renderFileTree() {
  const { grouped, projectsByOrg } = groupFiles(state.files);
  elements.fileTree.innerHTML = "";

  const aboutBlock = renderSection("About", grouped.about);
  if (aboutBlock) elements.fileTree.appendChild(aboutBlock);

  const companyBlock = renderSection("Companies", grouped.companies);
  if (companyBlock) elements.fileTree.appendChild(companyBlock);

  if (projectsByOrg.size > 0) {
    const projectsWrapper = document.createElement("details");
    projectsWrapper.className = "tree-group";
    projectsWrapper.open = true;

    const projectsSummary = document.createElement("summary");
    projectsSummary.textContent = "Projects";
    projectsWrapper.appendChild(projectsSummary);

    const projectsBody = document.createElement("div");
    projectsBody.className = "tree-group-body";

    Array.from(projectsByOrg.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([organization, files]) => {
        const orgGroup = document.createElement("details");
        orgGroup.className = "tree-subgroup";

        const orgSummary = document.createElement("summary");
        orgSummary.textContent = organization;
        orgGroup.appendChild(orgSummary);

        const orgBody = document.createElement("div");
        orgBody.className = "tree-group-body";
        files.forEach((file) => orgBody.appendChild(createFileButton(file)));
        orgGroup.appendChild(orgBody);

        projectsBody.appendChild(orgGroup);
      });

    projectsWrapper.appendChild(projectsBody);
    elements.fileTree.appendChild(projectsWrapper);
  }

  const otherBlock = renderSection("Other Content", grouped.other);
  if (otherBlock) elements.fileTree.appendChild(otherBlock);
}

function setUploadTargets() {
  elements.uploadTarget.innerHTML = "";
  state.mediaTargets.forEach((target) => {
    const option = document.createElement("option");
    option.value = target.id;
    option.textContent = `${target.label} (${target.relativeDir})`;
    elements.uploadTarget.appendChild(option);
  });
}

async function renderMarkdownPreview() {
  try {
    const payload = await apiPost("/api/render", {
      content: elements.markdownEditor.value,
    });
    elements.renderedPreview.innerHTML = payload.html;
  } catch (error) {
    elements.renderedPreview.innerHTML = `<p class="preview-error">${error.message}</p>`;
  }
}

function scheduleRender() {
  if (renderDebounce) window.clearTimeout(renderDebounce);
  renderDebounce = window.setTimeout(() => {
    renderMarkdownPreview();
  }, 140);
}

async function loadFile(pathValue) {
  const payload = await apiGet(`/api/file?path=${encodeURIComponent(pathValue)}`);
  const file = state.files.find((entry) => entry.path === payload.path);

  state.activePath = payload.path;
  elements.markdownEditor.value = payload.content;
  elements.activeLabel.textContent = file?.label || payload.path;
  elements.activePath.textContent = payload.path;

  renderFileTree();
  resetPreview();
  renderMessages([], []);
  scheduleRender();
}

async function validateDraft() {
  if (!state.activePath) return;

  try {
    const payload = await apiPost("/api/validate", {
      content: elements.markdownEditor.value,
    });
    renderMessages(payload.errors, payload.warnings);
  } catch (error) {
    const errors = error.payload?.errors ?? [error.message];
    const warnings = error.payload?.warnings ?? [];
    renderMessages(errors, warnings);
  }
}

function renderPreview(payload) {
  elements.preview.classList.remove("hidden");
  elements.previewCount.textContent = `${payload.changeCount} changed line(s).`;
  elements.previewList.innerHTML = "";

  payload.changes.forEach((change) => {
    const item = document.createElement("li");
    item.textContent = `Line ${change.line}: ${change.before} -> ${change.after}`;
    elements.previewList.appendChild(item);
  });
}

async function previewDraft() {
  if (!state.activePath) return;

  try {
    const payload = await apiPost("/api/preview", {
      path: state.activePath,
      content: elements.markdownEditor.value,
    });

    state.previewToken = payload.token;
    renderMessages([], payload.warnings);
    renderPreview(payload);
    elements.saveButton.disabled = false;
  } catch (error) {
    const errors = error.payload?.errors ?? [error.message];
    const warnings = error.payload?.warnings ?? [];
    renderMessages(errors, warnings);
    resetPreview();
  }
}

async function saveDraft() {
  if (!state.activePath || !state.previewToken) return;

  try {
    const payload = await apiPost("/api/save", {
      path: state.activePath,
      token: state.previewToken,
      content: elements.markdownEditor.value,
    });

    resetPreview();
    renderMessages([], [`Saved ${payload.path}. Backup: ${payload.backupFile}`]);
  } catch (error) {
    const errors = error.payload?.errors ?? [error.message];
    const warnings = error.payload?.warnings ?? [];
    renderMessages(errors, warnings);
  }
}

function insertAtCursor(prefix, suffix = "", placeholder = "text") {
  const textarea = elements.markdownEditor;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = textarea.value.slice(start, end) || placeholder;

  const replacement = `${prefix}${selected}${suffix}`;
  textarea.setRangeText(replacement, start, end, "end");
  textarea.focus();
  resetPreview();
  scheduleRender();
}

function insertLinePrefix(prefix) {
  const textarea = elements.markdownEditor;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = textarea.value.slice(start, end) || "item";
  const lines = selected.split("\n").map((line) => `${prefix}${line}`).join("\n");

  textarea.setRangeText(lines, start, end, "end");
  textarea.focus();
  resetPreview();
  scheduleRender();
}

function runToolbarAction(action) {
  if (action === "bold") insertAtCursor("**", "**", "bold text");
  if (action === "italic") insertAtCursor("*", "*", "italic text");
  if (action === "h2") insertLinePrefix("## ");
  if (action === "list") insertLinePrefix("- ");
  if (action === "code") insertAtCursor("`", "`", "code");
  if (action === "link") insertAtCursor("[", "](https://example.com)", "link text");
  if (action === "html") insertAtCursor("<div>", "</div>", "html block");
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      const commaIndex = result.indexOf(",");
      if (commaIndex === -1) {
        reject(new Error("Unable to encode file."));
        return;
      }
      resolve(result.slice(commaIndex + 1));
    };

    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsDataURL(file);
  });
}

async function uploadFile() {
  const file = elements.uploadFile.files?.[0];
  const targetId = elements.uploadTarget.value;

  if (!file) {
    elements.uploadResult.textContent = "Choose a file first.";
    return;
  }

  if (!targetId) {
    elements.uploadResult.textContent = "Select a target folder.";
    return;
  }

  try {
    const base64 = await fileToBase64(file);
    const payload = await apiPost("/api/upload", {
      targetId,
      fileName: file.name,
      base64,
      mimeType: file.type,
    });

    elements.uploadResult.textContent = `Uploaded ${payload.relativePath}. Use ${payload.publicPath} in frontmatter.`;
  } catch (error) {
    elements.uploadResult.textContent = `Upload failed: ${error.message}`;
  }
}

async function createProject(event) {
  event.preventDefault();

  try {
    const payload = await apiPost("/api/create", {
      kind: "project",
      title: elements.newProjectTitle.value,
      organization: elements.newProjectOrganization.value,
      summary: elements.newProjectSummary.value,
    });

    elements.createResult.textContent = `Created ${payload.path}`;
    elements.createProjectForm.reset();
    await refreshFileTree(payload.path);
    setCreatePanelOpen(false);
  } catch (error) {
    elements.createResult.textContent = error.message;
  }
}

async function createCompany(event) {
  event.preventDefault();

  try {
    const payload = await apiPost("/api/create", {
      kind: "company",
      companyName: elements.newCompanyName.value,
      summary: elements.newCompanySummary.value,
    });

    elements.createResult.textContent = `Created ${payload.path}`;
    elements.createCompanyForm.reset();
    await refreshFileTree(payload.path);
    setCreatePanelOpen(false);
  } catch (error) {
    elements.createResult.textContent = error.message;
  }
}

async function createAbout(event) {
  event.preventDefault();

  try {
    const payload = await apiPost("/api/create", {
      kind: "about",
      section: elements.aboutSection.value,
      text: elements.aboutText.value,
    });

    elements.createResult.textContent = `Updated ${payload.path}`;
    elements.createAboutForm.reset();
    await refreshFileTree(payload.path);
    setCreatePanelOpen(false);
  } catch (error) {
    elements.createResult.textContent = error.message;
  }
}

async function refreshFileTree(preferredPath) {
  const payload = await apiGet("/api/files");
  state.files = payload.files;
  state.mediaTargets = payload.mediaTargets;

  renderFileTree();
  setUploadTargets();

  const targetPath = preferredPath || state.activePath || payload.files[0]?.path;
  if (targetPath) {
    await loadFile(targetPath);
  }
}

async function init() {
  try {
    await refreshFileTree();
  } catch (error) {
    renderMessages([error.message], []);
  }
}

elements.markdownEditor.addEventListener("input", () => {
  resetPreview();
  scheduleRender();
});

elements.editorToolbar.addEventListener("click", (event) => {
  const action = event.target.getAttribute("data-action");
  if (!action) return;
  runToolbarAction(action);
});

elements.validateButton.addEventListener("click", () => {
  validateDraft().catch((err) => renderMessages([err.message], []));
});

elements.previewButton.addEventListener("click", () => {
  previewDraft().catch((err) => renderMessages([err.message], []));
});

elements.saveButton.addEventListener("click", () => {
  saveDraft().catch((err) => renderMessages([err.message], []));
});

elements.uploadButton.addEventListener("click", () => {
  uploadFile().catch((err) => { elements.uploadResult.textContent = err.message; });
});

elements.toggleCreateButton.addEventListener("click", () => {
  toggleCreatePanel();
});

elements.createProjectForm.addEventListener("submit", (event) => {
  createProject(event).catch((err) => { elements.createResult.textContent = err.message; });
});

elements.createCompanyForm.addEventListener("submit", (event) => {
  createCompany(event).catch((err) => { elements.createResult.textContent = err.message; });
});

elements.createAboutForm.addEventListener("submit", (event) => {
  createAbout(event).catch((err) => { elements.createResult.textContent = err.message; });
});

init();
