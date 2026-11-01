const SiteSetting = require("../models/SiteSetting");

const DEFAULT_TICKER_TEXT = [
  "Global markets react to new climate legislation passed in EU summit.",
  "Tech giants announce unified privacy standard for AI development.",
  "Space Agency confirms successful landing on Mars rover mission.",
  "Healthcare reform bill moves to final vote in national senate.",
].join(" ");

exports.getTickerText = async (req, res) => {
  try {
    const setting = await SiteSetting.findOne({ key: "tickerText" });
    res.json({ text: setting?.value || DEFAULT_TICKER_TEXT });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateTickerText = async (req, res) => {
  try {
    const text = String(req.body.text || "").trim();
    if (!text) {
      return res.status(400).json({ message: "Ticker text is required" });
    }

    const setting = await SiteSetting.findOneAndUpdate(
      { key: "tickerText" },
      { value: text },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({ text: setting.value });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
