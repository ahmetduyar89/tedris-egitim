import { useEffect } from 'react';
import { supabase } from '../services/supabase';
import { createNotification } from '../services/notificationService';

export const useRealtimeNotifications = (userId: string | undefined) => {
    useEffect(() => {
        if (!userId) return;

        console.log('Setting up realtime notifications for user:', userId);

        const channel = supabase
            .channel('public:notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `recipient_id=eq.${userId}`,
                },
                (payload) => {
                    console.log('New notification received:', payload);
                    // You can trigger a toast or update a global state here
                    // For now, we'll just log it and maybe dispatch a custom event
                    const event = new CustomEvent('new-notification', { detail: payload.new });
                    window.dispatchEvent(event);

                    // If you have a toast library, use it here. 
                    // Example: toast.info(payload.new.message);
                    alert(`Yeni Bildirim: ${payload.new.message}`);
                }
            )
            .subscribe((status) => {
                console.log('Notification subscription status:', status);
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId]);
};
