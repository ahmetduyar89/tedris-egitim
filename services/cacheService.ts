type CacheEntry<T> = {
    value: T;
    expiry: number;
};

class CacheService {
    private cache: Map<string, CacheEntry<any>> = new Map();
    private static instance: CacheService;

    private constructor() { }

    public static getInstance(): CacheService {
        if (!CacheService.instance) {
            CacheService.instance = new CacheService();
        }
        return CacheService.instance;
    }

    public set<T>(key: string, value: T, ttlSeconds: number = 3600): void {
        const expiry = Date.now() + ttlSeconds * 1000;
        this.cache.set(key, { value, expiry });
    }

    public get<T>(key: string): T | null {
        const entry = this.cache.get(key);

        if (!entry) {
            return null;
        }

        if (Date.now() > entry.expiry) {
            this.cache.delete(key);
            return null;
        }

        return entry.value as T;
    }

    public delete(key: string): void {
        this.cache.delete(key);
    }

    public clear(): void {
        this.cache.clear();
    }

    public async remember<T>(
        key: string,
        fetcher: () => Promise<T>,
        ttlSeconds: number = 3600
    ): Promise<T> {
        const cached = this.get<T>(key);
        if (cached !== null) {
            console.log(`[Cache] Hit for key: ${key}`);
            return cached;
        }

        console.log(`[Cache] Miss for key: ${key}, fetching...`);
        const fresh = await fetcher();
        this.set(key, fresh, ttlSeconds);
        return fresh;
    }
}

export const cacheService = CacheService.getInstance();
