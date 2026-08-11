const scanButton = document.getElementById("scanButton");

async function scanBanana() {
    // 1. Capture camera frame
    const imageBlob = await captureFrame();

    // 2. Send image to Node.js
    const formData = new FormData();
    formData.append("image", imageBlob);

    const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData
    });

    // 3. Get AI result
    const result = await response.json();

    // 4. Update existing UI
    displayResult(result);
}

scanButton.addEventListener("click", scanBanana);