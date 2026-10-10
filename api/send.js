const { list, del } = require("@vercel/blob");
const webpush = require("web-push");

const SUBS_PREFIX = "subs/";

function parseBody(body) {
  if (!body) return {};
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }
  return body;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "method not allowed" });
  }

  const secret = req.headers["x-push-secret"];
  if (!process.env.PUSH_SEND_SECRET || secret !== process.env.PUSH_SEND_SECRET) {
    return res.status(401).json({ error: "unauthorized" });
  }

  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return res.status(500).json({ error: "VAPID keys not configured" });
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:hello@timps.cc",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  const body = parseBody(req.body);
  const notification = JSON.stringify({
    title: body.title || "New from TIMPS PostCards",
    body: body.body || "A new issue is out.",
    url: body.url || "/",
    icon: body.icon || "assets/icon-192.png",
  });

  try {
    const { blobs } = await list({ prefix: SUBS_PREFIX });

    const results = await Promise.allSettled(
      blobs.map(async (blob) => {
        let subscription;
        try {
          const resp = await fetch(blob.url);
          subscription = await resp.json();
        } catch (err) {
          throw err;
        }
        try {
          await webpush.sendNotification(subscription, notification);
        } catch (err) {
          if (err.statusCode === 404 || err.statusCode === 410) {
            await del(blob.pathname);
          }
          throw err;
        }
      })
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    return res.status(200).json({
      ok: true,
      total: blobs.length,
      sent,
      failed: blobs.length - sent,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};