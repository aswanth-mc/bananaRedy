const express = require("express");
const multer = require("multer");

const { analyzeImage } = require("../services/imageAnalyzer");
const { calculateRipeness } =
    require("../services/ripenessAnalyzer");

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage()
});



router.post("/", upload.single("image"), async (req, res) => {

    console.log("🍌 /api/analyze called");

    try {

        if (!req.file) {
            console.log("❌ No image received");

            return res.status(400).json({
                success: false,
                message: "No image received"
            });
        }

        console.log("✅ Image received");
        console.log("📦 File size:", req.file.size);
        console.log("🖼️ File type:", req.file.mimetype);

        console.log("🧠 Starting Sharp analysis...");

        const visualAnalysis =
            await analyzeImage(req.file.buffer);

        console.log("✅ Sharp analysis completed");

        console.log(
            "🎨 Visual analysis:",
            visualAnalysis
        );
        const ripeness =
    calculateRipeness(visualAnalysis);

console.log(
    "🍌 Ripeness analysis:",
    ripeness
);

        return res.json({
            success: true,
            message: "🍌 Image analyzed successfully",
            visualAnalysis,
            ripeness
        });

    } catch (error) {

        console.error("❌ ANALYSIS ERROR:");
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Image analysis failed",
            error: error.message
        });
    }
});

module.exports = router;