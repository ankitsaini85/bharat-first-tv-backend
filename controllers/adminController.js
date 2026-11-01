const User = require("../models/User");
const Article = require("../models/Article");
const Tip = require("../models/Tip");

exports.getOverview = async (req, res) => {
  try {
    const [totalArticles, pendingArticles, totalReporters, unverifiedReporters, totalTips, totalViewsAgg] =
      await Promise.all([
        Article.countDocuments({ status: "approved" }),
        Article.countDocuments({ status: "pending" }),
        User.countDocuments({ role: "reporter" }),
        User.countDocuments({ role: "reporter", isVerified: false }),
        Tip.countDocuments(),
        Article.aggregate([{ $group: { _id: null, total: { $sum: "$views" } } }]),
      ]);
    res.json({
      totalArticles,
      pendingArticles,
      totalReporters,
      unverifiedReporters,
      totalTips,
      totalViews: totalViewsAgg[0]?.total || 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getReporters = async (req, res) => {
  try {
    const { verified } = req.query;
    const filter = { role: "reporter" };
    if (verified !== undefined) filter.isVerified = verified === "true";
    const reporters = await User.find(filter).select("-password").sort({ createdAt: -1 });
    res.json({ reporters });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.verifyReporter = async (req, res) => {
  try {
    const reporter = await User.findById(req.params.id);
    if (!reporter) return res.status(404).json({ message: "Reporter not found" });

    reporter.isVerified = true;
    if (!reporter.approvedAt) {
      reporter.approvedAt = new Date();
    }
    await reporter.save();

    const user = reporter.toSafeObject();
    if (!user) return res.status(404).json({ message: "Reporter not found" });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteReporter = async (req, res) => {
  try {
    const user = await User.findOneAndDelete({ _id: req.params.id, role: "reporter" });
    if (!user) return res.status(404).json({ message: "Reporter not found" });
    res.json({ message: "Reporter deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.toggleBestPerformer = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== "reporter") return res.status(404).json({ message: "Reporter not found" });
    user.isBestPerformer = !user.isBestPerformer;
    await user.save();
    res.json({ user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateReporterCardDetails = async (req, res) => {
  try {
    const allowed = [
      "name",
      "designation",
      "cardIdNo",
      "state",
      "district",
      "mobile",
      "dob",
      "address",
      "cardPhoto",
      "avatar",
    ];
    const updates = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const reporter = await User.findOneAndUpdate(
      { _id: req.params.id, role: "reporter" },
      updates,
      { new: true, runValidators: true }
    ).select("-password");

    if (!reporter) {
      return res.status(404).json({ message: "Reporter not found" });
    }

    return res.json({ user: reporter });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getBestPerformers = async (req, res) => {
  try {
    const limit = Number(req.query.limit || 20);
    const reporters = await User.find({ role: "reporter", isBestPerformer: true, isVerified: true })
      .select("name title avatar cardPhoto bio beat organization")
      .sort({ createdAt: -1 })
      .limit(limit);
    res.json({ reporters });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPublicReporterVerification = async (req, res) => {
  try {
    const reporter = await User.findOne({
      _id: req.params.id,
      role: "reporter",
      isVerified: true,
    }).select(
      "name designation title organization state district mobile dob address location cardPhoto avatar cardIdNo approvedAt createdAt isVerified"
    );

    if (!reporter) {
      return res.status(404).json({ message: "Verified reporter not found" });
    }

    return res.json({ reporter });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
