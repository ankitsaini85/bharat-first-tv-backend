const Article = require("../models/Article");
const https = require("https");

const slugify = (title) =>
  title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 80) +
  "-" +
  Date.now().toString(36);

const CATEGORY_TO_HINDI = {
  Politics: "राजनीति",
  Tech: "तकनीक",
  Finance: "वित्त",
  Health: "स्वास्थ्य",
  Climate: "जलवायु",
  Video: "वीडियो",
};

const fetchJson = (url) =>
  new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        let raw = "";
        response.on("data", (chunk) => {
          raw += chunk;
        });
        response.on("end", () => {
          try {
            resolve(JSON.parse(raw || "{}"));
          } catch (error) {
            reject(error);
          }
        });
      })
      .on("error", reject);
  });

exports.getArticles = async (req, res) => {
  try {
    const { category, status, featured, isBreaking, search, limit = 20, page = 1, sortHome } = req.query;
    const fetchAll = limit === "all";
    const numericLimit = Number(limit);
    const filter = {};
    if (category) filter.category = category;
    if (featured) filter.featured = featured === "true";
    if (isBreaking) filter.isBreaking = isBreaking === "true";
    if (status) filter.status = status;
    else filter.status = "approved";
    if (search) filter.$text = { $search: search };

    const sort =
      sortHome === "true"
        ? { featured: -1, featuredAt: -1, publishedAt: -1, createdAt: -1 }
        : { publishedAt: -1, createdAt: -1 };

    let query = Article.find(filter).populate("author", "name title avatar").sort(sort);

    if (!fetchAll) {
      query = query.limit(numericLimit).skip((Number(page) - 1) * numericLimit);
    }

    const articles = await query;

    const total = await Article.countDocuments(filter);
    res.json({ articles, total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getArticleBySlug = async (req, res) => {
  try {
    const article = await Article.findOne({ slug: req.params.slug }).populate(
      "author",
      "name title avatar bio"
    );
    if (!article) return res.status(404).json({ message: "Article not found" });
    article.views += 1;
    await article.save();
    res.json({ article });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMyArticles = async (req, res) => {
  try {
    const articles = await Article.find({ author: req.user._id }).sort({ createdAt: -1 });
    res.json({ articles });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createArticle = async (req, res) => {
  try {
    const {
      title,
      content,
      category,
      sections,
      excerpt,
      coverImage,
      videoUrl,
      mediaType,
      reporterName,
      reporterDescription,
      location,
      tags,
      metaDescription,
      keywords,
      status,
      homeOrder,
    } = req.body;
    if (!title || !content || !category) {
      return res.status(400).json({ message: "Title, content and category are required" });
    }

    const normalizedMediaType = mediaType === "video" ? "video" : "image";
    const normalizedCoverImage = normalizedMediaType === "image" ? coverImage || "" : "";
    const normalizedVideoUrl = normalizedMediaType === "video" ? videoUrl || "" : "";

    const normalizedStatus = ["draft", "pending", "approved", "rejected"].includes(status)
      ? status
      : "draft";
    const articleStatus = req.user.role === "admin" && normalizedStatus === "approved" ? "approved" : normalizedStatus === "pending" ? "pending" : "draft";

    const article = await Article.create({
      title,
      slug: slugify(title),
      content,
      category,
      sections: Array.isArray(sections)
        ? sections
            .filter((section) => section && typeof section === "object")
            .map((section) => ({
              image: typeof section.image === "string" ? section.image : "",
              content: typeof section.content === "string" ? section.content : "",
            }))
            .filter((section) => section.image || section.content)
        : [],
      excerpt,
      coverImage: normalizedCoverImage,
      videoUrl: normalizedVideoUrl,
      mediaType: normalizedMediaType,
      reporterName: reporterName || req.user.name,
      reporterDescription: reporterDescription || "",
      location,
      tags: tags || [],
      metaDescription,
      keywords,
      isBreaking: Boolean(req.body.isBreaking),
      featured: Boolean(req.body.featured),
      featuredAt: req.body.featured ? new Date() : null,
      homeOrder: homeOrder === undefined || homeOrder === null || homeOrder === "" ? undefined : Number(homeOrder),
      author: req.user._id,
      status: articleStatus,
      publishedAt: articleStatus === "approved" ? new Date() : undefined,
    });
    res.status(201).json({ article });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).json({ message: "Article not found" });
    if (String(article.author) !== String(req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to edit this article" });
    }
    if (req.body.mediaType !== undefined || req.body.coverImage !== undefined || req.body.videoUrl !== undefined) {
      const nextMediaType = req.body.mediaType === "video" ? "video" : "image";
      article.mediaType = nextMediaType;
      article.coverImage = nextMediaType === "image" ? req.body.coverImage || article.coverImage || "" : "";
      article.videoUrl = nextMediaType === "video" ? req.body.videoUrl || article.videoUrl || "" : "";
    }

    const allowed = [
      "title",
      "content",
      "category",
      "sections",
      "excerpt",
      "reporterName",
      "reporterDescription",
      "location",
      "tags",
      "metaDescription",
      "keywords",
      "status",
      "isBreaking",
      "featured",
      "homeOrder",
    ];
    const adminOnlyFields = ["isBreaking", "featured", "homeOrder"];
    allowed.forEach((f) => {
      if (req.user.role !== "admin" && adminOnlyFields.includes(f)) return;
      if (req.body[f] !== undefined) article[f] = req.body[f];
    });
    if (req.user.role !== "admin" && !["draft", "pending"].includes(article.status)) {
      article.status = "pending";
    }
    if (req.body.featured === true && !article.featuredAt) {
      article.featuredAt = new Date();
    }
    if (req.body.featured === true && article.featured && req.body.bumpFeaturedAt === true) {
      article.featuredAt = new Date();
    }
    if (req.body.featured === false) {
      article.featuredAt = null;
      article.homeOrder = null;
    }
    if (req.body.status === "approved" && !article.publishedAt) {
      article.publishedAt = new Date();
    }
    await article.save();
    res.json({ article });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).json({ message: "Article not found" });
    if (String(article.author) !== String(req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }
    await article.deleteOne();
    res.json({ message: "Article deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPendingArticles = async (req, res) => {
  try {
    const articles = await Article.find({ status: "pending" })
      .populate("author", "name title avatar")
      .sort({ createdAt: -1 });
    res.json({ articles });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.moderateArticle = async (req, res) => {
  try {
    const { decision } = req.body; // "approved" | "rejected"
    if (!["approved", "rejected"].includes(decision)) {
      return res.status(400).json({ message: "Invalid decision" });
    }
    const article = await Article.findByIdAndUpdate(
      req.params.id,
      { status: decision, publishedAt: decision === "approved" ? new Date() : undefined },
      { new: true }
    );
    if (!article) return res.status(404).json({ message: "Article not found" });
    res.json({ article });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getExternalCategoryNews = async (req, res) => {
  try {
    const apiKey = process.env.SERPAPI_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: "SERPAPI_KEY is not configured" });
    }

    const rawCategory = String(req.query.category || "").trim();
    if (!rawCategory) {
      return res.status(400).json({ message: "Category is required" });
    }

    const categoryInHindi = CATEGORY_TO_HINDI[rawCategory] || rawCategory;
    const start = Number(req.query.start || 0);

    const params = new URLSearchParams({
      engine: "google",
      q: `${categoryInHindi} ताज़ा हिंदी समाचार`,
      location: "India",
      hl: "hi",
      gl: "in",
      google_domain: "google.co.in",
      safe: "active",
      num: "20",
      start: String(start),
      api_key: apiKey,
    });

    const data = await fetchJson(`https://serpapi.com/search.json?${params.toString()}`);
    const organicResults = Array.isArray(data.organic_results) ? data.organic_results : [];

    const articles = organicResults.map((item, index) => ({
      _id: `ext-${start + index + 1}`,
      title: item.title || "",
      excerpt: item.snippet || "",
      category: categoryInHindi,
      source: item.source || "",
      publishedAt: item.date || "",
      coverImage: "",
      externalUrl: item.link || "",
    }));

    return res.json({
      articles,
      total: articles.length,
      category: categoryInHindi,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
