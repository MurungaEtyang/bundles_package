// redisClient.js
import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const redis = new Redis(REDIS_URL);

// separate client for pub/sub if needed
const redisSub = new Redis(REDIS_URL);

export { redis, redisSub };
