// Supabase Edge Function to send push notifications
// Deploy with: supabase functions deploy send-push-notification

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface PushSubscription {
    endpoint: string;
    p256dh: string;
    auth: string;
}

interface PushPayload {
    subscriptions: PushSubscription[];
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    data?: any;
}

serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            status: 200,
            headers: corsHeaders,
        });
    }

    try {
        const { subscriptions, title, body, icon, badge, data }: PushPayload = await req.json();

        if (!subscriptions || subscriptions.length === 0) {
            return new Response(
                JSON.stringify({ error: 'No subscriptions provided' }),
                {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                }
            );
        }

        // VAPID keys from environment variables
        const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY');
        const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY');
        const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@tedris.com';

        if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
            return new Response(
                JSON.stringify({ error: 'VAPID keys not configured' }),
                {
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                }
            );
        }

        // Prepare notification payload
        const notificationPayload = JSON.stringify({
            title,
            body,
            icon: icon || '/icon-192x192.png',
            badge: badge || '/badge-72x72.png',
            vibrate: [200, 100, 200],
            data: data || {}
        });

        // Send to each subscription
        const results = await Promise.allSettled(
            subscriptions.map(async (subscription) => {
                try {
                    // Use web-push library (you'll need to import this)
                    // For now, we'll use fetch to send to the push service
                    const response = await fetch(subscription.endpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'TTL': '86400', // 24 hours
                            'Content-Encoding': 'aes128gcm',
                            'Authorization': `vapid t=${await generateVAPIDToken(
                                subscription.endpoint,
                                VAPID_SUBJECT,
                                VAPID_PUBLIC_KEY,
                                VAPID_PRIVATE_KEY
                            )}, k=${VAPID_PUBLIC_KEY}`
                        },
                        body: await encryptPayload(
                            notificationPayload,
                            subscription.p256dh,
                            subscription.auth
                        )
                    });

                    if (!response.ok) {
                        throw new Error(`Push service responded with ${response.status}`);
                    }

                    return { success: true, endpoint: subscription.endpoint };
                } catch (error) {
                    console.error('Error sending to subscription:', error);
                    return { success: false, endpoint: subscription.endpoint, error: error.message };
                }
            })
        );

        const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
        const failureCount = results.length - successCount;

        return new Response(
            JSON.stringify({
                success: true,
                sent: successCount,
                failed: failureCount,
                results: results.map(r => r.status === 'fulfilled' ? r.value : { success: false, error: 'Unknown error' })
            }),
            {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );

    } catch (error) {
        console.error('Error in send-push-notification:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );
    }
});

// Helper function to generate VAPID token
async function generateVAPIDToken(
    endpoint: string,
    subject: string,
    publicKey: string,
    privateKey: string
): Promise<string> {
    // This is a simplified version
    // In production, use a proper JWT library
    const header = {
        typ: 'JWT',
        alg: 'ES256'
    };

    const payload = {
        aud: new URL(endpoint).origin,
        exp: Math.floor(Date.now() / 1000) + 43200, // 12 hours
        sub: subject
    };

    // For production, implement proper JWT signing with ES256
    // For now, return a placeholder
    return 'VAPID_TOKEN_PLACEHOLDER';
}

// Helper function to encrypt payload
async function encryptPayload(
    payload: string,
    p256dh: string,
    auth: string
): Promise<ArrayBuffer> {
    // This is a placeholder
    // In production, implement proper AES128GCM encryption
    // You'll need to use Web Crypto API or a library like web-push

    const encoder = new TextEncoder();
    return encoder.encode(payload).buffer;
}

/* 
 * NOTE: This is a simplified implementation.
 * For production, you should use the web-push library:
 * 
 * import webpush from 'npm:web-push';
 * 
 * webpush.setVapidDetails(
 *   VAPID_SUBJECT,
 *   VAPID_PUBLIC_KEY,
 *   VAPID_PRIVATE_KEY
 * );
 * 
 * await webpush.sendNotification(
 *   {
 *     endpoint: subscription.endpoint,
 *     keys: {
 *       p256dh: subscription.p256dh,
 *       auth: subscription.auth
 *     }
 *   },
 *   notificationPayload
 * );
 */
