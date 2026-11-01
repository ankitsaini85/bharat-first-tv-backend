const Tip = require("../models/Tip");

exports.createTip = async (req, res) => {
  try {
    const { title, category, description, contactInfo, image } = req.body;
    if (!title || !category || !description) {
      return res.status(400).json({ message: "Title, category and description are required" });
    }
    const tip = await Tip.create({ title, category, description, contactInfo, image: image || "" });
    res.status(201).json({ tip });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getTips = async (req, res) => {
  try {
    const tips = await Tip.find().sort({ createdAt: -1 });
    res.json({ tips });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPublicTips = async (req, res) => {
  try {
    const limit = Number(req.query.limit || 5);
    const page = Number(req.query.page || 1);
    const filter = { status: "approved" };
    const tips = await Tip.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);
    const total = await Tip.countDocuments(filter);
    res.json({ tips, total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateTipStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const tip = await Tip.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!tip) return res.status(404).json({ message: "Tip not found" });
    res.json({ tip });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteTip = async (req, res) => {
  try {
    const tip = await Tip.findByIdAndDelete(req.params.id);
    if (!tip) return res.status(404).json({ message: "Tip not found" });
    res.json({ message: "Tip deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
