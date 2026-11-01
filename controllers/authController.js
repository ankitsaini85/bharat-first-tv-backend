const jwt = require("jsonwebtoken");
const User = require("../models/User");

const genToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });

const buildDefaultCardId = async () => {
  // Format required: BFTV-26-xxxx
  const yearFragment = "26";
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const randomSuffix = Math.floor(Math.random() * 9000 + 1000);
    const candidate = `BFTV-${yearFragment}-${randomSuffix}`;
    const existing = await User.findOne({ cardIdNo: candidate }).select("_id");
    if (!existing) return candidate;
  }
  throw new Error("Unable to generate unique card id. Please try again.");
};

exports.register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      bio,
      organization,
      beat,
      yearsExperience,
      location,
      designation,
      state,
      district,
      mobile,
      dob,
      address,
    } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already registered" });

    const isReporter = !req.body.role || req.body.role === "reporter";
    const generatedCardId = await buildDefaultCardId();
    const user = await User.create({
      name,
      email,
      password,
      bio,
      organization,
      beat,
      yearsExperience,
      location,
      designation,
      state,
      district,
      mobile,
      dob,
      address,
      cardIdNo: generatedCardId,
      role: isReporter ? "reporter" : "admin",
      isVerified: !isReporter,
      approvedAt: isReporter ? null : new Date(),
    });

    if (isReporter) {
      return res.status(201).json({
        user: user.toSafeObject(),
        pendingApproval: true,
        message: "Registration submitted. Please wait for admin approval, then log in.",
      });
    }
    res.status(201).json({ user: user.toSafeObject(), token: genToken(user._id) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    if (user.role === "reporter" && !user.isVerified) {
      return res.status(403).json({ message: "Your reporter account is pending admin approval." });
    }
    res.json({ user: user.toSafeObject(), token: genToken(user._id) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMe = async (req, res) => {
  res.json({ user: req.user });
};

exports.updateMe = async (req, res) => {
  try {
    const baseAllowed = [
      "name",
      "title",
      "bio",
      "bureau",
      "avatar",
      "yearsExperience",
      "beat",
      "organization",
      "notificationPrefs",
      "location",
      "mobile",
      "dob",
      "address",
      "cardPhoto",
      "cardLogo",
    ];
    const adminOnlyAllowed = [
      "designation",
      "state",
      "district",
      "cardIdNo",
    ];
    const allowed = req.user?.role === "admin" ? [...baseAllowed, ...adminOnlyAllowed] : baseAllowed;
    const updates = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });
    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    }).select("-password");
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
