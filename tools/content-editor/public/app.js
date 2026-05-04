const MODE_FORM = "form";
const MODE_RAW = "raw";

const state = {
  files: [],
  activePath: null,
  previewToken: null,
  mediaTargets: [],
  isCreatePanelOpen: false,
  editorMode: MODE_FORM,
  rawDirty: false,
  formModel: null,
};

const elements = {
  fileTree: document.getElementById("file-tree"),
  activeLabel: document.getElementById("active-label"),
  activePath: document.getElementById("active-path"),
  markdownEditor: document.getElementById("markdown-editor"),
  bodyEditor: document.getElementById("body-editor"),
  unknownFrontmatterEditor: document.getElementById("unknown-frontmatter-editor"),
  renderedPreview: document.getElementById("rendered-preview"),
  editorToolbar: document.getElementById("editor-toolbar"),
  formEditor: document.getElementById("form-editor"),
  formEditorPanel: document.getElementById("form-editor-panel"),
  rawEditorPanel: document.getElementById("raw-editor-panel"),
  modeFormButton: document.getElementById("mode-form-button"),
  modeRawButton: document.getElementById("mode-raw-button"),
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
  refreshMediaButton: document.getElementById("refresh-media-button"),
  mediaLibrary: document.getElementById("media-library"),
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
let composeDebounce = null;

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
  const previousValue = elements.uploadTarget.value;
  elements.uploadTarget.innerHTML = "";
  state.mediaTargets.forEach((target) => {
    const option = document.createElement("option");
    option.value = target.id;
    option.textContent = `${target.label} (${target.relativeDir})`;
    elements.uploadTarget.appendChild(option);
  });

  if (previousValue && state.mediaTargets.some((target) => target.id === previousValue)) {
    elements.uploadTarget.value = previousValue;
  }
}

async function copyTextToClipboard(text) {
  try {
    const clipboard = globalThis.navigator?.clipboard;
    if (!clipboard || typeof clipboard.writeText !== "function") {
      throw new Error("Clipboard API unavailable");
    }

    await clipboard.writeText(text);
    elements.uploadResult.textContent = `Copied ${text} to clipboard.`;
  } catch {
    elements.uploadResult.textContent = `Copy failed. Path: ${text}`;
  }
}

function mediaTypeLabel(kind) {
  if (kind === "video") return "Video";
  if (kind === "image") return "Image";
  return "Media";
}

function inferSectionFromActivePath() {
  const normalized = String(state.activePath ?? "").replace(/\\/g, "/");
  const section = normalized.split("/")[2] ?? "";
  return section;
}

function renderConfiguredMediaPreview(section, items = []) {
  elements.mediaLibrary.innerHTML = "";

  if (!Array.isArray(items) || items.length === 0) {
    const empty = document.createElement("p");
    empty.className = "media-library__empty";
    const sectionLabel = section === "projects" ? "project"
      : section === "companies" ? "company"
      : section === "about" ? "about"
      : "current";
    empty.textContent = `No media configured for this ${sectionLabel} yet.`;
    elements.mediaLibrary.appendChild(empty);
    return;
  }

  items.forEach((item) => {
    const card = document.createElement("div");
    card.className = "media-library__item";

    const name = document.createElement("div");
    name.className = "media-library__name";
    name.textContent = item.label || item.src;

    const meta = document.createElement("div");
    meta.className = "media-library__meta";
    meta.textContent = mediaTypeLabel(item.kind);

    if (item.kind === "image") {
      const image = document.createElement("img");
      image.className = "media-library__preview";
      image.src = item.src;
      image.alt = item.alt || item.label || "Configured image";
      image.loading = "lazy";
      card.appendChild(image);
    }

    if (item.kind === "video") {
      const video = document.createElement("video");
      video.className = "media-library__preview";
      video.src = item.src;
      video.controls = true;
      video.muted = true;
      video.preload = "metadata";
      if (item.poster) video.poster = item.poster;
      card.appendChild(video);
    }

    const pathButton = document.createElement("button");
    pathButton.type = "button";
    pathButton.className = "media-library__path";
    pathButton.textContent = item.src;
    pathButton.title = "Click to copy public path";
    pathButton.addEventListener("click", () => {
      copyTextToClipboard(item.src).catch((error) => {
        elements.uploadResult.textContent = `Copy failed: ${error.message}`;
      });
    });

    card.appendChild(name);
    card.appendChild(meta);
    card.appendChild(pathButton);
    elements.mediaLibrary.appendChild(card);
  });
}

async function refreshConfiguredMediaPreview(content) {
  if (!state.activePath) {
    renderConfiguredMediaPreview(inferSectionFromActivePath(), []);
    return;
  }

  try {
    const payload = await apiPost("/api/media-preview", {
      path: state.activePath,
      content,
    });
    renderConfiguredMediaPreview(payload.section, payload.items ?? []);
  } catch (error) {
    renderConfiguredMediaPreview(inferSectionFromActivePath(), []);
    elements.uploadResult.textContent = `Configured media preview failed: ${error.message}`;
  }
}

async function renderMarkdownPreview() {
  try {
    const content = elements.markdownEditor.value;
    const payload = await apiPost("/api/render", {
      content,
    });
    elements.renderedPreview.innerHTML = payload.html;
    await refreshConfiguredMediaPreview(content);
  } catch (error) {
    elements.renderedPreview.innerHTML = `<p class="preview-error">${error.message}</p>`;
    await refreshConfiguredMediaPreview(elements.markdownEditor.value);
  }
}

function scheduleRawRender() {
  if (renderDebounce) window.clearTimeout(renderDebounce);
  renderDebounce = window.setTimeout(() => {
    renderMarkdownPreview();
  }, 140);
}

function scheduleFormCompose() {
  if (composeDebounce) window.clearTimeout(composeDebounce);
  composeDebounce = window.setTimeout(() => {
    composeMarkdownFromForm().catch((error) => renderMessages([error.message], []));
  }, 140);
}

function setModeButtonStates() {
  elements.modeFormButton.classList.toggle("is-active", state.editorMode === MODE_FORM);
  elements.modeRawButton.classList.toggle("is-active", state.editorMode === MODE_RAW);
}

function getActiveTextarea() {
  return state.editorMode === MODE_RAW ? elements.markdownEditor : elements.bodyEditor;
}

async function setEditorMode(mode) {
  if (!state.activePath || state.editorMode === mode) {
    state.editorMode = mode;
    elements.formEditorPanel.classList.toggle("hidden", mode !== MODE_FORM);
    elements.rawEditorPanel.classList.toggle("hidden", mode !== MODE_RAW);
    setModeButtonStates();
    return true;
  }

  if (mode === MODE_RAW) {
    await composeMarkdownFromForm({ render: false });
    state.rawDirty = false;
  }

  if (mode === MODE_FORM && state.rawDirty) {
    const shouldConvert = window.confirm(
      "You changed raw markdown. Switch back to form mode and reparse markdown into structured fields?",
    );

    if (!shouldConvert) return false;

    await loadFormModel(state.activePath, elements.markdownEditor.value);
    state.rawDirty = false;
  }

  state.editorMode = mode;
  elements.formEditorPanel.classList.toggle("hidden", mode !== MODE_FORM);
  elements.rawEditorPanel.classList.toggle("hidden", mode !== MODE_RAW);
  setModeButtonStates();

  return true;
}

function createFieldHelp(text) {
  const hint = document.createElement("div");
  hint.className = "form-help";
  hint.textContent = text;
  return hint;
}

function renderFormFields(model) {
  elements.formEditor.innerHTML = "";

  if (!model || !Array.isArray(model.schema) || model.schema.length === 0) {
    const note = document.createElement("p");
    note.className = "muted";
    note.textContent = "No structured fields are available for this file.";
    elements.formEditor.appendChild(note);
    return;
  }

  const grid = document.createElement("div");
  grid.className = "form-grid";

  for (const field of model.schema) {
    const fieldWrap = document.createElement("div");
    fieldWrap.className = "form-field";
    if (["textarea", "list"].includes(field.type)) {
      fieldWrap.classList.add("form-field--full");
    }

    const label = document.createElement("label");
    label.htmlFor = `fm-${field.key}`;
    label.textContent = field.required ? `${field.label} (required)` : field.label;
    fieldWrap.appendChild(label);

    const value = model.values[field.key];
    let input;

    if (field.type === "textarea" || field.type === "list") {
      input = document.createElement("textarea");
      input.rows = field.type === "list" ? 4 : 5;
      input.value = value ?? "";
      if (field.placeholder) input.placeholder = field.placeholder;
      input.addEventListener("input", () => {
        state.formModel.values[field.key] = input.value;
        resetPreview();
        if (state.editorMode === MODE_FORM) scheduleFormCompose();
      });
    } else if (field.type === "boolean") {
      const checkboxWrap = document.createElement("label");
      checkboxWrap.className = "form-checkbox";
      input = document.createElement("input");
      input.type = "checkbox";
      input.checked = Boolean(value);
      checkboxWrap.appendChild(input);

      const checkboxText = document.createElement("span");
      checkboxText.textContent = "Enabled";
      checkboxWrap.appendChild(checkboxText);

      input.addEventListener("change", () => {
        state.formModel.values[field.key] = input.checked;
        resetPreview();
        if (state.editorMode === MODE_FORM) scheduleFormCompose();
      });

      fieldWrap.appendChild(checkboxWrap);
      if (field.placeholder) fieldWrap.appendChild(createFieldHelp(field.placeholder));
      grid.appendChild(fieldWrap);
      continue;
    } else if (field.type === "select") {
      input = document.createElement("select");
      for (const optionValue of field.options ?? []) {
        const option = document.createElement("option");
        option.value = optionValue;
        option.textContent = optionValue;
        if (String(value ?? "") === optionValue) option.selected = true;
        input.appendChild(option);
      }

      input.addEventListener("change", () => {
        state.formModel.values[field.key] = input.value;
        resetPreview();
        if (state.editorMode === MODE_FORM) scheduleFormCompose();
      });
    } else {
      input = document.createElement("input");
      input.type = field.type === "number" ? "number" : "text";
      input.value = value ?? "";
      if (field.placeholder) input.placeholder = field.placeholder;
      input.addEventListener("input", () => {
        state.formModel.values[field.key] = input.value;
        resetPreview();
        if (state.editorMode === MODE_FORM) scheduleFormCompose();
      });
    }

    input.id = `fm-${field.key}`;
    fieldWrap.appendChild(input);
    if (field.placeholder) {
      fieldWrap.appendChild(createFieldHelp(field.placeholder));
    }

    grid.appendChild(fieldWrap);
  }

  elements.formEditor.appendChild(grid);
}

async function loadFormModel(pathValue, content) {
  const model = await apiPost("/api/form-model", {
    path: pathValue,
    content,
  });

  state.formModel = model;
  elements.bodyEditor.value = model.body ?? "";
  elements.unknownFrontmatterEditor.value = model.unknownFrontmatter ?? "";
  renderFormFields(model);
}

async function composeMarkdownFromForm(options = { render: true }) {
  if (!state.activePath || !state.formModel) return elements.markdownEditor.value;

  state.formModel.body = elements.bodyEditor.value;
  state.formModel.unknownFrontmatter = elements.unknownFrontmatterEditor.value;

  const payload = await apiPost("/api/compose", {
    path: state.activePath,
    values: state.formModel.values,
    body: state.formModel.body,
    unknownFrontmatter: state.formModel.unknownFrontmatter,
    context: state.formModel.context,
  });

  elements.markdownEditor.value = payload.content;
  if (options.render) {
    await renderMarkdownPreview();
  }

  return payload.content;
}

async function loadFile(pathValue) {
  const payload = await apiGet(`/api/file?path=${encodeURIComponent(pathValue)}`);
  const file = state.files.find((entry) => entry.path === payload.path);

  state.activePath = payload.path;
  state.rawDirty = false;
  elements.markdownEditor.value = payload.content;
  elements.activeLabel.textContent = file?.label || payload.path;
  elements.activePath.textContent = payload.path;

  await loadFormModel(payload.path, payload.content);

  renderFileTree();
  resetPreview();
  renderMessages([], []);

  if (state.editorMode === MODE_FORM) {
    await composeMarkdownFromForm();
  } else {
    scheduleRawRender();
  }
}

async function getCurrentMarkdownContent() {
  if (state.editorMode === MODE_FORM) {
    return composeMarkdownFromForm({ render: false });
  }

  return elements.markdownEditor.value;
}

async function validateDraft() {
  if (!state.activePath) return;

  try {
    const content = await getCurrentMarkdownContent();
    const payload = await apiPost("/api/validate", { content });
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
    const content = await getCurrentMarkdownContent();
    const payload = await apiPost("/api/preview", {
      path: state.activePath,
      content,
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
    const content = await getCurrentMarkdownContent();
    const payload = await apiPost("/api/save", {
      path: state.activePath,
      token: state.previewToken,
      content,
    });

    resetPreview();
    if (payload.skipped) {
      renderMessages([], [`No changes to save in ${payload.path}.`]);
    } else {
      renderMessages([], [`Saved ${payload.path}. Backup: ${payload.backupFile}`]);
    }
  } catch (error) {
    const errors = error.payload?.errors ?? [error.message];
    const warnings = error.payload?.warnings ?? [];
    renderMessages(errors, warnings);
  }
}

function insertAtCursor(textarea, prefix, suffix = "", placeholder = "text") {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = textarea.value.slice(start, end) || placeholder;

  const replacement = `${prefix}${selected}${suffix}`;
  textarea.setRangeText(replacement, start, end, "end");
  textarea.focus();
}

function insertLinePrefix(textarea, prefix) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = textarea.value.slice(start, end) || "item";
  const lines = selected.split("\n").map((line) => `${prefix}${line}`).join("\n");

  textarea.setRangeText(lines, start, end, "end");
  textarea.focus();
}

function runToolbarAction(action) {
  const textarea = getActiveTextarea();
  if (!textarea) return;

  if (action === "bold") insertAtCursor(textarea, "**", "**", "bold text");
  if (action === "italic") insertAtCursor(textarea, "*", "*", "italic text");
  if (action === "h2") insertLinePrefix(textarea, "## ");
  if (action === "list") insertLinePrefix(textarea, "- ");
  if (action === "code") insertAtCursor(textarea, "`", "`", "code");
  if (action === "link") insertAtCursor(textarea, "[", "](https://example.com)", "link text");
  if (action === "html") insertAtCursor(textarea, "<div>", "</div>", "html block");

  resetPreview();
  if (state.editorMode === MODE_FORM) {
    scheduleFormCompose();
  } else {
    state.rawDirty = true;
    scheduleRawRender();
  }
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
    await refreshConfiguredMediaPreview(elements.markdownEditor.value);
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
    await setEditorMode(MODE_FORM);
  } catch (error) {
    renderMessages([error.message], []);
  }
}

elements.modeFormButton.addEventListener("click", () => {
  setEditorMode(MODE_FORM).catch((err) => renderMessages([err.message], []));
});

elements.modeRawButton.addEventListener("click", () => {
  setEditorMode(MODE_RAW).catch((err) => renderMessages([err.message], []));
});

elements.bodyEditor.addEventListener("input", () => {
  resetPreview();
  if (state.editorMode === MODE_FORM) scheduleFormCompose();
});

elements.unknownFrontmatterEditor.addEventListener("input", () => {
  resetPreview();
  if (state.editorMode === MODE_FORM) scheduleFormCompose();
});

elements.markdownEditor.addEventListener("input", () => {
  resetPreview();
  state.rawDirty = true;
  if (state.editorMode === MODE_RAW) {
    scheduleRawRender();
  }
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

elements.refreshMediaButton.addEventListener("click", () => {
  refreshConfiguredMediaPreview(elements.markdownEditor.value).catch((err) => {
    elements.uploadResult.textContent = err.message;
  });
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
