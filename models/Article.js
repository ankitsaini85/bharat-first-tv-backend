const mongoose = require("mongoose");

const articleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    excerpt: { type: String, default: "" },
    content: { type: String, required: true },
    category: { type: String, required: true },
    sections: [{ image: { type: String, default: "" }, content: { type: String, default: "" } }],
    coverImage: { type: String, default: "" },
    videoUrl: { type: String, default: "" },
    mediaType: { type: String, enum: ["image", "video"], default: "image" },
    reporterName: { type: String, default: "" },
    reporterDescription: { type: String, default: "" },
    location: { type: String, default: "" },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["draft", "pending", "approved", "rejected"], default: "draft" },
    tags: [{ type: String }],
    metaDescription: { type: String, default: "" },
    keywords: { type: String, default: "" },
    readTimeMinutes: { type: Number, default: 5 },
    views: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
    featuredAt: { type: Date, default: null },
    homeOrder: { type: Number, default: null },
    isBreaking: { type: Boolean, default: false },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

articleSchema.index({ title: "text", content: "text", tags: "text" });

module.exports = mongoose.model("Article", articleSchema);
