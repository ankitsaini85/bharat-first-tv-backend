const express = require("express");
const router = express.Router();
const { getSidebarItems } = require("../controllers/sidebarController");

router.get("/", getSidebarItems);

module.exports = router;