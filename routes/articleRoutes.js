const express = require("express");
const router = express.Router();
const {
  getArticles,
  getArticleBySlug,
  getMyArticles,
  createArticle,
  updateArticle,
  deleteArticle,
  getPendingArticles,
  moderateArticle,
  getExternalCategoryNews,
} = require("../controllers/articleController");
const { protect, adminOnly } = require("../middleware/auth");

router.get("/", getArticles);
router.get("/external/category", getExternalCategoryNews);
router.get("/mine", protect, getMyArticles);
router.get("/pending", protect, adminOnly, getPendingArticles);
router.get("/:slug", getArticleBySlug);
router.post("/", protect, createArticle);
router.put("/:id", protect, updateArticle);
router.delete("/:id", protect, deleteArticle);
router.put("/:id/moderate", protect, adminOnly, moderateArticle);

module.exports = router;
