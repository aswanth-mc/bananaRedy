
const scanButton = document.getElementById("scanButton");
const statusText = document.getElementById("statusText");
const statusLabel = document.getElementById("statusLabel");
const resultPanel = document.getElementById("resultPanel");
const scannerProgress = document.getElementById("scannerProgress");
const bananaBubble = document.getElementById("bananaBubble");
const askButton = document.getElementById("askButton");
const verdictCard = document.getElementById("verdictCard");
const historyList = document.getElementById("historyList");
const bananaPreview = document.getElementById("bananaPreview");
const scoreProgress = document.getElementById("scoreProgress");
const scoreNumber = document.getElementById("scoreNumber");
const metricDetected = document.getElementById("metricDetected");
const metricColor = document.getElementById("metricColor");
const metricBrownSpots = document.getElementById("metricBrownSpots");
const metricCondition = document.getElementById("metricCondition");
const metricConfidence = document.getElementById("metricConfidence");

const camera = document.getElementById("camera");
let model = null;
let cameraStream = null;
let cameraReady = false;
let modelReady = false;
let lastScanResult = null;
const captureCanvas = document.getElementById("captureCanvas");

const SCORE_RING_CIRCUMFERENCE = 440;
const HISTORY_KEY = "bananaScanHistory";
const HISTORY_LIMIT = 20;

function updateScanButton() {
  scanButton.disabled = !(cameraReady && modelReady);
}

const steps = Array.from(scannerProgress.children);

const askResponses = {
  UNRIPE: "I need two more days.",
  "ALMOST READY": "I am getting there. Check me again tomorrow.",
  PERFECT: "Finally! What are you waiting for?",
  "EAT SOON": "Stop looking at me and eat me.",
  "TOO LATE": "I warned you yesterday.",
  default: "First scan me. I don't work for free."
};

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function getCameraErrorMessage(error) {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return "Camera not supported in this browser";
  }

  if (error.name === "NotAllowedError") {
    return "Camera permission denied";
  }

  if (error.name === "NotFoundError") {
    return "No camera found";
  }

  if (error.name === "NotReadableError") {
    return "Camera already in use";
  }

  return "Camera unavailable";
}

async function requestCameraStream() {
  try {
    return await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "environment"
      },
      audio: false
    });
  } catch (environmentError) {
    console.warn("Environment camera unavailable, falling back:", environmentError);
    return navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false
    });
  }
}

// -----------------------------------------
// CAMERA
// -----------------------------------------

async function startCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    cameraReady = false;
    updateScanButton();
    statusText.textContent = "CAMERA NOT SUPPORTED";
    statusLabel.textContent = "Camera not supported in this browser";
    return;
  }

  try {
    cameraStream = await requestCameraStream();
    camera.srcObject = cameraStream;

    await camera.play();
    await new Promise((resolve) => {
      if (camera.readyState >= 2) {
        resolve();
      } else {
        camera.onloadeddata = resolve;
      }
    });

    cameraReady = true;
    updateScanButton();

    statusText.textContent = "CAMERA READY 🍌";
    statusLabel.textContent = "Ready";
  } catch (error) {
    console.error("Camera error:", error);

    cameraReady = false;
    updateScanButton();

    statusText.textContent = "CAMERA ERROR";
    statusLabel.textContent = getCameraErrorMessage(error);
  }
}

// -----------------------------------------
// CAPTURE IMAGE
// -----------------------------------------

function captureFrame() {
  if (!camera.videoWidth || !camera.videoHeight) {
    throw new Error("Camera is not ready.");
  }

  captureCanvas.width = camera.videoWidth;
  captureCanvas.height = camera.videoHeight;

  const context = captureCanvas.getContext("2d");

  context.drawImage(
    camera,
    0,
    0,
    captureCanvas.width,
    captureCanvas.height
  );

  return context.getImageData(
    0,
    0,
    captureCanvas.width,
    captureCanvas.height
  );
}

async function loadModel() {
  statusText.textContent = "Loading Banana Intelligence...";

  try {
    if (!window.cocoSsd) {
      throw new Error("COCO-SSD library failed to load.");
    }

    model = await window.cocoSsd.load();

    modelReady = true;
    updateScanButton();

    statusText.textContent = "Place a banana inside the frame";
    statusLabel.textContent = "Camera ready";

    console.log("Banana detection model loaded");
  } catch (error) {
    console.error("Model load error:", error);

    modelReady = false;
    updateScanButton();

    statusText.textContent = "AI MODEL ERROR";
    statusLabel.textContent = "Reload page";
  }
}

async function detectBanana() {
  if (!model) {
    alert("Banana AI is still loading. Please wait a moment.");
    return { detected: false, confidence: 0, bbox: null };
  }

  if (!camera || camera.readyState < 2) {
    alert("Camera is not ready.");
    return { detected: false, confidence: 0, bbox: null };
  }

  statusText.textContent = "Looking for banana...";
  statusLabel.textContent = "Analyzing";

  const predictions = await model.detect(camera);

  console.log("Detected objects:", predictions);

  const banana = predictions.find(
    (prediction) =>
      prediction.class === "banana" &&
      prediction.score >= 0.50
  );

  if (!banana) {
    const topPrediction = predictions
      .filter((prediction) => prediction.score >= 0.50)
      .sort((a, b) => b.score - a.score)[0];

    if (topPrediction) {
      alert("That's not a banana. I studied for this.");
      statusText.textContent = "Not a banana";
    } else {
      alert(
        "🍌 No banana detected!\n\nPlease place an actual banana inside the scanner."
      );
      statusText.textContent = "No banana detected";
    }

    statusLabel.textContent = "Try again";

    return { detected: false, confidence: 0, bbox: null };
  }

  console.log(
    `Banana detected with ${(banana.score * 100).toFixed(1)}% confidence`
  );

  statusText.textContent = "🍌 Banana detected!";
  statusLabel.textContent = "Detected";

  return {
    detected: true,
    confidence: banana.score,
    bbox: banana.bbox
  };
}

function classifyPixel(r, g, b) {
  const brightness = (r + g + b) / 3;

  if (brightness < 45 || (r < 50 && g < 50 && b < 50)) {
    return "dark";
  }

  if (g > r * 1.1 && g > b * 1.2) {
    return "green";
  }

  if (
    r > 150 &&
    g > 120 &&
    b < 100 &&
    r > b * 1.5
  ) {
    return "yellow";
  }

  if (
    r > 60 &&
    r < 180 &&
    g > 30 &&
    g < 130 &&
    b < 80 &&
    r > g * 1.2
  ) {
    return "brown";
  }

  return "other";
}

// -----------------------------------------
// BANANA ANALYSIS
// -----------------------------------------

function analyzeBanana(imageData, bbox, canvasWidth, canvasHeight) {
  const pixels = imageData.data;

  let yellowPixels = 0;
  let greenPixels = 0;
  let brownPixels = 0;
  let darkPixels = 0;
  let bananaPixels = 0;

  const [bboxX, bboxY, bboxWidth, bboxHeight] = bbox || [
    0,
    0,
    canvasWidth,
    canvasHeight
  ];

  const startX = Math.max(0, Math.floor(bboxX));
  const startY = Math.max(0, Math.floor(bboxY));
  const endX = Math.min(canvasWidth, Math.ceil(bboxX + bboxWidth));
  const endY = Math.min(canvasHeight, Math.ceil(bboxY + bboxHeight));

  for (let y = startY; y < endY; y += 2) {
    for (let x = startX; x < endX; x += 2) {
      const index = (y * canvasWidth + x) * 4;
      const r = pixels[index];
      const g = pixels[index + 1];
      const b = pixels[index + 2];
      const color = classifyPixel(r, g, b);

      if (color === "other") {
        continue;
      }

      bananaPixels++;

      if (color === "yellow") {
        yellowPixels++;
      } else if (color === "green") {
        greenPixels++;
      } else if (color === "brown") {
        brownPixels++;
      } else if (color === "dark") {
        darkPixels++;
      }
    }
  }

  if (bananaPixels === 0) {
    bananaPixels = 1;
  }

  const green = Math.round((greenPixels / bananaPixels) * 100);
  const yellow = Math.round((yellowPixels / bananaPixels) * 100);
  const brown = Math.round((brownPixels / bananaPixels) * 100);
  const dark = Math.round((darkPixels / bananaPixels) * 100);
  const brownSpots = Math.round(((brownPixels + darkPixels) / bananaPixels) * 100);

  const colorTotals = [
    { name: "Green", value: green },
    { name: "Yellow", value: yellow },
    { name: "Brown", value: brown },
    { name: "Dark", value: dark }
  ];

  colorTotals.sort((a, b) => b.value - a.value);
  const dominantColor = colorTotals[0].value > 0 ? colorTotals[0].name : "Unknown";

  let score = yellow * 0.9 + brown * 0.4 + dark * 0.6 - green * 0.7;
  score = Math.max(0, Math.min(100, score));

  return {
    score: Math.round(score),
    green,
    yellow,
    brown,
    dark,
    dominantColor,
    brownSpots,
    bananaPixels
  };
}

function classifyRipeness(score) {
  if (score <= 25) {
    return {
      status: "UNRIPE",
      title: "UNRIPE",
      message: "Please give me some time. I am still developing.",
      window: "Estimated optimal eating window: 3–5 days",
      icon: "🟢",
      verdictClass: "verdict-ready"
    };
  }

  if (score <= 45) {
    return {
      status: "ALMOST READY",
      title: "ALMOST READY",
      message: "I am getting there. Check me again tomorrow.",
      window: "Estimated optimal eating window: 1–2 days",
      icon: "🟡",
      verdictClass: "verdict-almost"
    };
  }

  if (score <= 65) {
    return {
      status: "PERFECT",
      title: "PERFECT",
      message: "THIS IS THE MOMENT. EAT ME.",
      window: "Estimated optimal eating window: today",
      icon: "🟡",
      verdictClass: "verdict-perfect"
    };
  }

  if (score <= 82) {
    return {
      status: "EAT SOON",
      title: "EAT SOON",
      message: "You have entered the danger zone.",
      window: "Estimated optimal eating window: 1 day",
      icon: "🟠",
      verdictClass: "verdict-soon"
    };
  }

  return {
    status: "TOO LATE",
    title: "TOO LATE",
    message: "You had your chance. 💀",
    window: "Estimated optimal eating window: expired",
    icon: "🔴",
    verdictClass: "verdict-late"
  };
}

function getCondition(status) {
  if (status === "UNRIPE" || status === "ALMOST READY") {
    return "Developing";
  }

  if (status === "PERFECT") {
    return "Good";
  }

  if (status === "EAT SOON") {
    return "Fair";
  }

  return "Poor";
}

function buildScanResult(analysis, detection) {
  const ripeness = classifyRipeness(analysis.score);
  const confidence = Math.round(detection.confidence * 100);

  return {
    score: analysis.score,
    status: ripeness.status,
    title: ripeness.title,
    message: ripeness.message,
    window: ripeness.window,
    icon: ripeness.icon,
    verdictClass: ripeness.verdictClass,
    dominantColor: analysis.dominantColor,
    brownSpots: analysis.brownSpots,
    green: analysis.green,
    yellow: analysis.yellow,
    brown: analysis.brown,
    dark: analysis.dark,
    confidence,
    condition: getCondition(ripeness.status)
  };
}

// -----------------------------------------
// VERDICT + RESULT UI
// -----------------------------------------

function setVerdict(result) {
  verdictCard.className = "verdict-card";
  verdictCard.classList.add(result.verdictClass);

  verdictCard.innerHTML = `
    <div class="icon">${result.icon}</div>
    <div>
      <h3>${result.title}</h3>
      <p>${result.message}</p>
      <small>${result.window}</small>
    </div>
  `;
}

function updateScoreRing(score) {
  const offset = SCORE_RING_CIRCUMFERENCE * (1 - score / 100);
  scoreProgress.style.strokeDashoffset = String(offset);
  scoreNumber.textContent = `${score}%`;
  scoreProgress.closest("svg").setAttribute(
    "aria-label",
    `Ripeness score ${score} percent`
  );
}

function updateResultPanel(result, previewDataUrl) {
  if (previewDataUrl) {
    bananaPreview.src = previewDataUrl;
  }

  updateScoreRing(result.score);

  metricDetected.textContent = "Yes";
  metricColor.textContent = result.dominantColor;
  metricBrownSpots.textContent = `${result.brownSpots}%`;
  metricCondition.textContent = result.condition;
  metricConfidence.textContent = `${result.confidence}%`;

  setVerdict(result);
}

// -----------------------------------------
// SCAN PROGRESS
// -----------------------------------------

function resetProgress() {
  steps.forEach((step) => {
    step.classList.remove("active", "done");
  });
}

function activateStep(index) {
  const step = steps[index];
  if (!step) {
    return;
  }

  if (index > 0) {
    steps[index - 1].classList.add("done");
  }

  step.classList.add("active");
}

function completeAllSteps() {
  steps.forEach((step) => {
    step.classList.add("done");
    step.classList.remove("active");
  });
}

// -----------------------------------------
// SCAN
// -----------------------------------------

async function runScan(imageData, detection) {
  try {
    resetProgress();
    resultPanel.classList.remove("visible");

    statusText.textContent = "SCANNING...";
    statusLabel.textContent = "Processing";
    scanButton.disabled = true;
    scanButton.textContent = "🔄 SCANNING...";

    activateStep(0);
    await delay(350);

    activateStep(1);
    const analysis = analyzeBanana(
      imageData,
      detection.bbox,
      captureCanvas.width,
      captureCanvas.height
    );
    await delay(450);

    activateStep(2);
    await delay(450);

    activateStep(3);
    const result = buildScanResult(analysis, detection);
    await delay(450);

    activateStep(4);
    await delay(650);

    completeAllSteps();

    lastScanResult = result;
    updateResultPanel(result, captureCanvas.toDataURL("image/jpeg", 0.85));
    addHistoryEntry(result);
    resultPanel.classList.add("visible");

    statusText.textContent = "SCAN COMPLETE 🍌";
    statusLabel.textContent = "Ready";

    console.log("Banana analysis:", result);
  } catch (error) {
    console.error(error);

    statusText.textContent = "SCAN FAILED";
    statusLabel.textContent = "Try again";

    alert("Something went wrong during the scan. Please try again.");
  } finally {
    scanButton.textContent = "🔍 SCAN BANANA";
    updateScanButton();
  }
}

// -----------------------------------------
// HISTORY
// -----------------------------------------

function loadHistory() {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("History load error:", error);
    return [];
  }
}

function saveHistory(history) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function formatHistoryStatus(status) {
  if (status === "ALMOST READY") {
    return "Almost Ready";
  }

  if (status === "EAT SOON") {
    return "Eat Soon";
  }

  if (status === "TOO LATE") {
    return "Too Late";
  }

  return status.charAt(0) + status.slice(1).toLowerCase();
}

function renderHistory() {
  const history = loadHistory();

  if (history.length === 0) {
    historyList.innerHTML = `
      <div class="history-item">
        <div class="left">
          <span class="history-badge">🍌</span>
          <span>No scans yet</span>
        </div>
        <span>Scan a banana to begin</span>
      </div>
    `;
    return;
  }

  historyList.innerHTML = history
    .map((entry) => {
      const suffix = entry.status === "TOO LATE" ? " 💀" : "";
      return `
        <div class="history-item">
          <div class="left">
            <span class="history-badge">🍌</span>
            <span>Banana #${String(entry.id).padStart(2, "0")}</span>
          </div>
          <span>${entry.score}% — ${formatHistoryStatus(entry.status)}${suffix}</span>
        </div>
      `;
    })
    .join("");
}

function addHistoryEntry(result) {
  const history = loadHistory();
  const nextId = history.length > 0 ? history[0].id + 1 : 1;

  history.unshift({
    id: nextId,
    score: result.score,
    status: result.status,
    timestamp: Date.now()
  });

  if (history.length > HISTORY_LIMIT) {
    history.length = HISTORY_LIMIT;
  }

  saveHistory(history);
  renderHistory();
}

// -----------------------------------------
// BUTTON EVENTS
// -----------------------------------------

scanButton.addEventListener("click", async () => {
  if (scanButton.disabled) {
    return;
  }

  scanButton.disabled = true;
  scanButton.textContent = "🔍 CHECKING...";

  let imageData;

  try {
    imageData = captureFrame();
  } catch (error) {
    console.error("Capture error:", error);
    alert("Failed to capture the camera frame. Please wait for the camera to be ready.");
    scanButton.textContent = "🔍 SCAN BANANA";
    updateScanButton();
    return;
  }

  try {
    const detection = await detectBanana();

    if (!detection.detected) {
      scanButton.textContent = "🔍 SCAN BANANA";
      updateScanButton();
      return;
    }

    await runScan(imageData, detection);
  } catch (error) {
    console.error("Scan error:", error);
    alert("Something went wrong during the scan. Please try again.");
    statusText.textContent = "SCAN FAILED";
    statusLabel.textContent = "Try again";
    scanButton.textContent = "🔍 SCAN BANANA";
    updateScanButton();
  }
});

// -----------------------------------------
// ASK THE BANANA
// -----------------------------------------

askButton.addEventListener("click", () => {
  const message = lastScanResult
    ? askResponses[lastScanResult.status] || askResponses.default
    : askResponses.default;

  bananaBubble.textContent = message;
  bananaBubble.classList.add("visible");

  setTimeout(() => {
    bananaBubble.classList.remove("visible");
  }, 1800);
});

// -----------------------------------------
// INIT
// -----------------------------------------

renderHistory();
startCamera();
loadModel();
