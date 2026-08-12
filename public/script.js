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
    await analyzeUploadedImage(file);

    const aiResult = await analyzeUploadedImage(file);

if (!aiResult) {
    return;
}

if (!aiResult.bananaDetected) {

    alert(
        "🍌 No banana detected!\n\nPlease upload a banana image."
    );

    return;
}

console.log(
    "✅ Banana accepted:",
    aiResult
);

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


let aiModel = null;

async function loadAIModel() {

    console.log("🧠 Loading MobileNet...");

    try {

        // Check TensorFlow.js
        console.log(
            "TensorFlow.js:",
            tf.version.tfjs
        );

        // Check MobileNet
        console.log(
            "MobileNet library:",
            typeof mobilenet
        );

        // Load model
        aiModel = await mobilenet.load();

        console.log(
            "✅ MobileNet loaded successfully!"
        );

        console.log(
            "Model is ready:",
            aiModel
        );

    } catch (error) {

        console.error(
            "❌ MobileNet loading failed:"
        );

        console.error(error);

    }
}

loadAIModel();

async function analyzeCameraImage() {

    if (!aiModel) {
        console.error("❌ AI model is not loaded yet.");
        return;
    }

    const imageBlob = await captureFrame();

    if (!imageBlob) {
        console.error("❌ Could not capture camera frame.");
        return;
    }

    const imageURL = URL.createObjectURL(imageBlob);

    const image = new Image();

    image.onload = async () => {

        try {

            console.log("🧠 Sending image to MobileNet...");

            const predictions =
                await aiModel.classify(image);

            console.log("🍌 MobileNet predictions:");

            predictions.forEach(
                (prediction, index) => {

                    console.log(
                        `${index + 1}. ${prediction.className} — ${(prediction.probability * 100).toFixed(2)}%`
                    );

                }
            );

        } catch (error) {

            console.error(
                "❌ AI analysis failed:",
                error
            );

        } finally {

            URL.revokeObjectURL(imageURL);

        }

    };

    image.src = imageURL;
}


const testAIButton =
    document.getElementById("testAIButton");


if (testAIButton) {

    testAIButton.addEventListener(
        "click",
        analyzeCameraImage
    );

}
async function analyzeUploadedImage(file) {

    if (!aiModel) {
        console.error("❌ AI model is not loaded yet.");
        return;
    }

    console.log("🧠 Analyzing uploaded image:", file.name);

    const imageURL = URL.createObjectURL(file);

    const image = new Image();

    image.onload = async () => {

        try {

            const predictions =
    await aiModel.classify(image);

console.log("🍌 MobileNet predictions:");

predictions.forEach(
    (prediction, index) => {

        console.log(
            `${index + 1}. ${prediction.className} — ${(prediction.probability * 100).toFixed(2)}%`
        );

    }
);


// Check whether MobileNet detected a banana
const bananaResult =
    detectBanana(predictions);


if (bananaResult.detected) {

    console.log(
        `✅ BANANA DETECTED — ${(bananaResult.confidence * 100).toFixed(2)}%`
    );

} else {

    console.log(
        "❌ NO BANANA DETECTED"
    );

}

        } catch (error) {

            console.error(
                "❌ AI analysis failed:",
                error
            );

        } finally {

            URL.revokeObjectURL(imageURL);

        }
    };

    image.src = imageURL;
}

function detectBanana(predictions) {

    const bananaPrediction = predictions.find(
        prediction =>
            prediction.className
                .toLowerCase()
                .includes("banana")
    );

    if (!bananaPrediction) {
        return {
            detected: false,
            confidence: 0
        };
    }

    const confidence =
        bananaPrediction.probability;

    return {
        detected: confidence >= 0.50,
        confidence
    };
}