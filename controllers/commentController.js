const Comment = require("../models/Comment");

exports.getAllCommentsForAdmin = async (req, res) => {
  try {
    const comments = await Comment.find()
      .populate("article", "title slug")
      .sort({ createdAt: -1 });
    res.json({ comments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteCommentForAdmin = async (req, res) => {
  try {
    const comment = await Comment.findByIdAndDelete(req.params.id);
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    res.json({ message: "Comment deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getCommentsForArticle = async (req, res) => {
  try {
    const comments = await Comment.find({ article: req.params.articleId }).sort({ createdAt: -1 });
    res.json({ comments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addComment = async (req, res) => {
  try {
    const { name, text } = req.body;
    if (!text) return res.status(400).json({ message: "Comment text is required" });
    const comment = await Comment.create({
      article: req.params.articleId,
      name: name || "Anonymous Reader",
      text,
    });
    res.status(201).json({ comment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.likeComment = async (req, res) => {
  try {
    const comment = await Comment.findByIdAndUpdate(
      req.params.id,
      { $inc: { likes: 1 } },
      { new: true }
    );
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    res.json({ comment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
