// Enhanced Error Handler
// Provides user-friendly error messages and logging

export enum ErrorType {
    NETWORK = 'NETWORK',
    API_LIMIT = 'API_LIMIT',
    VALIDATION = 'VALIDATION',
    AUTHENTICATION = 'AUTH',
    AI_SERVICE = 'AI_SERVICE',
    DATABASE = 'DATABASE',
    UNKNOWN = 'UNKNOWN'
}

export class AppError extends Error {
    type: ErrorType;
    userMessage: string;
    technicalMessage: string;
    retryable: boolean;
    retryAfter?: number;

    constructor(
        userMessage: string,
        type: ErrorType = ErrorType.UNKNOWN,
        technicalMessage?: string,
        retryable: boolean = false,
        retryAfter?: number
    ) {
        super(userMessage);
        this.name = 'AppError';
        this.type = type;
        this.userMessage = userMessage;
        this.technicalMessage = technicalMessage || userMessage;
        this.retryable = retryable;
        this.retryAfter = retryAfter;
    }
}

/**
 * Handle errors and return user-friendly messages
 */
export function handleError(error: any): AppError {
    console.error('Error occurred:', error);

    // Already an AppError
    if (error instanceof AppError) {
        return error;
    }

    // Network errors
    if (error.message?.includes('fetch') || error.message?.includes('network')) {
        return new AppError(
            'İnternet bağlantınızı kontrol edin ve tekrar deneyin.',
            ErrorType.NETWORK,
            error.message,
            true
        );
    }

    // Rate limit errors
    if (error.message?.includes('429') || error.message?.includes('rate limit')) {
        return new AppError(
            'Çok fazla istek gönderildi. Lütfen bir dakika bekleyip tekrar deneyin.',
            ErrorType.API_LIMIT,
            error.message,
            true,
            60
        );
    }

    // API key errors
    if (error.message?.includes('API key') || error.message?.includes('401')) {
        return new AppError(
            'Sistem yapılandırma hatası. Lütfen yöneticinizle iletişime geçin.',
            ErrorType.AUTHENTICATION,
            error.message,
            false
        );
    }

    // Gemini API errors
    if (error.message?.includes('Gemini') || error.message?.includes('AI')) {
        return new AppError(
            'AI servisi şu anda yanıt veremiyor. Lütfen daha sonra tekrar deneyin.',
            ErrorType.AI_SERVICE,
            error.message,
            true
        );
    }

    // Database errors
    if (error.message?.includes('Supabase') || error.message?.includes('database')) {
        return new AppError(
            'Veritabanı bağlantı hatası. Lütfen tekrar deneyin.',
            ErrorType.DATABASE,
            error.message,
            true
        );
    }

    // Validation errors
    if (error.message?.includes('validation') || error.message?.includes('invalid')) {
        return new AppError(
            'Girdiğiniz bilgileri kontrol edin ve tekrar deneyin.',
            ErrorType.VALIDATION,
            error.message,
            false
        );
    }

    // Unknown errors
    return new AppError(
        'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.',
        ErrorType.UNKNOWN,
        error.message || 'Unknown error',
        true
    );
}

/**
 * Show error to user (can be extended with toast notifications)
 */
export function showError(error: AppError): void {
    // For now, just alert. In production, use a toast library
    const message = error.retryAfter
        ? `${error.userMessage}\n\n${error.retryAfter} saniye sonra tekrar deneyin.`
        : error.userMessage;

    alert(message);
}

/**
 * Log error for monitoring (can be extended with Sentry)
 */
export function logError(error: AppError, context?: any): void {
    console.error('[Error Log]', {
        type: error.type,
        userMessage: error.userMessage,
        technicalMessage: error.technicalMessage,
        retryable: error.retryable,
        retryAfter: error.retryAfter,
        context,
        timestamp: new Date().toISOString()
    });

    // TODO: Send to Sentry or other monitoring service
    // Sentry.captureException(error, { extra: context });
}
