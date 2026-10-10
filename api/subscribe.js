const crypto = require("crypto");
const { put, del } = require("@vercel/blob");

const SUBS_PREFIX = "subs/";

function idFor(endpoint) {
  return crypto.createHash("sha256").update(endpoint).digest("hex").slice(0, 32);
}

function parseBody(body) {
  if (!body) return null;
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return null;
    }
  }
  return body;
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  const subscription = parseBody(req.body);

  try {
    if (req.method === "POST") {
      if (!subscription || !subscription.endpoint) {
        return res.status(400).json({ error: "missing endpoint" });
      }
      const pathname = SUBS_PREFIX + idFor(subscription.endpoint) + ".json";
      await put(pathname, JSON.stringify(subscription), {
        access: "public",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "application/json",
      });
      return res.status(200).json({ ok: true });
    }

    if (req.method === "DELETE") {
      if (!subscription || !subscription.endpoint) {
        return res.status(400).json({ error: "missing endpoint" });
      }
      await del(SUBS_PREFIX + idFor(subscription.endpoint) + ".json");
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "method not allowed" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};