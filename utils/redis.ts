import { Redis } from "ioredis";
require('dotenv').config();

const getRedisUrl = (): string => {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
        throw new Error('Redis URL not provided in environment variables');
    }
    return redisUrl;
};

const redis = new Redis(getRedisUrl());

redis.on('connect', () => {
    console.log('Redis connected successfully');
});

redis.on('error', (err) => {
    console.error('Redis connection error:', err);
});

export { redis };
