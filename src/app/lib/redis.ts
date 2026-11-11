import { createClient } from "redis";

const globalForRedis = globalThis as unknown as {
    redisClient: ReturnType<typeof createClient> | undefined;
};

let redisUrl = process.env.REDIS_URL?.trim() || "redis://localhost:6379";

// Automatically enforce rediss:// for Upstash (Upstash on port 6379 mandates TLS)
if (redisUrl.startsWith("redis://") && redisUrl.includes("upstash.io")) {
    redisUrl = redisUrl.replace(/^redis:\/\//, "rediss://");
}

const client =
    globalForRedis.redisClient ??
    createClient({
        url: redisUrl,
        pingInterval: 30000,
        socket: {
            keepAlive: true,
            connectTimeout: 10000,
            reconnectStrategy: (retries) => Math.min(retries * 100, 3000),
        },
    });

client.on("error", (err) => {
    // Avoid unhandled error crashes during transient socket closures in serverless
    console.error("Redis Socket Warning:", err?.message || err);
});

if (!client.isOpen) {
    client.connect().catch((err) => console.error("Redis connection error:", err));
}

// Reuse connection across warm invocations in serverless environments
globalForRedis.redisClient = client;

export default client;
