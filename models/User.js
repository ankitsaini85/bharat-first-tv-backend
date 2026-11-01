const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ["reporter", "admin"], default: "reporter" },
    designation: { type: String, default: "REPORTER", trim: true },
    state: { type: String, default: "", trim: true },
    district: { type: String, default: "", trim: true },
    mobile: { type: String, default: "", trim: true },
    dob: { type: String, default: "", trim: true },
    address: { type: String, default: "", trim: true },
    cardPhoto: { type: String, default: "" },
    cardLogo: { type: String, default: "" },
    cardIdNo: { type: String, default: "", trim: true },
    title: { type: String, default: "Correspondent" },
    bio: { type: String, default: "" },
    bureau: { type: String, default: "" },
    avatar: { type: String, default: "" },
    yearsExperience: { type: Number, default: 0 },
    beat: { type: String, default: "" },
    organization: { type: String, default: "" },
    isVerified: { type: Boolean, default: false },
    approvedAt: { type: Date, default: null },
    isBestPerformer: { type: Boolean, default: false },
    location: { type: String, default: "" },
    notificationPrefs: {
      breakingNews: { type: Boolean, default: true },
      editorialFeedback: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
