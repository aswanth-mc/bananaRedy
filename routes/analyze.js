const express = require("express");
const multer = require("multer");

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage()
});

router.post("/", upload.single("image"), (req, res) => {

    console.log("🍌 /api/analyze called");

    if (!req.file) {
        console.log("❌ No image received");

        return res.status(400).json({
            success: false,
            message: "No image received"
        });
    }

    console.log("✅ Image received!");
    console.log("📁 File name:", req.file.originalname);
    console.log("📦 File size:", req.file.size, "bytes");
    console.log("🖼️ File type:", req.file.mimetype);

    res.json({
        success: true,
        message: "🍌 Image received successfully!",
        filename: req.file.originalname,
        type: req.file.mimetype,
        size: req.file.size
    });
});

module.exports = router;