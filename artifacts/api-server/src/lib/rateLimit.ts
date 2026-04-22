import type { Request, Response, NextFunction } from "express";

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
const WINDOW_MS = 60 * 60 * 1000;

export function rateLimit(opts: { anonLimit: number; authedLimit: number }) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const userId = req.session?.userId;
    const key = userId ? `u:${userId}` : `ip:${ip}`;
    const limit = userId ? opts.authedLimit : opts.anonLimit;
    const now = Date.now();
    const bucket = buckets.get(key);
    if (!bucket || bucket.resetAt < now) {
      buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
      return next();
    }
    bucket.count += 1;
    if (bucket.count > limit) {
      res.setHeader("Retry-After", Math.ceil((bucket.resetAt - now) / 1000).toString());
      return res.status(429).json({
        error: "RATE_LIMITED",
        message: userId
          ? "You've reached the hourly download limit. Try again later."
          : "Too many requests. Create a free account for more downloads.",
      });
    }
    return next();
  };
}

setInterval(() => {
  const now = Date.now();
  for (const [k, b] of buckets) if (b.resetAt < now) buckets.delete(k);
}, 60 * 1000).unref();
