// Rate Limiter Service
// Prevents API abuse and manages request throttling

interface RateLimitConfig {
    maxRequests: number;
    windowMs: number;
}

interface RequestRecord {
    count: number;
    resetTime: number;
}

class RateLimiter {
    private requests: Map<string, RequestRecord> = new Map();
    private config: RateLimitConfig;

    constructor(config: RateLimitConfig = { maxRequests: 15, windowMs: 60000 }) {
        this.config = config;

        // Clean up old records every minute
        setInterval(() => this.cleanup(), 60000);
    }

    /**
     * Check if request is allowed
     */
    async checkLimit(key: string): Promise<{ allowed: boolean; retryAfter?: number }> {
        const now = Date.now();
        const record = this.requests.get(key);

        // No record or expired window
        if (!record || now >= record.resetTime) {
            this.requests.set(key, {
                count: 1,
                resetTime: now + this.config.windowMs
            });
            return { allowed: true };
        }

        // Within window
        if (record.count < this.config.maxRequests) {
            record.count++;
            return { allowed: true };
        }

        // Rate limit exceeded
        const retryAfter = Math.ceil((record.resetTime - now) / 1000);
        return {
            allowed: false,
            retryAfter
        };
    }

    /**
     * Reset limit for a key
     */
    reset(key: string): void {
        this.requests.delete(key);
    }

    /**
     * Clean up expired records
     */
    private cleanup(): void {
        const now = Date.now();
        for (const [key, record] of this.requests.entries()) {
            if (now >= record.resetTime) {
                this.requests.delete(key);
            }
        }
    }

    /**
     * Get current usage for a key
     */
    getUsage(key: string): { count: number; limit: number; resetIn: number } | null {
        const record = this.requests.get(key);
        if (!record) return null;

        const now = Date.now();
        if (now >= record.resetTime) return null;

        return {
            count: record.count,
            limit: this.config.maxRequests,
            resetIn: Math.ceil((record.resetTime - now) / 1000)
        };
    }
}

// Export singleton instance
export const aiRateLimiter = new RateLimiter({
    maxRequests: 15, // Gemini free tier: 15 requests/minute
    windowMs: 60000  // 1 minute
});

// Export class for testing
export { RateLimiter };
