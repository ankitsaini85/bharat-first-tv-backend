const express = require("express");
const router = express.Router();
const {
  createContactMessage,
  getContactMessages,
  updateContactMessage,
  deleteContactMessage,
} = require("../controllers/contactController");
const { protect, adminOnly } = require("../middleware/auth");

router.post("/", createContactMessage);
router.get("/", protect, adminOnly, getContactMessages);
router.put("/:id", protect, adminOnly, updateContactMessage);
router.delete("/:id", protect, adminOnly, deleteContactMessage);

module.exports = router;
