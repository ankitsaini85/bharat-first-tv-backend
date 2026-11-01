const express = require("express");
const router = express.Router();
const { getTickerText } = require("../controllers/settingsController");

router.get("/ticker", getTickerText);

module.exports = router;
