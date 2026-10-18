
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/api/health", async (req, res) => {
  try {
    if (!process.env.MONGODB_URI) {
      return res.status(503).json({
        status: "degraded",
        message: "MONGODB_URI is not configured"
      });
    }

    await mongoose.connect(process.env.MONGODB_URI);

    res.json({
      status: "ok",
      message: "26hrs Hackathon API and MongoDB are connected"
    });
  } catch (error) {
    console.error("Health check failed:", error.message);
    res.status(503).json({
      status: "degraded",
      message: "Database connection failed"
    });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
