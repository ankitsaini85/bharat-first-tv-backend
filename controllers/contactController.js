const ContactMessage = require("../models/ContactMessage");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_PATTERN = /^\+?[0-9]{10,13}$/;

exports.createContactMessage = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const mobile = String(req.body.mobile || "").replace(/[\s-]/g, "");
    const email = String(req.body.email || "").trim();
    const message = String(req.body.message || "").trim();

    if (!name || !mobile || !email || !message) {
      return res.status(400).json({ message: "Name, mobile number, email and message are required" });
    }
    if (!MOBILE_PATTERN.test(mobile)) {
      return res.status(400).json({ message: "Enter a valid mobile number" });
    }
    if (!EMAIL_PATTERN.test(email)) {
      return res.status(400).json({ message: "Enter a valid email address" });
    }
    if (name.length > 100 || message.length > 2000) {
      return res.status(400).json({ message: "Name or message is too long" });
    }

    await ContactMessage.create({ name, mobile, email, message });
    res.status(201).json({ message: "Message sent successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getContactMessages = async (req, res) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    res.json({ messages });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateContactMessage = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["new", "read"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    const item = await ContactMessage.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!item) return res.status(404).json({ message: "Message not found" });
    res.json({ message: item });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteContactMessage = async (req, res) => {
  try {
    const item = await ContactMessage.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: "Message not found" });
    res.json({ message: "Message deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
