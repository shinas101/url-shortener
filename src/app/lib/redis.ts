import { createClient } from "redis";

const globalForRedis = globalThis as unknown as {
    redisClient: ReturnType<typeof createClient> | undefined;
};

const client =
    globalForRedis.redisClient ??
    createClient({
        url: process.env.REDIS_URL || "redis://localhost:6379",
        pingInterval: 30000,
        socket: {
            keepAlive: true,
            connectTimeout: 10000,
            reconnectStrategy: (retries) => Math.min(retries * 100, 3000),
        },
    });

if (!client.isOpen) {
    client.connect().catch((err) => console.error("Redis connection error:", err));
}

if (process.env.NODE_ENV !== "production") {
    globalForRedis.redisClient = client;
}

export default client;
