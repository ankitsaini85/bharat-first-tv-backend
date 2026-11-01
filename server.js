


const path = require("path");
const dotenv = require("dotenv");
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

// Load backend-local .env
dotenv.config({
  path: path.join(__dirname, ".env"),
});

dotenv.config();

// Routes
const authRoutes = require("./routes/authRoutes");
const articleRoutes = require("./routes/articleRoutes");
const tipRoutes = require("./routes/tipRoutes");
const commentRoutes = require("./routes/commentRoutes");
const adminRoutes = require("./routes/adminRoutes");
const sidebarRoutes = require("./routes/sidebarRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const reporterRoutes = require("./routes/reporterRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const contactRoutes = require("./routes/contactRoutes");
const { getRobots, getSitemap, renderFrontendPage } = require("./controllers/seoController");

// Connect Database
connectDB();

const app = express();

// ================================
// Middleware
// ================================

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ================================
// API Routes
// ================================

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    time: new Date(),
  });
});

app.get("/robots.txt", getRobots);
app.get("/sitemap.xml", getSitemap);

app.use("/api/auth", authRoutes);
app.use("/api/articles", articleRoutes);
app.use("/api/tips", tipRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/sidebar-items", sidebarRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/reporters", reporterRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/contact", contactRoutes);

// ================================
// React Frontend
// ================================

const FRONTEND_PATH =
  process.env.FRONTEND_PATH ||
  "/home/u113860049/domains/surakshasanghnewstv.com/public_html";

// Serve React static files
app.use(express.static(FRONTEND_PATH));

// React Router fallback with route-specific metadata for crawlers and link previews.
app.use(renderFrontendPage(FRONTEND_PATH));

// ================================
// API 404 Handler
// ================================

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

// ================================
// Error Handler
// ================================

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(500).json({
    message: "Server error",
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : undefined,
  });
});

// ================================
// Start Server
// ================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`BHARAT FIRST TV API running on port ${PORT}`);
});