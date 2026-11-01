const express = require("express");
const router = express.Router();
const {
  getCommentsForArticle,
  addComment,
  likeComment,
} = require("../controllers/commentController");

router.get("/:articleId", getCommentsForArticle);
router.post("/:articleId", addComment);
router.put("/like/:id", likeComment);

module.exports = router;
