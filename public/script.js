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
    // COCO-SSD: Where is the banana?
    const bananaObject =
    await detectBananaObject(file);

if (!bananaObject) {
    console.log(
        "❌ Banana location could not be determined."
    );

    return;
}

const bananaCrop =
    await cropBananaImage(
        file,
        bananaObject
    );

if (!bananaCrop) {
    return;
}

console.log(
    "🍌 Cropped banana image:",
    bananaCrop.size,
    "bytes"
);


// Send cropped banana to Node.js
const qualityResult =
    await scanImage(bananaCrop);

if (!qualityResult) {
    return;
}

console.log(
    "🍌 Quality analysis result:",
    qualityResult
);

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
let objectDetectionModel = null;

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
async function loadObjectDetectionModel() {

    try {

        console.log("📦 Loading COCO-SSD...");

        objectDetectionModel =
            await cocoSsd.load();

        console.log(
            "✅ COCO-SSD loaded successfully!"
        );

    } catch (error) {

        console.error(
            "❌ COCO-SSD loading failed:",
            error
        );
    }
}
loadObjectDetectionModel();
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
                        0.5
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