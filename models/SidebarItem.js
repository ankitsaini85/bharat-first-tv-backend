const mongoose = require("mongoose");

const sidebarItemSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["video", "review", "reporter"],
      required: true,
    },
    title: { type: String, required: true, trim: true },
    body: { type: String, default: "" },
    caption: { type: String, default: "" },
    mediaUrl: { type: String, default: "" },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SidebarItem", sidebarItemSchema);