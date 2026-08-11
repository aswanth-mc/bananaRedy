const express = require("express");

const router = express.Router();

router.post("/", (req, res) => {
    console.log("🍌 /api/analyze route was called!");
    res.json({
        success: true,
        detected: true,
        message: "🍌 Banana received by the backend!",
        ripeness: 87
    });
});

module.exports = router;