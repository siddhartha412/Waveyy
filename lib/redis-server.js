import { createClient } from "redis";

let redisClientPromise = null;

const getRedisUrl = () => process.env.REDIS_URL || process.env.REDIS_CLOUD_URL || "";

const connectRedis = async () => {
  const url = getRedisUrl();
  if (!url) return null;

  if (!redisClientPromise) {
    redisClientPromise = (async () => {
      const client = createClient({ url });
      client.on("error", () => {});
      await client.connect();
      return client;
    })().catch(() => {
      redisClientPromise = null;
      return null;
    });
  }

  return redisClientPromise;
};

export const getCachedJson = async (key) => {
  const client = await connectRedis();
  if (!client) return null;
  try {
    const raw = await client.get(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const setCachedJson = async (key, value, ttlSeconds = 300) => {
  const client = await connectRedis();
  if (!client) return;
  try {
    await client.set(key, JSON.stringify(value), { EX: ttlSeconds });
  } catch {
    // ignore cache failures
  }
};

