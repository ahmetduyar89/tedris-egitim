import { Notification } from '../types';
import { supabase } from './supabase';

export const createNotification = async (
    recipientId: string,
    message: string,
    entityType?: Notification['entityType'],
    entityId?: string
): Promise<void> => {
    try {
        const newNotification = {
            recipient_id: recipientId,
            message,
            read: false,
            timestamp: new Date().toISOString(),
            entity_type: entityType,
            entity_id: entityId
        };
        const { error } = await supabase
            .from('notifications')
            .insert([newNotification]);

        if (error) throw error;
    } catch (error) {
        console.error("Error creating notification:", error);
    }
};

export const getNotificationsForUser = async (recipientId: string): Promise<Notification[]> => {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('recipient_id', recipientId)
            .order('timestamp', { ascending: false });

        if (error) throw error;

        return (data || []).map(row => ({
            id: row.id,
            recipientId: row.recipient_id,
            message: row.message,
            read: row.read,
            timestamp: row.timestamp,
            entityType: row.entity_type,
            entityId: row.entity_id
        }));
    } catch (error) {
        console.error("Error getting notifications:", error);
        return [];
    }
};

export const markNotificationsAsRead = async (notificationIds: string[]): Promise<void> => {
    if (notificationIds.length === 0) return;
    try {
        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .in('id', notificationIds);

        if (error) throw error;
    } catch (error) {
        console.error("Error marking notifications as read:", error);
    }
};