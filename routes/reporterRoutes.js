const express = require("express");
const router = express.Router();
const { getBestPerformers, getPublicReporterVerification } = require("../controllers/adminController");

router.get("/best-performers", getBestPerformers);
router.get("/verification/:id", getPublicReporterVerification);

module.exports = router;
