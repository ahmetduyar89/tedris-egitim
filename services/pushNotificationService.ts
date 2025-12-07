import { supabase } from './supabase';

// VAPID keys - Public key from environment variable
// Generate keys with: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

export interface PushSubscriptionData {
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
}

/**
 * Check if push notifications are supported in the browser
 */
export const isPushNotificationSupported = (): boolean => {
    return 'serviceWorker' in navigator && 'PushManager' in window;
};

/**
 * Request permission for push notifications
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
    if (!isPushNotificationSupported()) {
        throw new Error('Push notifications are not supported in this browser');
    }

    const permission = await Notification.requestPermission();
    return permission;
};

/**
 * Register service worker for push notifications
 */
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration> => {
    if (!isPushNotificationSupported()) {
        throw new Error('Service workers are not supported');
    }

    try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);
        return registration;
    } catch (error) {
        console.error('Service Worker registration failed:', error);
        throw error;
    }
};

/**
 * Subscribe to push notifications
 */
export const subscribeToPushNotifications = async (): Promise<PushSubscriptionData | null> => {
    try {
        // Check permission
        const permission = await requestNotificationPermission();
        if (permission !== 'granted') {
            console.log('Push notification permission denied');
            return null;
        }

        // Register service worker
        const registration = await registerServiceWorker();

        // Subscribe to push notifications
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource
        });

        // Convert subscription to JSON
        const subscriptionJSON = subscription.toJSON();

        const subscriptionData: PushSubscriptionData = {
            endpoint: subscriptionJSON.endpoint!,
            keys: {
                p256dh: subscriptionJSON.keys!.p256dh!,
                auth: subscriptionJSON.keys!.auth!
            }
        };

        // Save subscription to database
        await savePushSubscription(subscriptionData);

        return subscriptionData;
    } catch (error) {
        console.error('Error subscribing to push notifications:', error);
        throw error;
    }
};

/**
 * Save push subscription to database
 */
const savePushSubscription = async (subscription: PushSubscriptionData): Promise<void> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        // Detect device type
        const userAgent = navigator.userAgent.toLowerCase();
        let deviceType = 'desktop';
        if (/mobile|android|iphone|ipad|ipod/.test(userAgent)) {
            deviceType = /ipad|tablet/.test(userAgent) ? 'tablet' : 'mobile';
        }

        const { error } = await supabase
            .from('push_subscriptions')
            .upsert({
                user_id: user.id,
                endpoint: subscription.endpoint,
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth,
                user_agent: navigator.userAgent,
                device_type: deviceType,
                is_active: true,
                last_used_at: new Date().toISOString()
            }, {
                onConflict: 'user_id,endpoint'
            });

        if (error) throw error;
        console.log('Push subscription saved to database');
    } catch (error) {
        console.error('Error saving push subscription:', error);
        throw error;
    }
};

/**
 * Unsubscribe from push notifications
 */
export const unsubscribeFromPushNotifications = async (): Promise<void> => {
    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
            await subscription.unsubscribe();

            // Remove from database
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase
                    .from('push_subscriptions')
                    .update({ is_active: false })
                    .eq('user_id', user.id)
                    .eq('endpoint', subscription.endpoint);
            }
        }
    } catch (error) {
        console.error('Error unsubscribing from push notifications:', error);
        throw error;
    }
};

/**
 * Check if user is subscribed to push notifications
 */
export const isPushSubscribed = async (): Promise<boolean> => {
    try {
        if (!isPushNotificationSupported()) return false;

        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        return subscription !== null;
    } catch (error) {
        console.error('Error checking push subscription:', error);
        return false;
    }
};

/**
 * Send a local notification (for testing)
 */
export const sendLocalNotification = async (title: string, options?: NotificationOptions): Promise<void> => {
    if (!isPushNotificationSupported()) {
        throw new Error('Notifications are not supported');
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, {
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png',
            ...options
        });
    }
};

/**
 * Helper function to convert VAPID key
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

/**
 * Get notification preferences for a student
 */
export const getNotificationPreferences = async (studentId: string) => {
    try {
        const { data, error } = await supabase
            .from('student_notification_preferences')
            .select('*')
            .eq('student_id', studentId)
            .single();

        if (error) {
            // If no preferences exist, return defaults
            if (error.code === 'PGRST116') {
                return {
                    push_enabled: true,
                    whatsapp_enabled: true,
                    email_enabled: true,
                    notify_on_assignment: true,
                    notify_on_test: true,
                    notify_on_homework: true,
                    notify_on_lesson: true,
                    notify_on_achievement: true
                };
            }
            throw error;
        }

        return data;
    } catch (error) {
        console.error('Error getting notification preferences:', error);
        return null;
    }
};

/**
 * Update notification preferences
 */
export const updateNotificationPreferences = async (
    studentId: string,
    preferences: Partial<{
        push_enabled: boolean;
        whatsapp_enabled: boolean;
        email_enabled: boolean;
        notify_on_assignment: boolean;
        notify_on_test: boolean;
        notify_on_homework: boolean;
        notify_on_lesson: boolean;
        notify_on_achievement: boolean;
        whatsapp_number: string;
        email: string;
    }>
) => {
    try {
        const { data, error } = await supabase
            .from('student_notification_preferences')
            .upsert({
                student_id: studentId,
                ...preferences,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'student_id'
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error updating notification preferences:', error);
        throw error;
    }
};
