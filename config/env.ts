/**
 * Environment Configuration & Validation
 * Güvenli environment variable yönetimi
 */

// Required environment variables
const requiredEnvVars = [
    'REACT_APP_SUPABASE_URL',
    'REACT_APP_SUPABASE_ANON_KEY'
] as const;

/**
 * Validate environment variables
 * Eksik env var varsa hata fırlat
 */
function validateEnvVars(): void {
    const missing: string[] = [];

    requiredEnvVars.forEach(varName => {
        if (!process.env[varName]) {
            missing.push(varName);
        }
    });

    if (missing.length > 0) {
        const errorMessage = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  CONFIGURATION ERROR: Missing Required Environment Variables
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The following environment variables are required but not set:

${missing.map(v => `  • ${v}`).join('\n')}

Please create a .env file in the project root with these variables.

Example .env file:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For more information, see: https://supabase.com/docs/guides/getting-started
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `.trim();

        console.error(errorMessage);
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
}

// Validate on import
validateEnvVars();

/**
 * Typed and validated configuration
 */
export const config = {
    supabase: {
        url: process.env.REACT_APP_SUPABASE_URL!,
        anonKey: process.env.REACT_APP_SUPABASE_ANON_KEY!
    },

    // Environment detection
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isTest: process.env.NODE_ENV === 'test',

    // Optional configurations with defaults
    features: {
        enableDebugLogs: process.env.REACT_APP_ENABLE_DEBUG_LOGS === 'true',
        enableAnalytics: process.env.REACT_APP_ENABLE_ANALYTICS === 'true'
    }
} as const;

/**
 * Validate Supabase URL format
 */
function validateSupabaseUrl(url: string): boolean {
    try {
        const urlObj = new URL(url);
        return urlObj.protocol === 'https:' && urlObj.hostname.includes('supabase');
    } catch {
        return false;
    }
}

// Additional validation
if (!validateSupabaseUrl(config.supabase.url)) {
    console.warn('⚠️  Supabase URL format looks incorrect. Expected format: https://xxx.supabase.co');
}

// Log configuration in development
if (config.isDevelopment) {
    console.log('🔧 Configuration loaded:', {
        supabaseUrl: config.supabase.url,
        environment: process.env.NODE_ENV,
        features: config.features
    });
}

export default config;
