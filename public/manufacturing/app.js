const fieldSets = {
  WEBSITE: {
    columns: ["url"],
    lineHint: "Enter one website URL per line.",
    csvHint: "CSV columns: url",
    sample: "https://example.local/asset-001\nhttps://example.local/asset-002"
  },
  TEXT: {
    columns: ["text"],
    lineHint: "Enter one text value per line.",
    csvHint: "CSV columns: text",
    sample: "Asset 001\nAsset 002"
  },
  URI: {
    columns: ["uri"],
    lineHint: "Enter one URI per line.",
    csvHint: "CSV columns: uri",
    sample: "ftp://user@host/file-001.txt\nurn:internal:asset:002"
  },
  PHONE: {
    columns: ["phone"],
    lineHint: "Enter one phone number per line.",
    csvHint: "CSV columns: phone",
    sample: "01234567890\n02079460000"
  },
  SMS: {
    columns: ["phone", "message"],
    lineHint: "Use CSV rows because SMS needs phone and message.",
    csvHint: "CSV columns: phone,message",
    sample: "01234567890,Door opened\n02079460000,Inspection due"
  },
  EMAIL: {
    columns: ["to", "subject", "body"],
    lineHint: "Use CSV rows because email needs recipient, subject, and body.",
    csvHint: "CSV columns: to,subject,body",
    sample: "ops@example.local,Asset 001,Inspection due\nstock@example.local,Asset 002,Restock needed"
  },
  WIFI: {
    columns: ["authenticationType", "encryptionType", "networkKey", "macAddress", "ssid"],
    lineHint: "Use CSV rows because WiFi needs authentication, encryption, key, MAC, and SSID.",
    csvHint: "CSV columns: authenticationType,encryptionType,networkKey,macAddress,ssid",
    sample: "WPA2_PERSONAL,AES,change-me,FF:FF:FF:FF:FF:FF,Warehouse WiFi\nWPA2_PERSONAL,AES,change-me,FF:FF:FF:FF:FF:FF,Office WiFi"
  },
  MIME: {
    columns: ["mimeDataUtf8", "mimeType"],
    lineHint: "Use CSV rows because MIME needs data and MIME type.",
    csvHint: "CSV columns: mimeDataUtf8,mimeType",
    sample: "{\"asset\":\"001\"},application/json\n{\"asset\":\"002\"},application/json"
  },
  APPLICATION: {
    columns: ["application", "arguments"],
    lineHint: "Use CSV rows because application records need executable and arguments.",
    csvHint: "CSV columns: application,arguments",
    sample: "notepad.exe,C:\\asset-001.txt\nnotepad.exe,C:\\asset-002.txt"
  },
  FILE: {
    columns: ["uri"],
    lineHint: "Enter one file URI per line.",
    csvHint: "CSV columns: uri",
    sample: "file://localhost/C:/asset-001.txt\nfile://localhost/C:/asset-002.txt"
  },
  EXTERNAL: {
    columns: ["domain", "type", "data"],
    lineHint: "Use CSV rows because external records need domain, type, and data.",
    csvHint: "CSV columns: domain,type,data",
    sample: "example.local,asset,001\nexample.local,asset,002"
  },
  AAR: {
    columns: ["packageName"],
    lineHint: "Enter one Android package name per line.",
    csvHint: "CSV columns: packageName",
    sample: "com.example.internal\ncom.example.inventory"
  }
};

const source = document.getElementById("source");
const recordType = document.getElementById("recordType");
const inputMode = document.getElementById("inputMode");
const lockTag = document.getElementById("lockTag");
const fastMode = document.getElementById("fastMode");
const verifyAfterWrite = document.getElementById("verifyAfterWrite");
const preview = document.getElementById("preview");
const inputHelp = document.getElementById("inputHelp");
const csvUpload = document.getElementById("csvUpload");
const progressUpload = document.getElementById("progressUpload");
const introPage = document.getElementById("introPage");
const qrPage = document.getElementById("qrPage");
const toolPage = document.getElementById("toolPage");
const openTool = document.getElementById("openTool");
const openEncoderButtons = document.querySelectorAll("[data-open-encoder]");
const openQrButtons = document.querySelectorAll("[data-open-qr]");
const introButtons = document.querySelectorAll("[data-show-intro]");
const showIntro = document.getElementById("showIntro");
const readerStatus = document.getElementById("readerStatus");
const currentTag = document.getElementById("currentTag");
const writeIndex = document.getElementById("writeIndex");
const programmedCount = document.getElementById("programmedCount");
const elapsedSeconds = document.getElementById("elapsedSeconds");
const errorCount = document.getElementById("errorCount");
const tagDetails = document.getElementById("tagDetails");
const sessionLog = document.getElementById("sessionLog");
const queueBody = document.getElementById("queueBody");
const queueSummary = document.getElementById("queueSummary");
const operationToggle = document.getElementById("operationToggle");
const autoEncode = document.getElementById("autoEncode");
const nextRow = document.getElementById("nextRow");
const nextValue = document.getElementById("nextValue");
const modeSummary = document.getElementById("modeSummary");
const workflowState = document.getElementById("workflowState");
const lastWrittenUid = document.getElementById("lastWrittenUid");
const cardsPerMinute = document.getElementById("cardsPerMinute");
const etaSummary = document.getElementById("etaSummary");
const validationSummary = document.getElementById("validationSummary");
const progressSummary = document.getElementById("progressSummary");
const sessionSelect = document.getElementById("sessionSelect");
const programmedTagPanel = document.getElementById("programmedTagPanel");
const programmedTagSummary = document.getElementById("programmedTagSummary");
const tabs = document.querySelectorAll(".tab");
let activeFormat = "csv";
let nextTagIndex = 0;
let errorsTotal = 0;
let operationRunning = false;
let operationStartedAt = 0;
let operationElapsedMs = 0;
let lastSeenUid = null;
let lastProcessedUid = null;
let lastReadResult = null;
let bridgeBusy = false;
let statusCheckBusy = false;
let autoEncodeEnabled = true;
let events = [];
let rowStates = [];
let currentQueueKey = "";
let loadedFileName = "";
let autoSaveTimer = null;
let lastBridgeErrorAt = 0;
let bridgePollTimer = null;
const bridgeUrl = "http://localhost:17322";
const bridgePollMs = 500;
const progressPrefix = "pulsetap:nfc-progress:v1:";
const sessionsIndexKey = "pulsetap:nfc-progress:sessions:v1";

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function parseCsvLine(line) {
  const fields = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && quoted && next === '"') {
      field += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      fields.push(field.trim());
      field = "";
    } else {
      field += char;
    }
  }

  fields.push(field.trim());
  return fields;
}

function parseCsvText(text) {
  return text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim()).map(parseCsvLine);
}

function loadSimpleCsv(rows) {
  source.value = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
  inputMode.value = "csv";
}

function loadEncodingCsv(rows) {
  const headers = rows[0];
  const firstRecordTypeIndex = headers.indexOf("ndef.records.0.type");
  const firstDataRow = rows.find((row, index) => index > 0 && row.some(Boolean));

  if (!firstDataRow || firstRecordTypeIndex === -1) {
    loadSimpleCsv(rows);
    return;
  }

  const type = firstDataRow[firstRecordTypeIndex];
  if (!fieldSets[type]) {
    loadSimpleCsv(rows.slice(1));
    return;
  }

  const config = fieldSets[type];
  const lockIndex = headers.indexOf("ndef.lock");
  const columnIndexes = config.columns.map((column) => headers.indexOf(`ndef.records.0.${column}`));
  recordType.value = type;
  lockTag.checked = lockIndex >= 0 && String(firstDataRow[lockIndex]).toUpperCase() === "TRUE";
  inputMode.value = "csv";
  source.value = rows.slice(1).map((row) => {
    return columnIndexes.map((index) => csvEscape(index >= 0 ? row[index] ?? "" : "")).join(",");
  }).join("\n");
}

function loadCsvText(text) {
  const rows = parseCsvText(text);
  if (!rows.length) {
    source.value = "";
    render();
    return;
  }

  if (rows[0].some((header) => header.startsWith("ndef."))) {
    loadEncodingCsv(rows);
  } else {
    loadSimpleCsv(rows);
  }

  render();
}

function hashText(value) {
  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) + hash) ^ value.charCodeAt(index);
  }
  return (hash >>> 0).toString(36);
}

function rowsFromInput() {
  const type = recordType.value;
  const config = fieldSets[type];
  const lines = source.value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const rows = [];

  for (const line of lines) {
    const values = inputMode.value === "csv" || config.columns.length > 1
      ? parseCsvLine(line)
      : [line];
    const record = { type };

    config.columns.forEach((column, index) => {
      record[column] = values[index] ?? "";
    });

    rows.push({
      ndef: {
        lock: lockTag.checked,
        records: [record]
      }
    });
  }

  return rows;
}

function buildCsv(tags) {
  const type = recordType.value;
  const config = fieldSets[type];
  const headers = ["ndef.lock", "ndef.records.0.type", ...config.columns.map((column) => `ndef.records.0.${column}`)];
  const rows = tags.map((tag) => {
    const record = tag.ndef.records[0];
    return [
      tag.ndef.lock ? "TRUE" : "FALSE",
      record.type,
      ...config.columns.map((column) => record[column])
    ].map(csvEscape).join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

function buildJson(tags) {
  return JSON.stringify({ tags }, null, 2);
}

function currentOutput(format = activeFormat) {
  const tags = rowsFromInput();
  return format === "json" ? buildJson(tags) : buildCsv(tags);
}

function currentTags() {
  return rowsFromInput();
}

function formatRecordValue(tag) {
  const record = tag?.ndef?.records?.[0] || {};
  const type = record.type;
  if (type === "WEBSITE") return record.url || "";
  if (type === "URI" || type === "FILE") return record.uri || "";
  if (type === "PHONE") return record.phone || "";
  if (type === "SMS") return `${record.phone || ""}, ${record.message || ""}`;
  if (type === "EMAIL") return [record.to, record.subject, record.body].filter(Boolean).join(", ");
  if (type === "WIFI") return record.ssid || "";
  if (type === "MIME") return `${record.mimeType || "application/octet-stream"}: ${record.mimeDataUtf8 || record.mimeDataHex || ""}`;
  if (type === "APPLICATION") return `${record.application || ""} ${record.arguments || ""}`.trim();
  if (type === "EXTERNAL") return `${record.domain || ""}:${record.type || ""} ${record.data || ""}`.trim();
  if (type === "AAR") return record.packageName || "";
  return record.text || "";
}

function expectedValue(tag) {
  const record = tag?.ndef?.records?.[0] || {};
  if (record.type === "WEBSITE") return record.url || "";
  if (record.type === "URI" || record.type === "FILE") return record.uri || "";
  if (record.type === "PHONE") return `tel:${record.phone || ""}`;
  if (record.type === "SMS") return `sms:${record.phone || ""}?body=${encodeURIComponent(record.message || "")}`;
  if (record.type === "EMAIL") {
    const query = new URLSearchParams();
    if (record.subject) query.set("subject", record.subject);
    if (record.body) query.set("body", record.body);
    return `mailto:${record.to || ""}${query.toString() ? `?${query}` : ""}`;
  }
  if (record.type === "TEXT") return record.text || "";
  if (record.type === "WIFI") return `WIFI:T:${record.authenticationType || "WPA2_PERSONAL"};S:${record.ssid || ""};P:${record.networkKey || ""};H:false;;`;
  if (record.type === "MIME") return record.mimeDataUtf8 || "";
  if (record.type === "APPLICATION") return `${record.application || ""} ${record.arguments || ""}`.trim();
  if (record.type === "EXTERNAL") return record.data || "";
  if (record.type === "AAR") return record.packageName || "";
  return formatRecordValue(tag);
}

function queueSignature(tags) {
  return tags.map((tag) => {
    const record = tag?.ndef?.records?.[0] || {};
    return JSON.stringify({
      lock: Boolean(tag?.ndef?.lock),
      type: record.type || "",
      value: expectedValue(tag)
    });
  }).join("\n");
}

function queueKey(tags) {
  if (!tags.length) return "";
  return `${progressPrefix}${tags.length}:${hashText(queueSignature(tags))}`;
}

function progressMetadata(value) {
  const text = String(value || "");
  const match = text.match(/\/t\/([a-z]+)-claim-(\d+)-([a-z]+)/i);

  if (!match) {
    return {
      platform: "",
      claimNumber: null,
      claimToken: "",
      cardId: ""
    };
  }

  const platform = match[1].toLowerCase();
  const claimNumber = Number.parseInt(match[2], 10);
  const suffix = match[3].toUpperCase();

  return {
    platform,
    claimNumber,
    claimToken: `${platform}-claim-${match[2]}-${match[3].toLowerCase()}`,
    cardId: `${suffix}${String(claimNumber).padStart(3, "0")}`
  };
}

function progressSummaryFor(rows) {
  return rows.reduce((summary, row) => {
    const platform = row.platform || "other";
    const existing = summary[platform] || { total: 0, completed: 0, pending: 0, errors: 0 };
    existing.total += 1;
    if (row.status === "COMPLETED") existing.completed += 1;
    else existing.pending += 1;
    if (row.status === "ERROR") existing.errors += 1;
    summary[platform] = existing;
    return summary;
  }, {});
}

function readSavedProgress(key) {
  if (!key) return null;
  try {
    const saved = JSON.parse(localStorage.getItem(key) || "null");
    if (!saved || !Array.isArray(saved.rows)) return null;
    return saved;
  } catch {
    return null;
  }
}

function readSessionsIndex() {
  try {
    const sessions = JSON.parse(localStorage.getItem(sessionsIndexKey) || "[]");
    return Array.isArray(sessions) ? sessions : [];
  } catch {
    return [];
  }
}

function writeSessionsIndex(sessions) {
  localStorage.setItem(sessionsIndexKey, JSON.stringify(sessions));
  refreshSessions();
}

function upsertSessionIndex(payload) {
  const sessions = readSessionsIndex().filter((session) => session.queueKey !== payload.queueKey);
  sessions.unshift({
    queueKey: payload.queueKey,
    fileName: payload.fileName || "current input",
    completed: payload.completed,
    total: payload.total,
    updatedAt: payload.updatedAt
  });
  writeSessionsIndex(sessions.slice(0, 100));
}

function refreshSessions() {
  const selected = sessionSelect.value;
  const sessions = readSessionsIndex();
  sessionSelect.innerHTML = '<option value="">Saved sessions</option>';
  sessions.forEach((session) => {
    const option = document.createElement("option");
    option.value = session.queueKey;
    const updated = session.updatedAt ? new Date(session.updatedAt).toLocaleString() : "unknown";
    option.textContent = `${session.fileName || "current input"} - ${session.completed}/${session.total} - ${updated}`;
    sessionSelect.appendChild(option);
  });
  if (sessions.some((session) => session.queueKey === selected)) {
    sessionSelect.value = selected;
  }
}

function saveProgress() {
  if (!currentQueueKey || !rowStates.length) return;
  const completed = rowStates.filter((row) => row.status === "COMPLETED").length;
  const updatedAt = new Date().toISOString();
  const rows = rowStates.map((row, index) => {
    const metadata = progressMetadata(row.value);

    return {
      rowNumber: index + 1,
      value: row.value,
      platform: metadata.platform,
      claimNumber: metadata.claimNumber,
      claimToken: metadata.claimToken,
      cardId: metadata.cardId,
      status: row.status,
      uid: row.uid,
      message: row.message,
      completedAt: row.completedAt || "",
      updatedAt: row.updatedAt || updatedAt
    };
  });
  const payload = {
    version: 2,
    queueKey: currentQueueKey,
    fileName: loadedFileName,
    sourceText: source.value,
    recordType: recordType.value,
    inputMode: inputMode.value,
    lockTag: lockTag.checked,
    completed,
    total: rowStates.length,
    pending: rowStates.length - completed,
    updatedAt,
    summary: progressSummaryFor(rows),
    rows
  };
  localStorage.setItem(currentQueueKey, JSON.stringify(payload));
  upsertSessionIndex(payload);
  scheduleAutoSaveProgress(payload);
}

function currentProgressPayload() {
  if (!currentQueueKey || !rowStates.length) return null;
  saveProgress();
  return readSavedProgress(currentQueueKey);
}

function scheduleAutoSaveProgress(payload) {
  window.clearTimeout(autoSaveTimer);
  autoSaveTimer = window.setTimeout(() => {
    const safeName = (payload.fileName || "nfc-progress").replace(/[^a-z0-9._-]+/gi, "_");
    fetch(`${bridgeUrl}/save-progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: `${safeName}.latest.json`, payload })
    }).catch(() => {
      // Keep localStorage as the fallback when the bridge is offline.
    });
  }, 600);
}

function exportProgressBackup() {
  const payload = currentProgressPayload();
  if (!payload) {
    addEvent("ERROR", "No progress to export.");
    return;
  }

  const safeName = (loadedFileName || "nfc-progress").replace(/[^a-z0-9._-]+/gi, "_");
  const stamp = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, "");
  const filename = `${safeName}.progress-${stamp}.json`;

  fetch(`${bridgeUrl}/save-progress`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename, payload })
  })
    .then((response) => response.json().then((body) => ({ response, body })))
    .then(({ response, body }) => {
      if (!response.ok || !body.ok) {
        throw new Error(body.error || "Bridge save failed");
      }
      addEvent("INFO", `Progress backup saved to ${body.path}`);
    })
    .catch((error) => {
      download(filename, JSON.stringify(payload, null, 2), "application/json;charset=utf-8");
      addEvent("ERROR", `${error.message}; downloaded backup instead.`);
    });
}

function importProgressBackup(text) {
  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    addEvent("ERROR", "Progress backup is not valid JSON.");
    return;
  }

  if (!payload?.queueKey || !Array.isArray(payload.rows)) {
    addEvent("ERROR", "Progress backup is missing queue data.");
    return;
  }

  if (currentQueueKey && payload.queueKey !== currentQueueKey) {
    addEvent("ERROR", "This backup does not match the currently loaded CSV.");
    return;
  }

  localStorage.setItem(payload.queueKey, JSON.stringify(payload));
  upsertSessionIndex(payload);
  currentQueueKey = "";
  rowStates = [];
  addEvent("INFO", "Progress backup imported.");
  render();
}

function updateProgressSummary() {
  const completed = rowStates.filter((row) => row.status === "COMPLETED").length;
  const total = rowStates.length;
  const pendingIndex = nextWritableIndex();
  if (!total) {
    progressSummary.textContent = "No file loaded";
    return;
  }

  const fileLabel = loadedFileName || "current input";
  const nextLabel = pendingIndex >= 0 ? `next row ${pendingIndex + 1}` : "all rows completed";
  progressSummary.textContent = `${fileLabel}: ${completed}/${total} programmed, ${nextLabel}`;
}

function clearSavedProgress() {
  if (currentQueueKey) {
    localStorage.removeItem(currentQueueKey);
    writeSessionsIndex(readSessionsIndex().filter((session) => session.queueKey !== currentQueueKey));
  }
  rowStates = rowStates.map((row) => ({
    ...row,
    status: "PENDING",
    uid: "",
    message: "",
    completedAt: "",
    updatedAt: new Date().toISOString()
  }));
  nextTagIndex = 0;
  lastProcessedUid = null;
  addEvent("INFO", "Saved progress cleared for current file.");
  render();
}

function loadSessionByKey(key) {
  const payload = readSavedProgress(key);
  if (!payload) {
    addEvent("ERROR", "Saved session could not be found.");
    return;
  }

  if (!payload.sourceText) {
    addEvent("ERROR", "This older session needs the CSV loaded first before it can restore.");
    return;
  }

  loadedFileName = payload.fileName || "saved session";
  recordType.value = payload.recordType || "WEBSITE";
  inputMode.value = payload.inputMode || "csv";
  lockTag.checked = Boolean(payload.lockTag);
  source.value = payload.sourceText;
  currentQueueKey = "";
  rowStates = [];
  lastProcessedUid = null;
  hideProgrammedTag();
  render();
  sessionSelect.value = key;
  addEvent("INFO", `Loaded saved session ${loadedFileName}.`);
}

function normalizeValue(value) {
  return String(value ?? "").trim();
}

function decodedValue(readResult) {
  const record = readResult?.ndef?.records?.[0] || {};
  if (record.uri) return record.uri;
  if (record.text) return record.text;
  if (record.mimeDataUtf8) return record.mimeDataUtf8;
  if (record.packageName) return record.packageName;
  if (record.data) return record.data;
  return "";
}

function describeRecord(record) {
  if (!record) return "No NDEF record found";
  if (record.uri) return `${record.type || "URI"}: ${record.uri}`;
  if (record.text) return `${record.type || "TEXT"}: ${record.text}`;
  if (record.mimeDataUtf8) return `${record.mimeType || "MIME"}: ${record.mimeDataUtf8}`;
  if (record.packageName) return `AAR: ${record.packageName}`;
  if (record.data) return `${record.type || "EXTERNAL"}: ${record.data}`;
  if (record.payloadHex) return `${record.type || "UNKNOWN"} payload ${record.payloadHex}`;
  return "No readable NDEF value found";
}

function describeReadResult(result) {
  const uid = result?.card?.uid || "unknown tag";
  const records = result?.ndef?.records || [];
  if (!records.length) {
    return `${uid}: empty tag`;
  }
  return `${uid}: ${records.map(describeRecord).join(" | ")}`;
}

function showProgrammedTag(result, message = "This tag already contains data.") {
  lastReadResult = result;
  programmedTagSummary.textContent = `${message} ${describeReadResult(result)}`;
  programmedTagPanel.hidden = false;
}

function hideProgrammedTag() {
  programmedTagPanel.hidden = true;
}

function syncRowStates(tags) {
  const key = queueKey(tags);
  let savedProgress = null;
  if (key !== currentQueueKey) {
    currentQueueKey = key;
    savedProgress = readSavedProgress(key);
  } else {
    savedProgress = readSavedProgress(key);
  }

  rowStates = tags.map((tag, index) => {
    const previous = rowStates[index];
    const value = expectedValue(tag);
    if (previous && previous.value === value) {
      return previous;
    }
    const saved = savedProgress?.rows?.[index];
    if (saved && saved.value === value) {
      return {
        value,
        status: saved.status || "PENDING",
        uid: saved.uid || "",
        message: saved.message || "",
        completedAt: saved.completedAt || "",
        updatedAt: saved.updatedAt || ""
      };
    }
    return {
      value,
      status: "PENDING",
      uid: "",
      message: "",
      completedAt: "",
      updatedAt: ""
    };
  });
  if (nextTagIndex >= tags.length) {
    nextTagIndex = Math.max(tags.length - 1, 0);
  }
  const pendingIndex = nextPendingIndex();
  if (pendingIndex < 0) {
    nextTagIndex = Math.max(tags.length - 1, 0);
  } else if (!rowStates[nextTagIndex] || rowStates[nextTagIndex].status === "COMPLETED") {
    nextTagIndex = pendingIndex;
  }
}

function nextPendingIndex() {
  return rowStates.findIndex((row) => row.status !== "COMPLETED");
}

function nextWritableIndex() {
  if (rowStates[nextTagIndex] && rowStates[nextTagIndex].status !== "COMPLETED") {
    return nextTagIndex;
  }
  return nextPendingIndex();
}

function statusClass(status) {
  if (status === "COMPLETED") return "status-completed";
  if (status === "ERROR") return "status-error";
  if (status === "SELECTED") return "status-selected";
  return "status-pending";
}

function selectQueueRow(index) {
  const row = queueBody.querySelector(`[data-index="${index}"]`);
  if (!row) return;
  queueBody.querySelectorAll("tr").forEach((item) => item.classList.remove("selected"));
  row.classList.add("selected");
  row.scrollIntoView({ block: "nearest" });
}

function renderQueue(tags) {
  syncRowStates(tags);
  queueBody.innerHTML = tags.map((tag, index) => {
    const state = rowStates[index];
    const selected = index === nextTagIndex ? " class=\"selected\"" : "";
    const encoding = formatRecordValue(tag);
    return `
      <tr data-index="${index}"${selected}>
        <td>${index + 1}</td>
        <td>${index + 1}</td>
        <td class="${statusClass(state.status)}">${state.status}</td>
        <td>${tag.ndef.lock ? "TRUE" : "FALSE"}</td>
        <td title="${escapeHtml(encoding)}">${escapeHtml(encoding)}</td>
        <td>${escapeHtml(state.uid)}</td>
        <td>${escapeHtml(state.message)}</td>
      </tr>
    `;
  }).join("");

  const completed = rowStates.filter((row) => row.status === "COMPLETED").length;
  const pending = rowStates.length - completed;
  queueSummary.textContent = `${completed} completed, ${pending} pending`;
  programmedCount.textContent = String(completed);
  const pendingIndex = nextWritableIndex();
  writeIndex.textContent = String(pendingIndex >= 0 ? pendingIndex + 1 : rowStates.length || 1);
  updateProgressSummary();
}

function render() {
  const config = fieldSets[recordType.value];
  const forceCsv = config.columns.length > 1;
  const tags = currentTags();

  if (forceCsv) {
    inputMode.value = "csv";
  }

  inputMode.disabled = forceCsv;
  inputHelp.textContent = inputMode.value === "csv" ? config.csvHint : config.lineHint;
  preview.textContent = activeFormat === "json" ? buildJson(tags) : buildCsv(tags);
  renderQueue(tags);
  updateOperatorPanel(tags);
  errorCount.textContent = String(errorsTotal);
}

function download(name, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function timestamp() {
  return new Date().toLocaleTimeString();
}

function addEvent(level, message) {
  events.unshift(`[${timestamp()}] ${level}: ${message}`);
  events = events.slice(0, 80);
  sessionLog.textContent = events.join("\n");
  if (level === "ERROR") {
    errorsTotal += 1;
    errorCount.textContent = String(errorsTotal);
  }
}

function addStatusEvent(level, message) {
  events.unshift(`[${timestamp()}] ${level}: ${message}`);
  events = events.slice(0, 80);
  sessionLog.textContent = events.join("\n");
}

function startBridgePolling() {
  if (!bridgePollTimer) {
    bridgePollTimer = setInterval(checkBridge, bridgePollMs);
  }
}

function showToolPage() {
  introPage.hidden = true;
  qrPage.hidden = true;
  toolPage.hidden = false;
  document.body.classList.remove("intro-active", "qr-active");
  history.replaceState(null, "", `${location.pathname}${location.search}#encoder`);
  startBridgePolling();
  checkBridge();
}

function showQrPage() {
  introPage.hidden = true;
  toolPage.hidden = true;
  qrPage.hidden = false;
  document.body.classList.remove("intro-active");
  document.body.classList.add("qr-active");
  history.replaceState(null, "", `${location.pathname}${location.search}#qr`);
  window.scrollTo({ top: 0, behavior: "smooth" });
  window.dispatchEvent(new Event("qr-page-opened"));
}

function showIntroPage() {
  toolPage.hidden = true;
  qrPage.hidden = true;
  introPage.hidden = false;
  document.body.classList.remove("qr-active");
  document.body.classList.add("intro-active");
  history.replaceState(null, "", `${location.pathname}${location.search}`);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setWorkflowState(label, kind = "waiting") {
  workflowState.textContent = label;
  workflowState.className = `state-pill state-${kind}`;
}

function activeOperationMs() {
  return operationElapsedMs + (operationRunning ? Date.now() - operationStartedAt : 0);
}

function renderElapsed() {
  elapsedSeconds.textContent = formatDuration(activeOperationMs() / 1000);
  updateProductionMetrics();
}

function updateOperationButton() {
  operationToggle.textContent = operationRunning ? "Stop Operation" : "Start Operation";
  operationToggle.setAttribute("aria-pressed", String(operationRunning));
  operationToggle.classList.toggle("start-action", !operationRunning);
  operationToggle.classList.toggle("stop-action", operationRunning);
}

function updateProductionMetrics() {
  const completed = rowStates.filter((row) => row.status === "COMPLETED").length;
  const pending = Math.max(rowStates.length - completed, 0);
  const elapsedMinutes = activeOperationMs() / 60000;
  const rate = elapsedMinutes > 0 ? completed / elapsedMinutes : 0;
  const etaSeconds = rate > 0 ? (pending / rate) * 60 : NaN;

  cardsPerMinute.textContent = `${rate.toFixed(rate >= 10 ? 0 : 1)}/min`;
  etaSummary.textContent = pending ? formatDuration(etaSeconds) : "--";
}

function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "--";
  if (seconds < 60) return `${Math.ceil(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.ceil(seconds % 60);
  return remainder ? `${minutes}m ${remainder}s` : `${minutes}m`;
}

function validationIssues(tags) {
  const issues = [];
  const seen = new Map();

  tags.forEach((tag, index) => {
    const record = tag?.ndef?.records?.[0] || {};
    const config = fieldSets[record.type] || { columns: [] };
    const value = normalizeValue(expectedValue(tag));

    config.columns.forEach((column) => {
      if (!normalizeValue(record[column])) {
        issues.push(`Row ${index + 1}: missing ${column}`);
      }
    });

    if (record.type === "WEBSITE") {
      try {
        const url = new URL(record.url);
        if (!["http:", "https:"].includes(url.protocol)) {
          issues.push(`Row ${index + 1}: website must use http or https`);
        }
      } catch {
        issues.push(`Row ${index + 1}: invalid website URL`);
      }
    }

    if (value) {
      if (seen.has(value)) {
        issues.push(`Rows ${seen.get(value) + 1} and ${index + 1}: duplicate value`);
      } else {
        seen.set(value, index);
      }
    }
  });

  return issues;
}

function updateOperatorPanel(tags) {
  const displayIndex = operationRunning ? nextWritableIndex() : (tags.length ? 0 : -1);
  const nextTag = displayIndex >= 0 ? tags[displayIndex] : null;
  const issues = validationIssues(tags);

  modeSummary.textContent = `${operationRunning ? "Running" : "Stopped"} - ${fastMode.checked ? "Fast" : "Safe"} mode, verify ${verifyAfterWrite.checked ? "on" : "off"}`;
  nextRow.textContent = displayIndex >= 0 ? `Row ${displayIndex + 1}` : "No rows";
  nextValue.textContent = nextTag ? formatRecordValue(nextTag) || "(empty value)" : "Load a file to begin";
  validationSummary.textContent = issues.length ? `${issues.length} issue${issues.length === 1 ? "" : "s"}` : "Ready";
  validationSummary.title = issues.join("\n");
  updateProductionMetrics();
}

function summarizeRead(result) {
  return JSON.stringify({
    uid: result.card?.uid || null,
    type: result.card?.type || null,
    records: result.ndef?.records || [],
    ndefMessageHex: result.ndef?.messageHex || "",
    memoryHex: result.memoryHex || ""
  }, null, 2);
}

function tagHasNdef(result) {
  return Boolean(result?.ndef?.messageHex || result?.ndef?.records?.length);
}

async function checkBridge() {
  if (statusCheckBusy) {
    return { ok: false, error: "Status check already running" };
  }

  statusCheckBusy = true;
  try {
    const response = await fetch(`${bridgeUrl}/status`);
    const status = await response.json();
    if (!status.ok) {
      readerStatus.textContent = status.error || "No reader detected";
      setWorkflowState(operationRunning ? "Reader issue" : "Stopped", operationRunning ? "error" : "waiting");
      if (Date.now() - lastBridgeErrorAt > 5000) {
        lastBridgeErrorAt = Date.now();
        if (operationRunning) {
          addEvent("ERROR", readerStatus.textContent);
        } else {
          addStatusEvent("STATUS", readerStatus.textContent);
        }
      }
      return status;
    }

    const card = status.card ? `, tag ${status.card.uid}` : ", waiting for tag";
    readerStatus.textContent = `${status.reader}${card}`;
    currentTag.textContent = status.card?.uid || "None";
    if (!status.card?.uid && !bridgeBusy) {
      setWorkflowState(operationRunning ? "Waiting" : "Stopped", "waiting");
    }
    if (status.card?.uid && status.card.uid !== lastSeenUid) {
      lastSeenUid = status.card.uid;
      addEvent("TAG", `Detected ${status.card.uid}`);
      if (autoEncodeEnabled && operationRunning) {
        processTappedTag(status.card.uid);
      } else if (!operationRunning) {
        setWorkflowState("Stopped", "waiting");
      }
    }
    if (!status.card?.uid) {
      lastSeenUid = null;
      lastProcessedUid = null;
      lastReadResult = null;
      hideProgrammedTag();
    }
    if (status.error && !status.card) {
      currentTag.textContent = "None";
    }
    return status;
  } catch (error) {
    readerStatus.textContent = "Bridge offline. Run start-bridge.bat in internal-nfc-tool.";
    setWorkflowState(operationRunning ? "Bridge offline" : "Stopped", operationRunning ? "error" : "waiting");
    if (Date.now() - lastBridgeErrorAt > 5000) {
      lastBridgeErrorAt = Date.now();
      if (operationRunning) {
        addEvent("ERROR", error.message);
      } else {
        addStatusEvent("STATUS", "Bridge offline.");
      }
    }
    return { ok: false, error: error.message };
  } finally {
    statusCheckBusy = false;
  }
}

async function readCurrentTag(options = {}) {
  const quiet = Boolean(options.quiet);
  const suppressProgrammedPanel = Boolean(options.suppressProgrammedPanel);
  try {
    if (!quiet) {
      setWorkflowState("Reading", "writing");
    }
    readerStatus.textContent = "Reading...";
    const response = await fetch(`${bridgeUrl}/read`);
    const result = await response.json();

    if (!response.ok || !result.ok) {
      const message = result.error || "Read failed";
      readerStatus.textContent = message;
      setWorkflowState("Read failed", "error");
      if (!quiet) {
        addEvent("ERROR", message);
      }
      return null;
    }

    currentTag.textContent = result.card?.uid || "Unknown";
    lastReadResult = result;
    tagDetails.textContent = summarizeRead(result);
    readerStatus.textContent = `Read tag ${result.card?.uid || ""}`;
    if (!quiet) {
      setWorkflowState("Read complete", "success");
    }
    addEvent("READ", `Tag ${result.card?.uid || "unknown"} has ${result.ndef?.records?.length || 0} NDEF record(s)`);
    if (!suppressProgrammedPanel && tagHasNdef(result)) {
      showProgrammedTag(result, "Programmed card detected.");
    } else if (!suppressProgrammedPanel) {
      hideProgrammedTag();
    }
    return result;
  } catch (error) {
    readerStatus.textContent = `Read failed: ${error.message}`;
    setWorkflowState("Read failed", "error");
    if (!quiet) {
      addEvent("ERROR", error.message);
    }
    return null;
  }
}

function findMatchingRow(readResult) {
  const value = normalizeValue(decodedValue(readResult));
  if (!value) return -1;
  return rowStates.findIndex((row) => normalizeValue(row.value) === value);
}

async function processTappedTag(uid) {
  if (bridgeBusy || uid === lastProcessedUid) {
    return;
  }

  bridgeBusy = true;
  lastProcessedUid = uid;
  try {
    if (fastMode.checked) {
      const pendingIndex = nextWritableIndex();
      if (pendingIndex < 0) {
        readerStatus.textContent = "All rows are completed.";
        setWorkflowState("Complete", "success");
        addEvent("INFO", "No pending rows left to write.");
        return;
      }

      hideProgrammedTag();
      addEvent("INFO", `Fast mode writing row ${pendingIndex + 1} without pre-read`);
      await writeRowToCurrentTag(pendingIndex, uid);
      return;
    }

    const readResult = await readCurrentTag({ quiet: true });
    if (!readResult) {
      const pendingIndex = nextWritableIndex();
      if (pendingIndex < 0) {
        readerStatus.textContent = "All rows are completed.";
        setWorkflowState("Complete", "success");
        addEvent("INFO", "No pending rows left to write.");
        return;
      }
      addEvent("INFO", `Could not read tag ${uid}; trying row ${pendingIndex + 1} write`);
      await writeRowToCurrentTag(pendingIndex, uid);
      return;
    }

    const existingIndex = findMatchingRow(readResult);
    if (existingIndex >= 0) {
      const now = new Date().toISOString();
      rowStates[existingIndex].status = "COMPLETED";
      rowStates[existingIndex].uid = readResult.card?.uid || uid;
      rowStates[existingIndex].message = "Existing programmed tag";
      rowStates[existingIndex].completedAt = rowStates[existingIndex].completedAt || now;
      rowStates[existingIndex].updatedAt = now;
      nextTagIndex = existingIndex;
      saveProgress();
      showProgrammedTag(readResult, "This card is already programmed and matches this queue.");
      render();
      selectQueueRow(existingIndex);
      addEvent("MATCH", `Tag ${uid} matched row ${existingIndex + 1}`);
      return;
    }

    if (tagHasNdef(readResult)) {
      readerStatus.textContent = `Programmed tag ${uid} does not match this queue`;
      setWorkflowState("Programmed card", "error");
      showProgrammedTag(readResult, "This card is already programmed with different data.");
      addEvent("ERROR", `Programmed tag ${uid} did not match any row`);
      return;
    }

    hideProgrammedTag();
    const pendingIndex = nextWritableIndex();
    if (pendingIndex < 0) {
      readerStatus.textContent = "All rows are completed.";
      setWorkflowState("Complete", "success");
      addEvent("INFO", "No pending rows left to write.");
      return;
    }

    await writeRowToCurrentTag(pendingIndex, uid);
  } finally {
    bridgeBusy = false;
  }
}

async function writeRowToCurrentTag(index, uid = "") {
  const tags = currentTags();
  const tag = tags[index];
  if (!tag) {
    readerStatus.textContent = "No pending tag row to write.";
    setWorkflowState("No row", "error");
    addEvent("ERROR", "No pending tag row to write.");
    return;
  }

  const issues = validationIssues(tags);
  if (issues.length) {
    readerStatus.textContent = "Fix input validation issues before writing.";
    setWorkflowState("Validation issue", "error");
    addEvent("ERROR", `Fix input before writing: ${issues[0]}`);
    render();
    return;
  }

  try {
    readerStatus.textContent = `Writing row ${index + 1}...`;
    setWorkflowState(`Writing row ${index + 1}`, "writing");
    selectQueueRow(index);
    const response = await fetch(`${bridgeUrl}/write`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tag })
    });
    const result = await response.json();

    if (!response.ok || !result.ok) {
      const message = result.error || "Write failed";
      const tagMissing = /SCardConnectW failed|No NFC readers detected|No tag|removed/i.test(message);
      rowStates[index].status = tagMissing ? "PENDING" : "ERROR";
      rowStates[index].message = tagMissing ? "Waiting for tag" : message;
      rowStates[index].updatedAt = new Date().toISOString();
      readerStatus.textContent = rowStates[index].message;
      setWorkflowState(tagMissing ? "Waiting" : "Write failed", tagMissing ? "waiting" : "error");
      addEvent("ERROR", rowStates[index].message);
      saveProgress();
      render();
      return;
    }

    const now = new Date().toISOString();
    rowStates[index].status = "COMPLETED";
    rowStates[index].uid = result.card?.uid || uid || "";
    rowStates[index].message = `${result.bytesWritten} bytes`;
    rowStates[index].completedAt = rowStates[index].completedAt || now;
    rowStates[index].updatedAt = now;
    nextTagIndex = Math.max(nextPendingIndex(), index);
    saveProgress();
    currentTag.textContent = result.card?.uid || uid || "Unknown";
    lastWrittenUid.textContent = currentTag.textContent;
    readerStatus.textContent = `Wrote row ${index + 1} to tag ${currentTag.textContent}`;
    setWorkflowState("Write complete", "success");
    addEvent("WRITE", `Programmed ${currentTag.textContent} with row ${index + 1}`);
    hideProgrammedTag();
    render();
    selectQueueRow(index);
    if (verifyAfterWrite.checked) {
      await readCurrentTag({ suppressProgrammedPanel: true });
    } else {
      tagDetails.textContent = JSON.stringify({
        uid: result.card?.uid || uid || null,
        verified: false,
        rowNumber: index + 1,
        value: expectedValue(tag)
      }, null, 2);
    }
  } catch (error) {
    rowStates[index].status = "ERROR";
    rowStates[index].message = error.message;
    rowStates[index].updatedAt = new Date().toISOString();
    readerStatus.textContent = `Write failed: ${error.message}`;
    setWorkflowState("Write failed", "error");
    addEvent("ERROR", error.message);
    saveProgress();
    render();
  }
}

async function eraseCurrentTag(options = {}) {
  const writeAfterErase = Boolean(options.writeAfterErase);
  if (bridgeBusy) {
    return;
  }

  bridgeBusy = true;
  try {
    readerStatus.textContent = "Erasing tag...";
    setWorkflowState("Erasing", "writing");
    const response = await fetch(`${bridgeUrl}/erase`, { method: "POST" });
    const result = await response.json();

    if (!response.ok || !result.ok) {
      const message = result.error || "Erase failed";
      readerStatus.textContent = message;
      setWorkflowState("Erase failed", "error");
      addEvent("ERROR", message);
      return;
    }

    currentTag.textContent = result.card?.uid || "Unknown";
    readerStatus.textContent = `Erased tag ${currentTag.textContent}`;
    setWorkflowState("Erased", "success");
    tagDetails.textContent = JSON.stringify({
      uid: result.card?.uid || null,
      erased: true,
      pagesCleared: result.pagesCleared
    }, null, 2);
    lastReadResult = null;
    hideProgrammedTag();
    addEvent("ERASE", `Erased ${currentTag.textContent}`);
    lastProcessedUid = null;

    if (writeAfterErase) {
      const pendingIndex = nextWritableIndex();
      if (pendingIndex < 0) {
        readerStatus.textContent = "Erased tag. No pending rows left to write.";
        setWorkflowState("Complete", "success");
        addEvent("INFO", "No pending rows left to write after erase.");
        return;
      }
      bridgeBusy = false;
      await writeRowToCurrentTag(pendingIndex, result.card?.uid || "");
      return;
    }
  } catch (error) {
    readerStatus.textContent = `Erase failed: ${error.message}`;
    setWorkflowState("Erase failed", "error");
    addEvent("ERROR", error.message);
  } finally {
    bridgeBusy = false;
  }
}

async function writeCurrentTag() {
  const tags = currentTags();
  if (!tags.length) {
    readerStatus.textContent = "No tags to write.";
    setWorkflowState("No rows", "error");
    addEvent("ERROR", "No tags to write.");
    return;
  }

  const pendingIndex = nextWritableIndex();
  await writeRowToCurrentTag(pendingIndex >= 0 ? pendingIndex : tags.length - 1);
}

document.getElementById("loadSample").addEventListener("click", () => {
  loadedFileName = "sample";
  source.value = fieldSets[recordType.value].sample;
  render();
});

document.getElementById("uploadCsv").addEventListener("click", () => {
  csvUpload.click();
});

csvUpload.addEventListener("change", async () => {
  const [file] = csvUpload.files;
  if (!file) {
    return;
  }

  loadedFileName = file.name;
  loadCsvText(await file.text());
  csvUpload.value = "";
});

document.getElementById("exportProgress").addEventListener("click", exportProgressBackup);

document.getElementById("importProgress").addEventListener("click", () => {
  progressUpload.click();
});

progressUpload.addEventListener("change", async () => {
  const [file] = progressUpload.files;
  if (!file) {
    return;
  }

  importProgressBackup(await file.text());
  progressUpload.value = "";
});

document.getElementById("loadSession").addEventListener("click", () => {
  if (!sessionSelect.value) {
    addEvent("ERROR", "Choose a saved session first.");
    return;
  }
  loadSessionByKey(sessionSelect.value);
});

document.getElementById("downloadCsv").addEventListener("click", () => {
  download("nfc_encoding.csv", currentOutput("csv"), "text/csv;charset=utf-8");
});

document.getElementById("downloadJson").addEventListener("click", () => {
  download("nfc_encoding.json", currentOutput("json"), "application/json;charset=utf-8");
});

document.getElementById("bridgeStatus").addEventListener("click", checkBridge);

document.getElementById("readTag").addEventListener("click", readCurrentTag);

document.getElementById("writeTag").addEventListener("click", writeCurrentTag);

document.getElementById("eraseTag").addEventListener("click", () => eraseCurrentTag());

document.getElementById("eraseOnly").addEventListener("click", () => eraseCurrentTag());

document.getElementById("eraseAndWrite").addEventListener("click", () => eraseCurrentTag({ writeAfterErase: true }));

document.getElementById("clearProgress").addEventListener("click", clearSavedProgress);

openTool.addEventListener("click", showToolPage);
openEncoderButtons.forEach((button) => button.addEventListener("click", showToolPage));
openQrButtons.forEach((button) => button.addEventListener("click", showQrPage));
introButtons.forEach((button) => button.addEventListener("click", showIntroPage));

showIntro.addEventListener("click", showIntroPage);

operationToggle.addEventListener("click", () => {
  if (operationRunning) {
    operationElapsedMs = activeOperationMs();
    operationRunning = false;
    operationStartedAt = 0;
    setWorkflowState("Stopped", "waiting");
    addEvent("INFO", "Operation stopped.");
  } else {
    operationRunning = true;
    operationStartedAt = Date.now();
    operationElapsedMs = 0;
    errorsTotal = 0;
    errorCount.textContent = "0";
    elapsedSeconds.textContent = "0s";
    nextTagIndex = 0;
    lastSeenUid = null;
    lastProcessedUid = null;
    setWorkflowState("Waiting", "waiting");
    addEvent("INFO", "Operation started.");
    checkBridge();
  }

  updateOperationButton();
  renderElapsed();
  render();
});

autoEncode.addEventListener("click", () => {
  autoEncodeEnabled = !autoEncodeEnabled;
  autoEncode.textContent = autoEncodeEnabled ? "Auto Encode On" : "Auto Encode Off";
  autoEncode.setAttribute("aria-pressed", String(autoEncodeEnabled));
  autoEncode.classList.toggle("active-action", autoEncodeEnabled);
  addEvent("INFO", `Auto encode ${autoEncodeEnabled ? "enabled" : "disabled"}`);
  render();
});

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((item) => item.classList.remove("active"));
    tab.classList.add("active");
    activeFormat = tab.dataset.format;
    render();
  });
});

queueBody.addEventListener("click", (event) => {
  const row = event.target.closest("tr[data-index]");
  if (!row) return;

  const index = Number.parseInt(row.dataset.index, 10);
  if (!Number.isInteger(index) || !rowStates[index]) return;
  if (rowStates[index].status === "COMPLETED") {
    addEvent("INFO", `Row ${index + 1} is already completed.`);
    return;
  }

  nextTagIndex = index;
  lastProcessedUid = null;
  setWorkflowState(`Row ${index + 1} selected`, "waiting");
  render();
  selectQueueRow(index);
});

[fastMode, verifyAfterWrite].forEach((control) => {
  control.addEventListener("change", render);
});

[source, recordType, inputMode, lockTag].forEach((control) => {
  control.addEventListener("input", () => {
    nextTagIndex = 0;
    lastProcessedUid = null;
    lastReadResult = null;
    loadedFileName = loadedFileName || "manual input";
    currentQueueKey = "";
    hideProgrammedTag();
    rowStates = [];
    render();
  });
});

loadedFileName = "sample";
source.value = fieldSets.WEBSITE.sample;
refreshSessions();
updateOperationButton();
setWorkflowState("Stopped", "waiting");
render();
renderElapsed();
setInterval(renderElapsed, 1000);

if (location.hash === "#qr") {
  showQrPage();
} else if (location.hash === "#encoder") {
  showToolPage();
}
