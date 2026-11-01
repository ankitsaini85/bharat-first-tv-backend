const express = require("express");
const router = express.Router();
const {
	getOverview,
	getReporters,
	verifyReporter,
	deleteReporter,
	toggleBestPerformer,
	updateReporterCardDetails,
} = require("../controllers/adminController");
const { updateTickerText } = require("../controllers/settingsController");
const {
	getAllSidebarItems,
	createSidebarItem,
	deleteSidebarItem,
} = require("../controllers/sidebarController");
const { getAllCommentsForAdmin, deleteCommentForAdmin } = require("../controllers/commentController");
const { protect, adminOnly } = require("../middleware/auth");

router.use(protect, adminOnly);
router.get("/overview", getOverview);
router.get("/reporters", getReporters);
router.put("/reporters/:id/verify", verifyReporter);
router.put("/reporters/:id/best-performer", toggleBestPerformer);
router.put("/reporters/:id/card-details", updateReporterCardDetails);
router.delete("/reporters/:id", deleteReporter);
router.get("/sidebar-items", getAllSidebarItems);
router.post("/sidebar-items", createSidebarItem);
router.delete("/sidebar-items/:id", deleteSidebarItem);
router.get("/comments", getAllCommentsForAdmin);
router.delete("/comments/:id", deleteCommentForAdmin);
router.put("/ticker", updateTickerText);

module.exports = router;
