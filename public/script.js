const scanButton = document.getElementById("scanButton");
const imageInput = document.getElementById("imageInput");
const camera = document.getElementById("camera");
const statusText = document.getElementById("statusText");
const statusLabel = document.getElementById("statusLabel");
const varietyCards =
    document.querySelectorAll(".variety-card");

const selectedVarietyText =
    document.getElementById("selectedVariety");

let selectedVariety = null;
varietyCards.forEach((card) => {

    card.addEventListener("click", () => {

        varietyCards.forEach((item) => {

            item.classList.remove("selected");

            item.setAttribute(
                "aria-pressed",
                "false"
            );

        });

        card.classList.add("selected");

        card.setAttribute(
            "aria-pressed",
            "true"
        );

        selectedVariety =
            card.dataset.variety;

        const varietyName =
            card.querySelector(
                ".variety-name"
            ).textContent;

        selectedVarietyText.textContent =
            `Selected banana: ${varietyName} ✓`;

        console.log(
            "🍌 Selected variety:",
            selectedVariety
        );
    });

});


// ========================================
// OPEN FILE CHOOSER
// ========================================

scanButton.addEventListener("click", async () => {

    console.log("🔍 SCAN BUTTON CLICKED");

    if (!camera.srcObject) {
        console.error("❌ Camera is not running");
        alert("Camera is not ready yet.");
        return;
    }

    if (camera.videoWidth === 0 || camera.videoHeight === 0) {
        console.error("❌ Camera video dimensions are not ready");
        alert("Please wait for the camera to become ready.");
        return;
    }

    try {

        scanButton.disabled = true;
        scanButton.textContent = "🔍 CHECKING...";

        console.log("📸 Capturing camera frame...");

        const imageBlob = await captureFrame();

        if (!imageBlob) {
            throw new Error("Could not capture camera frame.");
        }

        console.log(
            "✅ Frame captured:",
            imageBlob.size,
            "bytes"
        );

        console.log("🔍 Sending image to backend...");

        const result = await scanImage(imageBlob);

        if (!result) {
            throw new Error("No analysis result received.");
        }

        console.log("🍌 Scan result:", result);

        displayResult(result);

    } catch (error) {

        console.error("❌ SCAN ERROR:", error);

        alert(
            "Something went wrong during the scan. Check the browser console."
        );

    } finally {

        scanButton.disabled = false;
        scanButton.textContent = "🔍 SCAN BANANA";

    }

});


// ========================================
// IMAGE SELECTED
// ========================================

imageInput.addEventListener("change", async () => {

    if (!modelsReady) {
        alert(
            "🧠 Banana Intelligence is still waking up. Please wait."
        );
        return;
    }

    const file = imageInput.files[0];

    if (!file) {
        return;
    }

    console.log(
        "📤 Upload selected:",
        file.name
    );

    showSelectedFile(file);


    // ========================================
    // COCO-SSD: PRIMARY BANANA DETECTION
    // ========================================

    const bananaObject =
        await detectBananaObject(file);

    if (!bananaObject) {

        alert(
            "🍌 I couldn't locate a banana in this image."
        );

        return;
    }


    console.log(
        `🍌 BANANA LOCATED — ${(bananaObject.score * 100).toFixed(2)}%`
    );


    // ========================================
    // MOBILE NET: OPTIONAL CLASSIFICATION
    // ========================================

    const aiResult =
        await analyzeUploadedImage(file);

    if (aiResult) {

        console.log(
            "🧠 MobileNet result:",
            aiResult
        );

    }


    // ========================================
    // CROP BANANA
    // ========================================

    const bananaCrop =
        await cropBananaImage(
            file,
            bananaObject
        );

    if (!bananaCrop) {

        console.log(
            "❌ Could not crop banana."
        );

        return;
    }


    console.log(
        "✅ Banana cropped:",
        bananaCrop.size,
        "bytes"
    );


    // ========================================
    // QUALITY ANALYSIS
    // ========================================

    const qualityResult =
        await scanImage(bananaCrop);

    if (!qualityResult) {

        console.log(
            "❌ Quality analysis failed."
        );

        return;
    }


    console.log(
        "🍌 Quality analysis:",
        qualityResult
    );


    displayResult(qualityResult);

});

console.log(
    "✅ Banana analysis completed"
);


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

if (selectedVariety) {

    formData.append(
        "variety",
        selectedVariety
    );
}

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
// DISPLAY ANALYSIS RESULT
// ========================================

function displayResult(result) {

    if (!result || !result.success) {
        console.error("❌ Invalid analysis result.");
        return;
    }

    console.log("📊 Displaying Banana Report:", result);

    // Get UI elements
    const resultPanel =
        document.getElementById("resultPanel");

    const scoreNumber =
        document.getElementById("scoreNumber");

    const bananaDetectedValue =
        document.getElementById("bananaDetectedValue");

    const bananaColorValue =
        document.getElementById("bananaColorValue");

    const brownSpotsValue =
        document.getElementById("brownSpotsValue");

    const conditionValue =
        document.getElementById("conditionValue");

    const confidenceValue =
        document.getElementById("confidenceValue");

    const verdictCard =
        document.getElementById("verdictCard");

    const verdictIcon =
        document.getElementById("verdictIcon");

    const verdictTitle =
        document.getElementById("verdictTitle");

    const verdictMessage =
        document.getElementById("verdictMessage");

    const verdictWindow =
        document.getElementById("verdictWindow");


    // Check backend data
    const visual =
        result.visualAnalysis;

    const ripeness =
        result.ripeness;

    if (!visual || !ripeness) {
        console.error(
            "❌ Missing visualAnalysis or ripeness data."
        );
        return;
    }


    // Get values
    const score =
        ripeness.score ?? 0;

    const yellow =
        visual.yellowPercent ?? 0;

    const green =
        visual.greenPercent ?? 0;

    const brown =
        visual.brownPercent ?? 0;

    const dark =
        visual.darkPercent ?? 0;


    // Determine dominant visible color
    let dominantColor = "Unknown";

    if (
        yellow >= green &&
        yellow >= brown &&
        yellow >= dark
    ) {
        dominantColor = "Yellow";
    }

    else if (
        green >= yellow &&
        green >= brown &&
        green >= dark
    ) {
        dominantColor = "Green";
    }

    else if (
        brown >= yellow &&
        brown >= green &&
        brown >= dark
    ) {
        dominantColor = "Brown";
    }

    else if (dark >= yellow && dark >= green) {
        dominantColor = "Dark";
    }


    // Update report
    if (scoreNumber) {
        scoreNumber.textContent = `${score}%`;
    }

    if (bananaDetectedValue) {
        bananaDetectedValue.textContent = "Yes";
    }

    if (bananaColorValue) {
        bananaColorValue.textContent = dominantColor;
    }

    if (brownSpotsValue) {
        brownSpotsValue.textContent =
            `${brown.toFixed(1)}%`;
    }

    if (conditionValue) {
        conditionValue.textContent =
            ripeness.condition;
    }

    if (confidenceValue) {
        confidenceValue.textContent =
            `${Math.round(score)}%`;
    }


    // Verdict style
    if (verdictCard) {
        verdictCard.className =
            "verdict-card";
    }

    let icon = "🟡";

    switch (ripeness.stage) {

        case "NOT RIPE":
            icon = "🟢";
            verdictCard?.classList.add(
                "verdict-ready"
            );
            break;

        case "ALMOST READY":
            icon = "🟡";
            verdictCard?.classList.add(
                "verdict-perfect"
            );
            break;

        case "READY TO EAT":
            icon = "🟢";
            verdictCard?.classList.add(
                "verdict-ready"
            );
            break;

        case "EAT SOON":
            icon = "🟠";
            verdictCard?.classList.add(
                "verdict-soon"
            );
            break;

        case "OVER-RIPE":
        case "POSSIBLE VISUAL SPOILAGE":
            icon = "🔴";
            verdictCard?.classList.add(
                "verdict-late"
            );
            break;
    }


    if (verdictIcon) {
        verdictIcon.textContent = icon;
    }

    if (verdictTitle) {
        verdictTitle.textContent =
            ripeness.stage;
    }

    if (verdictMessage) {
        verdictMessage.textContent =
            ripeness.recommendation;
    }

    if (verdictWindow) {
        verdictWindow.textContent =
            "Visual AI estimate — inspect the banana physically before eating.";
    }


    // Show result panel
    if (resultPanel) {
        resultPanel.classList.add("visible");

        resultPanel.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
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


// ========================================
// AI MODELS
// ========================================

let aiModel = null;
let objectDetectionModel = null;

let modelsReady = false;


// Load MobileNet
async function loadAIModel() {

    console.log("🧠 Loading MobileNet...");

    try {

        aiModel = await mobilenet.load();

        console.log(
            "✅ MobileNet loaded successfully!"
        );

        return aiModel;

    } catch (error) {

        console.error(
            "❌ MobileNet loading failed:",
            error
        );

        throw error;
    }
}


// Load COCO-SSD
async function loadObjectDetectionModel() {

    console.log("📦 Loading COCO-SSD...");

    try {

        objectDetectionModel =
            await cocoSsd.load();

        console.log(
            "✅ COCO-SSD loaded successfully!"
        );

        return objectDetectionModel;

    } catch (error) {

        console.error(
            "❌ COCO-SSD loading failed:",
            error
        );

        throw error;
    }
}


// Load both models
async function loadModels() {

    console.log("🧠 Initializing AI...");

    try {

        await Promise.all([
            loadAIModel(),
            loadObjectDetectionModel()
        ]);

        modelsReady = true;

        console.log(
            "✅ All AI models are ready!"
        );

    } catch (error) {

        modelsReady = false;

        console.error(
            "❌ AI initialization failed:",
            error
        );
    }
}

loadModels();

async function detectBananaObject(file) {

    if (!objectDetectionModel) {

        console.error(
            "❌ COCO-SSD is not loaded yet."
        );

        return null;
    }

    console.log(
        "🔎 Locating objects in:",
        file.name
    );

    const imageURL =
        URL.createObjectURL(file);

    const image =
        new Image();

    return new Promise((resolve) => {

        image.onload = async () => {

            try {

                const predictions =
                    await objectDetectionModel.detect(
                        image,
                        20,
                        0.30
                    );

                console.log(
                    "📦 COCO-SSD detections:"
                );

                predictions.forEach(
                    (prediction, index) => {

                        console.log(
                            `${index + 1}. ${prediction.class} — ${(prediction.score * 100).toFixed(2)}%`
                        );

                        console.log(
                            "Bounding box:",
                            prediction.bbox
                        );
                    }
                );


                const banana =
                    predictions.find(
                        prediction =>
                            prediction.class === "banana"
                    );


                if (!banana) {

                    console.log(
                        "❌ Banana location not found"
                    );

                    resolve(null);
                    return;
                }


                console.log(
                    "🍌 Banana location found!"
                );


                console.log(
                    "Confidence:",
                    `${(banana.score * 100).toFixed(2)}%`
                );


                console.log(
                    "Bounding box:",
                    banana.bbox
                );


                resolve(banana);

            } catch (error) {

                console.error(
                    "❌ Object detection failed:",
                    error
                );

                resolve(null);

            } finally {

                URL.revokeObjectURL(
                    imageURL
                );
            }
        };

        image.src = imageURL;
    });
}

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
        return null;
    }

    console.log(
        "🧠 Analyzing uploaded image:",
        file.name
    );

    const imageURL =
        URL.createObjectURL(file);

    const image =
        new Image();

    return new Promise((resolve) => {

        image.onload = async () => {

            try {

                const predictions =
                    await aiModel.classify(image);

                console.log(
                    "🍌 MobileNet predictions:"
                );

                predictions.forEach(
                    (prediction, index) => {

                        console.log(
                            `${index + 1}. ${prediction.className} — ${(prediction.probability * 100).toFixed(2)}%`
                        );

                    }
                );

                // Check banana
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

                // IMPORTANT:
                // Return the result to the caller
                resolve({
                    bananaDetected:
                        bananaResult.detected,

                    confidence:
                        bananaResult.confidence,

                    predictions
                });

            } catch (error) {

                console.error(
                    "❌ AI analysis failed:",
                    error
                );

                resolve(null);

            } finally {

                URL.revokeObjectURL(
                    imageURL
                );

            }
        };

        image.onerror = () => {

            console.error(
                "❌ Could not load uploaded image."
            );

            URL.revokeObjectURL(imageURL);

            resolve(null);
        };

        image.src = imageURL;
    });
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
async function cropBananaImage(file, bananaObject) {

    console.log("✂️ Cropping banana region...");

    const imageURL = URL.createObjectURL(file);

    const image = new Image();

    return new Promise((resolve) => {

        image.onload = () => {

            const [
                x,
                y,
                width,
                height
            ] = bananaObject.bbox;

            // Add a small margin around the detected banana
            const padding = 10;

            const cropX =
                Math.max(0, x - padding);

            const cropY =
                Math.max(0, y - padding);

            const cropWidth =
                Math.min(
                    image.width - cropX,
                    width + padding * 2
                );

            const cropHeight =
                Math.min(
                    image.height - cropY,
                    height + padding * 2
                );


            const canvas =
                document.createElement("canvas");

            canvas.width = cropWidth;
            canvas.height = cropHeight;


            const context =
                canvas.getContext("2d");


            context.drawImage(
                image,

                cropX,
                cropY,
                cropWidth,
                cropHeight,

                0,
                0,
                cropWidth,
                cropHeight
            );


            canvas.toBlob(
                (blob) => {

                    URL.revokeObjectURL(
                        imageURL
                    );

                    if (!blob) {

                        console.error(
                            "❌ Failed to create cropped image."
                        );

                        resolve(null);
                        return;
                    }


                    console.log(
                        "✅ Banana cropped:",
                        cropWidth,
                        "x",
                        cropHeight
                    );


                    resolve(blob);

                },
                "image/jpeg",
                0.95
            );
        };


        image.onerror = () => {

            console.error(
                "❌ Could not load image for cropping."
            );

            URL.revokeObjectURL(
                imageURL
            );

            resolve(null);
        };


        image.src = imageURL;

    });
}