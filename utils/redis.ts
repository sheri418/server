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

    // Adding test commands
    // redis.set('testKey', 'testValue').then((result) => {
    //     console.log('Test key set result:', result);
    //     return redis.get('testKey');
    // }).then((value) => {
    //     console.log('Test key get value:', value);
    // }).catch((err) => {
    //     console.error('Redis command error:', err);
    // });
});

redis.on('error', (err) => {
    console.error('Redis connection error:', err);
});

export { redis };
