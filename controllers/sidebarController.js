const https = require("https");
const SidebarItem = require("../models/SidebarItem");

const fetchJson = (url) =>
  new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        let raw = "";
        response.on("data", (chunk) => {
          raw += chunk;
        });
        response.on("end", () => {
          let parsed;
          try {
            parsed = JSON.parse(raw || "{}");
          } catch (error) {
            reject(error);
            return;
          }

          if (response.statusCode && response.statusCode >= 400) {
            reject(new Error(parsed.error?.message || `YouTube API request failed with status ${response.statusCode}`));
            return;
          }

          resolve(parsed);
        });
      })
      .on("error", reject);
  });

const VIDEO_CACHE_TTL_MS = 30 * 60 * 1000;
const videoCache = { items: [], fetchedAt: 0 };

const mapPlaylistItem = (item) => {
  const videoId = item.snippet?.resourceId?.videoId;
  return {
    _id: `youtube-${videoId}`,
    type: "video",
    title: item.snippet.title || "YouTube video",
    body: item.snippet.description || "",
    caption: item.snippet.channelTitle || "",
    mediaUrl: `https://www.youtube.com/embed/${videoId}`,
    publishedAt: item.snippet.publishedAt || "",
    active: true,
  };
};

const fetchLatestYouTubeVideos = async () => {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const channelId = process.env.YOUTUBE_CHANNEL_ID;

  if (!apiKey || !channelId) {
    throw new Error("YOUTUBE_API_KEY and YOUTUBE_CHANNEL_ID must be configured");
  }

  // The uploads playlist costs 1 quota unit per call, versus 100 for search.
  const uploadsPlaylistId = channelId.startsWith("UC") ? `UU${channelId.slice(2)}` : channelId;
  const params = new URLSearchParams({
    part: "snippet",
    playlistId: uploadsPlaylistId,
    maxResults: "6",
    key: apiKey,
  });

  const data = await fetchJson(`https://www.googleapis.com/youtube/v3/playlistItems?${params.toString()}`);
  const items = Array.isArray(data.items) ? data.items : [];

  return items.filter((item) => item.snippet?.resourceId?.videoId).map(mapPlaylistItem);
};

const getLatestYouTubeVideos = async (limit) => {
  const count = Math.min(Math.max(Number(limit) || 6, 1), 6);
  const isFresh = Date.now() - videoCache.fetchedAt < VIDEO_CACHE_TTL_MS;

  if (!isFresh) {
    try {
      videoCache.items = await fetchLatestYouTubeVideos();
      videoCache.fetchedAt = Date.now();
    } catch (error) {
      console.error("YouTube videos unavailable:", error.message);
      // Retry after a short pause instead of hitting the API on every request.
      videoCache.fetchedAt = Date.now() - VIDEO_CACHE_TTL_MS + 5 * 60 * 1000;
    }
  }

  return videoCache.items.slice(0, count);
};

const normalizeYouTubeUrl = (value) => {
  if (!value) return value;
  const trimmed = value.trim();
  if (trimmed.includes("youtube.com/embed/")) return trimmed;
  if (trimmed.includes("youtu.be/")) {
    const id = trimmed.split("youtu.be/")[1].split(/[?&]/)[0];
    return `https://www.youtube.com/embed/${id}`;
  }
  if (trimmed.includes("youtube.com/watch")) {
    const match = trimmed.match(/[?&]v=([^&]+)/);
    if (match?.[1]) return `https://www.youtube.com/embed/${match[1]}`;
  }
  return trimmed;
};

exports.getSidebarItems = async (req, res) => {
  try {
    const { type, limit = 5 } = req.query;
    if (type === "video") {
      const items = await getLatestYouTubeVideos(limit);
      return res.json({ items });
    }

    const fetchAll = limit === "all";
    const filter = { active: true };
    if (type) filter.type = type;
    let query = SidebarItem.find(filter).sort({ order: 1, createdAt: -1 });
    if (!fetchAll) {
      query = query.limit(Number(limit));
    }
    const items = await query;
    res.json({ items });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllSidebarItems = async (req, res) => {
  try {
    const { type } = req.query;
    const filter = {};
    if (type) filter.type = type;
    const items = await SidebarItem.find(filter).sort({ order: 1, createdAt: -1 });
    res.json({ items });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createSidebarItem = async (req, res) => {
  try {
    const { type, title, body, caption, mediaUrl, order, active } = req.body;
    if (!type || !title) {
      return res.status(400).json({ message: "Type and title are required" });
    }
    const normalizedMediaUrl = type === "video" ? normalizeYouTubeUrl(mediaUrl) : mediaUrl;
    const item = await SidebarItem.create({
      type,
      title,
      body: body || "",
      caption: caption || "",
      mediaUrl: normalizedMediaUrl || "",
      order: Number(order || 0),
      active: active !== undefined ? Boolean(active) : true,
    });
    res.status(201).json({ item });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteSidebarItem = async (req, res) => {
  try {
    const item = await SidebarItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json({ message: "Item deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};