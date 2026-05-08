import { MemoryIdempotencyStore } from "./memoryIdempotencyStore.js";
import { UpstashRedisIdempotencyStore } from "./upstashRedisIdempotencyStore.js";
const memoryStoreSingleton = new MemoryIdempotencyStore();
export const createIdempotencyStore = () => {
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (redisUrl !== undefined && redisToken !== undefined) {
        return new UpstashRedisIdempotencyStore({
            url: redisUrl,
            token: redisToken
        });
    }
    return memoryStoreSingleton;
};
