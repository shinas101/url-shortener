import { createClient, type RedisClientType } from 'redis';

// Initialize the client with an explicit type
const client: RedisClientType = createClient({
    url: 'redis://localhost:6379' // Change to your production URI if needed
});

// Handle connection events
client.on('error', (err) => console.error('Redis Client Error', err));

async function runRedisDemo() {
    // 1. Connect to the server
    await client.connect();
    console.log('Connected to Redis successfully!');

    // 2. Set a string value (with a 60-second TTL)
    await client.set('url:sss', 'https://google.com', {
        EX: 100
    });

    await client.quit();
}

runRedisDemo().catch(console.error);
