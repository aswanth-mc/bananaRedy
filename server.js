const express = require("express");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 3000;

// Parse JSON requests
app.use(express.json());

// Serve frontend
app.use(express.static(path.join(__dirname, "public")));

// Test API
app.get("/api/test", (req, res) => {
    res.json({
        success: true,
        message: "🍌 Banana Intelligence backend is working!"
    });
});

// Banana analysis API
app.use(
    "/api/analyze",
    require("./routes/analyze")
);

// Start server locally
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(
            `🍌 Banana Intelligence running at http://localhost:${PORT}`
        );
    });
}

module.exports = app;