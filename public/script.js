const scanButton = document.getElementById("scanButton");
const imageInput = document.getElementById("imageInput");
const camera = document.getElementById("camera");
const statusText = document.getElementById("statusText");
const statusLabel = document.getElementById("statusLabel");


// ========================================
// OPEN FILE CHOOSER
// ========================================

scanButton.addEventListener("click", async () => {

    console.log("🔍 Scan button clicked");

    const imageBlob = await captureFrame();

    if (!imageBlob) {
        alert("Unable to capture camera image.");
        return;
    }

    console.log(
        "📸 Frame captured:",
        imageBlob.size,
        "bytes"
    );

    const result = await scanImage(imageBlob);

    if (result) {
        console.log("🍌 Banana analysis completed");
    }

});


// ========================================
// IMAGE SELECTED
// ========================================

imageInput.addEventListener("change", async () => {

    const file = imageInput.files[0];

    if (!file) {
        return;
    }

    console.log("📤 Upload selected:", file.name);

    showSelectedFile(file);

    const result = await scanImage(file);

    if (result) {
        console.log("✅ Upload analysis completed");
    }

});


// ========================================
// SEND IMAGE TO NODE.JS
// ========================================

async function scanImage(imageBlob) {

    try {

        console.log("🔍 Starting banana analysis...");

        const formData = new FormData();

        formData.append(
            "image",
            imageBlob,
            "banana.jpg"
        );

        const response = await fetch("/api/analyze", {
            method: "POST",
            body: formData
        });

        console.log(
            "HTTP status:",
            response.status
        );

        if (!response.ok) {
            throw new Error(
                `Server returned ${response.status}`
            );
        }

        const result = await response.json();

        console.log(
            "🍌 Analysis result:",
            result
        );

        return result;

    } catch (error) {

        console.error(
            "❌ Analysis failed:",
            error
        );

        alert(
            "Something went wrong while analyzing the image."
        );

        return null;
    }
}


// ========================================
// SHOW SELECTED IMAGE
// ========================================

function showSelectedFile(file) {

    const selectedFile =
        document.getElementById("selectedFile");

    const filePreview =
        document.getElementById("filePreview");

    const fileName =
        document.getElementById("fileName");

    const fileSize =
        document.getElementById("fileSize");


    fileName.textContent = file.name;

    fileSize.textContent =
        formatFileSize(file.size);


    const imageURL =
        URL.createObjectURL(file);


    filePreview.innerHTML = `
        <img
            src="${imageURL}"
            alt="Selected banana image"
        >
    `;


    selectedFile.classList.add("visible");
}


// ========================================
// FORMAT FILE SIZE
// ========================================

function formatFileSize(bytes) {

    if (bytes < 1024) {
        return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ========================================
// Scanner
// ========================================
async function startCamera() {

    try {

        console.log("📷 Starting camera...");

        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: "environment"
            },
            audio: false
        });

        camera.srcObject = stream;

        statusText.textContent = "Camera ready";
        statusLabel.textContent = "Connected";

        console.log("✅ Camera started");

    } catch (error) {

        console.error("❌ Camera error:", error);

        statusText.textContent = "Camera unavailable";
        statusLabel.textContent = "Error";

        alert(
            "Unable to access the camera. Please allow camera permission."
        );
    }
}

startCamera();

async function captureFrame() {

    if (!camera.srcObject) {
        console.error("❌ Camera is not running");
        return null;
    }

    const canvas = document.createElement("canvas");

    canvas.width = camera.videoWidth;
    canvas.height = camera.videoHeight;

    const context = canvas.getContext("2d");

    context.drawImage(
        camera,
        0,
        0,
        canvas.width,
        canvas.height
    );

    return new Promise((resolve) => {

        canvas.toBlob(
            (blob) => {
                resolve(blob);
            },
            "image/jpeg",
            0.90
        );

    });
}