const Article = require("../models/Article");
const fs = require("fs/promises");
const path = require("path");

const SITE_URL = (process.env.SEO_SITE_URL || "https://bharatfirsttvnews.com").replace(/\/+$/, "");
const STATIC_PATHS = ["/", "/about-us", "/contact", "/privacy-policy", "/terms-of-service"];
const STATIC_METADATA = {
  "/about-us": ["About Bharat First TV | Bharat First News", "Learn about Bharat First TV, an independent digital news platform sharing trusted news and reporting from India."],
  "/contact": ["Contact Bharat First TV | News Tips & Feedback", "Contact Bharat First TV with news tips, feedback, questions, and story suggestions."],
  "/privacy-policy": ["Privacy Policy | Bharat First TV", "Read the Bharat First TV privacy policy and learn how information is handled when you use our news website."],
  "/terms-of-service": ["Terms of Service | Bharat First TV News", "Review the terms and conditions for using the Bharat First TV news website."],
};

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const escapeXml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const absoluteUrl = (pathname) => new URL(pathname, `${SITE_URL}/`).href;
const absoluteImageUrl = (value) => {
  if (!value) return "";
  try {
    const candidate = new URL(value, SITE_URL);
    return candidate.protocol === "https:" || candidate.protocol === "http:"
      ? candidate.href
      : "";
  } catch (error) {
    if (error instanceof TypeError) return "";
    throw error;
  }
};

exports.getRobots = (req, res) => {
  res.type("text/plain").send(
    [
      "User-agent: *",
      "Allow: /",
      "Disallow: /admin",
      "Disallow: /reporter/",
      "Disallow: /submit-tip",
      `Sitemap: ${absoluteUrl("/sitemap.xml")}`,
      "",
    ].join("\n")
  );
};

exports.getSitemap = async (req, res, next) => {
  try {
    const [articles, categories] = await Promise.all([
      Article.find({ status: "approved" })
        .select("slug updatedAt publishedAt")
        .lean(),
      Article.distinct("category", { status: "approved" }),
    ]);

    const entries = [
      ...STATIC_PATHS.map((path) => ({ path, priority: path === "/" ? "1.0" : "0.6" })),
      ...categories.map((category) => ({
        path: `/category/${encodeURIComponent(category)}`,
        priority: "0.7",
      })),
      ...articles.map((article) => ({
        path: `/article/${encodeURIComponent(article.slug)}`,
        lastmod: article.updatedAt || article.publishedAt,
        priority: "0.8",
      })),
    ];
    const urls = entries
      .map(({ path, lastmod, priority }) => {
        const lastmodTag = lastmod
          ? `<lastmod>${new Date(lastmod).toISOString()}</lastmod>`
          : "";
        return `<url><loc>${escapeXml(absoluteUrl(path))}</loc>${lastmodTag}<priority>${priority}</priority></url>`;
      })
      .join("");

    res
      .type("application/xml")
      .set("Cache-Control", "public, max-age=3600")
      .send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`);
  } catch (error) {
    next(error);
  }
};

exports.renderFrontendPage = (frontendPath) => async (req, res, next) => {
  if (
    req.method !== "GET" ||
    req.path.startsWith("/api") ||
    req.path.startsWith("/uploads")
  ) {
    return next();
  }

  try {
    let status = 200;
    let title = "Bharat First TV | Bharat First News TV";
    let description =
      "Bharat First TV (Bharat First News TV) brings you the latest Bharat First news, India news, breaking news, and trusted Hindi news updates.";
    let keywords =
      "bharat first tv, bharat first news, bharat first news tv, bharat first tv news, Hindi news, India news, breaking news";
    let image = "";
    let articleData = null;
    let pageType = "website";
    let noIndex = false;
    const pathname = req.path;

    if (STATIC_METADATA[pathname]) {
      [title, description] = STATIC_METADATA[pathname];
    } else if (pathname.startsWith("/category/")) {
      const category = decodeURIComponent(pathname.slice("/category/".length));
      title = `${category} News | Bharat First TV`;
      description = `Read the latest ${category} news and updates from Bharat First TV.`;
      keywords = `${category} news, bharat first tv, bharat first news, bharat first news tv, bharat first tv news`;
      if (!(await Article.exists({ category, status: "approved" }))) {
        status = 404;
        title = "News category not found | Bharat First TV";
        description = "The requested news category could not be found.";
        noIndex = true;
      }
    } else if (/^\/article\/[^/]+$/.test(pathname)) {
      const slug = decodeURIComponent(pathname.slice("/article/".length));
      const article = await Article.findOne({ slug, status: "approved" })
        .populate("author", "name")
        .lean();
      if (article) {
        articleData = article;
        title = `${article.title} | Bharat First TV News`;
        description = String(article.metaDescription || article.excerpt || article.content || "")
          .replace(/<[^>]*>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 160);
        keywords = [
          article.keywords,
          ...(article.tags || []),
          article.category,
          "bharat first tv",
          "bharat first news",
          "bharat first news tv",
          "bharat first tv news",
        ]
          .filter(Boolean)
          .join(", ");
        image = article.coverImage || "";
        pageType = "article";
      } else {
        status = 404;
        title = "News article not found | Bharat First TV";
        description = "The requested news article could not be found.";
        noIndex = true;
      }
    } else if (
      pathname === "/" ||
      pathname === "/submit-tip" ||
      /^\/(admin|reporter)(\/|$)/.test(pathname)
    ) {
      noIndex = pathname !== "/";
    } else {
      status = 404;
      title = "Page not found | Bharat First TV";
      description = "The page you requested could not be found.";
      noIndex = true;
    }

    const canonical = new URL(pathname, `${SITE_URL}/`).href;
    const imageUrl = absoluteImageUrl(image);
    const initialSchema = articleData
      ? JSON.stringify({
          "@context": "https://schema.org",
          "@type": "NewsArticle",
          mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
          headline: articleData.title,
          description,
          image: imageUrl ? [imageUrl] : undefined,
          datePublished: articleData.publishedAt || articleData.createdAt,
          dateModified: articleData.updatedAt,
          author: {
            "@type": "Person",
            name: articleData.reporterName || articleData.author?.name || "Bharat First TV",
          },
          publisher: {
            "@type": "NewsMediaOrganization",
            name: "Bharat First TV",
            url: SITE_URL,
          },
          articleSection: articleData.category,
          keywords,
        }).replace(/</g, "\\u003c")
      : "";
    const tags = [
      `<meta name="description" content="${escapeHtml(description)}">`,
      `<meta name="keywords" content="${escapeHtml(keywords)}">`,
      `<meta name="robots" content="${noIndex ? "noindex, nofollow" : "index, follow, max-image-preview:large"}">`,
      `<link rel="canonical" href="${escapeHtml(canonical)}">`,
      `<meta property="og:type" content="${pageType}">`,
      `<meta property="og:site_name" content="Bharat First TV">`,
      `<meta property="og:title" content="${escapeHtml(title)}">`,
      `<meta property="og:description" content="${escapeHtml(description)}">`,
      `<meta property="og:url" content="${escapeHtml(canonical)}">`,
      ...(imageUrl ? [`<meta property="og:image" content="${escapeHtml(imageUrl)}">`] : []),
      `<meta name="twitter:card" content="summary_large_image">`,
      `<meta name="twitter:title" content="${escapeHtml(title)}">`,
      `<meta name="twitter:description" content="${escapeHtml(description)}">`,
      ...(imageUrl ? [`<meta name="twitter:image" content="${escapeHtml(imageUrl)}">`] : []),
    ].join("\n    ");
    let html = await fs.readFile(path.join(frontendPath, "index.html"), "utf8");
    html = html
      .replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`)
      .replace(/<meta\s+name="description"[^>]*>/i, "")
      .replace(/<meta\s+name="keywords"[^>]*>/i, "")
      .replace(/<meta\s+name="robots"[^>]*>/i, "")
      .replace(/<link\s+rel="canonical"[^>]*>/i, "")
      .replace(/<meta\s+property="og:[^"]+"[^>]*>/gi, "")
      .replace(/<meta\s+name="twitter:[^"]+"[^>]*>/gi, "")
      .replace(
        /<script\s+type="application\/ld\+json"\s+id="seo-structured-data">[\s\S]*?<\/script>/i,
        initialSchema
          ? `<script type="application/ld+json" id="seo-structured-data">${initialSchema}</script>`
          : "$&"
      )
      .replace("</head>", `    ${tags}\n  </head>`);
    return res.status(status).type("html").send(html);
  } catch (error) {
    return next(error);
  }
};
