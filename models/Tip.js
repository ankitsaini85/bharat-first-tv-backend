const mongoose = require("mongoose");

const tipSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    contactInfo: { type: String, default: "" },
    image: { type: String, default: "" },
    attachments: [{ type: String }],
    status: {
      type: String,
      enum: ["new", "reviewing", "approved", "resolved", "dismissed"],
      default: "new",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Tip", tipSchema);
