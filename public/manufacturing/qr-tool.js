const qrContent = document.getElementById("qrContent");
const qrInputLabel = document.getElementById("qrInputLabel");
const qrInputHint = document.getElementById("qrInputHint");
const qrCharacterCount = document.getElementById("qrCharacterCount");
const qrSize = document.getElementById("qrSize");
const qrCorrection = document.getElementById("qrCorrection");
const qrForeground = document.getElementById("qrForeground");
const qrBackground = document.getElementById("qrBackground");
const qrForegroundValue = document.getElementById("qrForegroundValue");
const qrBackgroundValue = document.getElementById("qrBackgroundValue");
const qrTransparent = document.getElementById("qrTransparent");
const qrCanvas = document.getElementById("qrCanvas");
const qrEmptyState = document.getElementById("qrEmptyState");
const qrStatus = document.getElementById("qrStatus");
const qrFilename = document.getElementById("qrFilename");
const qrDownloadPng = document.getElementById("qrDownloadPng");
const qrDownloadSvg = document.getElementById("qrDownloadSvg");
const qrTypeTabs = document.querySelectorAll("[data-qr-type]");

const qrTypeConfig = {
  url: {
    label: "Website URL",
    placeholder: "https://www.pulse-tap.com",
    hint: "Enter the full page address you want the QR code to open."
  },
  text: {
    label: "Text",
    placeholder: "Write the message you want people to see",
    hint: "The message is stored directly in the QR code."
  },
  email: {
    label: "Email address",
    placeholder: "hello@example.com",
    hint: "Scanning the code opens a new email to this address."
  },
  phone: {
    label: "Phone number",
    placeholder: "+44 20 0000 0000",
    hint: "Include the country code when the QR will be used internationally."
  }
};

let activeQrType = "url";
let currentQr = null;
let currentQrPayload = "";

function normaliseQrPayload() {
  const raw = qrContent.value;
  const trimmed = raw.trim();

  if (!trimmed) {
    return { payload: "", error: "" };
  }

  if (activeQrType === "url") {
    const candidate = /^[a-z][a-z\d+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
    try {
      const parsed = new URL(candidate);
      if (!/^https?:$/.test(parsed.protocol)) {
        return { payload: "", error: "Use an http or https website address." };
      }
      return { payload: parsed.href, error: "" };
    } catch {
      return { payload: "", error: "Enter a valid website address." };
    }
  }

  if (activeQrType === "email") {
    const address = trimmed.replace(/^mailto:/i, "");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
      return { payload: "", error: "Enter a valid email address." };
    }
    return { payload: `mailto:${address}`, error: "" };
  }

  if (activeQrType === "phone") {
    const number = trimmed.replace(/^tel:/i, "").replace(/[^\d+*#;,]/g, "");
    if (number.replace(/\D/g, "").length < 3) {
      return { payload: "", error: "Enter a valid phone number." };
    }
    return { payload: `tel:${number}`, error: "" };
  }

  return { payload: raw, error: "" };
}

function setQrStatus(message, state = "ready") {
  qrStatus.textContent = message;
  qrStatus.dataset.state = state;
}

function setQrDownloadState(enabled) {
  qrDownloadPng.disabled = !enabled;
  qrDownloadSvg.disabled = !enabled;
}

function drawQrToCanvas(qr, size) {
  const context = qrCanvas.getContext("2d");
  const moduleCount = qr.getModuleCount();
  const quietZone = 4;
  const totalModules = moduleCount + quietZone * 2;
  const cellSize = Math.max(1, Math.floor(size / totalModules));
  const drawnSize = cellSize * totalModules;
  const offset = Math.floor((size - drawnSize) / 2);

  qrCanvas.width = size;
  qrCanvas.height = size;
  context.clearRect(0, 0, size, size);

  if (!qrTransparent.checked) {
    context.fillStyle = qrBackground.value;
    context.fillRect(0, 0, size, size);
  }

  context.fillStyle = qrForeground.value;
  for (let row = 0; row < moduleCount; row += 1) {
    for (let column = 0; column < moduleCount; column += 1) {
      if (qr.isDark(row, column)) {
        context.fillRect(
          offset + (column + quietZone) * cellSize,
          offset + (row + quietZone) * cellSize,
          cellSize,
          cellSize
        );
      }
    }
  }
}

function renderQrCode() {
  qrCharacterCount.textContent = `${qrContent.value.length} ${qrContent.value.length === 1 ? "character" : "characters"}`;
  qrForegroundValue.textContent = qrForeground.value.toUpperCase();
  qrBackgroundValue.textContent = qrBackground.value.toUpperCase();
  qrBackground.disabled = qrTransparent.checked;

  const { payload, error } = normaliseQrPayload();
  if (!payload || error) {
    currentQr = null;
    currentQrPayload = "";
    qrCanvas.hidden = true;
    qrEmptyState.hidden = false;
    setQrDownloadState(false);
    setQrStatus(error || "Waiting for content", error ? "error" : "ready");
    return;
  }

  try {
    const generatedQr = qrcode(0, qrCorrection.value);
    generatedQr.addData(payload, "Byte");
    generatedQr.make();
    drawQrToCanvas(generatedQr, Number(qrSize.value));
    currentQr = generatedQr;
    currentQrPayload = payload;
    qrCanvas.hidden = false;
    qrEmptyState.hidden = true;
    setQrDownloadState(true);
    setQrStatus("Ready to download", "success");
  } catch (errorObject) {
    currentQr = null;
    currentQrPayload = "";
    qrCanvas.hidden = true;
    qrEmptyState.hidden = false;
    setQrDownloadState(false);
    setQrStatus("Content is too long for this QR code", "error");
  }
}

function safeQrFilename(extension) {
  const base = qrFilename.value.trim()
    .replace(/\.[a-z\d]+$/i, "")
    .replace(/[^a-z\d_-]+/gi, "-")
    .replace(/^-+|-+$/g, "") || "pulsetap-qr-code";
  return `${base}.${extension}`;
}

function downloadQrPng() {
  if (!currentQr || !currentQrPayload) return;
  drawQrToCanvas(currentQr, Number(qrSize.value));
  const link = document.createElement("a");
  link.href = qrCanvas.toDataURL("image/png");
  link.download = safeQrFilename("png");
  link.click();
}

function createQrSvg() {
  const moduleCount = currentQr.getModuleCount();
  const quietZone = 4;
  const totalModules = moduleCount + quietZone * 2;
  const path = [];

  for (let row = 0; row < moduleCount; row += 1) {
    for (let column = 0; column < moduleCount; column += 1) {
      if (currentQr.isDark(row, column)) {
        path.push(`M${column + quietZone} ${row + quietZone}h1v1h-1z`);
      }
    }
  }

  const background = qrTransparent.checked
    ? ""
    : `<rect width="${totalModules}" height="${totalModules}" fill="${qrBackground.value}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalModules} ${totalModules}" shape-rendering="crispEdges">${background}<path fill="${qrForeground.value}" d="${path.join("")}"/></svg>`;
}

function downloadQrSvg() {
  if (!currentQr || !currentQrPayload) return;
  const blob = new Blob([createQrSvg()], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = safeQrFilename("svg");
  link.click();
  URL.revokeObjectURL(url);
}

function selectQrType(type) {
  activeQrType = type;
  const config = qrTypeConfig[type];
  qrInputLabel.textContent = config.label;
  qrInputHint.textContent = config.hint;
  qrContent.placeholder = config.placeholder;
  qrTypeTabs.forEach((tab) => {
    const isActive = tab.dataset.qrType === type;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
  });
  renderQrCode();
}

function resetQrGenerator() {
  qrContent.value = "";
  qrSize.value = "1024";
  qrCorrection.value = "M";
  qrForeground.value = "#07080d";
  qrBackground.value = "#ffffff";
  qrTransparent.checked = false;
  qrFilename.value = "pulsetap-qr-code";
  selectQrType("url");
  qrContent.focus();
}

qrTypeTabs.forEach((tab) => tab.addEventListener("click", () => selectQrType(tab.dataset.qrType)));
[qrContent, qrSize, qrCorrection, qrForeground, qrBackground, qrTransparent].forEach((control) => {
  control.addEventListener("input", renderQrCode);
  control.addEventListener("change", renderQrCode);
});
document.getElementById("qrReset").addEventListener("click", resetQrGenerator);
qrDownloadPng.addEventListener("click", downloadQrPng);
qrDownloadSvg.addEventListener("click", downloadQrSvg);
window.addEventListener("qr-page-opened", renderQrCode);

const initialQrParams = new URLSearchParams(location.search);
const initialQrType = initialQrParams.get("type");
const initialQrContent = initialQrParams.get("data");
if (initialQrContent) qrContent.value = initialQrContent;
selectQrType(qrTypeConfig[initialQrType] ? initialQrType : "url");
