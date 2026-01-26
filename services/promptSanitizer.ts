/**
 * Utility for sanitizing user inputs before sending them to AI models
 * Helps prevent prompt injection and ensures structured data
 */

export const sanitizePromptInput = (input: string, maxLength: number = 2000): string => {
    if (!input) return '';

    let sanitized = input;

    // 1. Length limiting
    if (sanitized.length > maxLength) {
        sanitized = sanitized.substring(0, maxLength);
    }

    // 2. Remove common prompt injection keywords/phrases
    const suspiciousPatterns = [
        /ignore previous instructions/gi,
        /disregard all previous/gi,
        /system prompt/gi,
        /you are now/gi,
        /forget everything/gi,
        /stop being/gi,
        /as a simulated/gi,
        /jailbreak/gi,
        /dan mode/gi
    ];

    suspiciousPatterns.forEach(pattern => {
        sanitized = sanitized.replace(pattern, '[REMOVED]');
    });

    // 3. Normalize whitespace
    sanitized = sanitized.replace(/\s+/g, ' ').trim();

    // 4. Basic escaping of special characters that might break prompt structure
    // (Optional: depending on how prompts are constructed)

    return sanitized;
};

/**
 * Validates and structures AI input objects
 */
export const validateAIInput = <T extends object>(input: T, requiredFields: (keyof T)[]): boolean => {
    return requiredFields.every(field => {
        const value = input[field];
        if (value === undefined || value === null) return false;
        if (typeof value === 'string' && value.trim() === '') return false;
        return true;
    });
};
