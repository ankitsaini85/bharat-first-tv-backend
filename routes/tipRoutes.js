const express = require("express");
const router = express.Router();
const { createTip, getTips, getPublicTips, updateTipStatus, deleteTip } = require("../controllers/tipController");
const { protect, adminOnly } = require("../middleware/auth");

router.post("/", createTip);
router.get("/public", getPublicTips);
router.get("/", protect, adminOnly, getTips);
router.put("/:id", protect, adminOnly, updateTipStatus);
router.delete("/:id", protect, adminOnly, deleteTip);

module.exports = router;
