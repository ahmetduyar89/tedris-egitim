import { supabase } from './supabase';
import { sendLocalNotification, getNotificationPreferences } from './pushNotificationService';

export type NotificationType = 'assignment' | 'test' | 'homework' | 'lesson' | 'achievement' | 'general';
export type NotificationChannel = 'push' | 'whatsapp' | 'email' | 'in_app';

export interface NotificationPayload {
    studentId: string;
    type: NotificationType;
    title: string;
    message: string;
    entityType?: string;
    entityId?: string;
    actionUrl?: string;
    channels?: NotificationChannel[]; // If not specified, uses student preferences
}

/**
 * Main function to send notifications to students
 * Automatically handles multiple channels based on student preferences
 */
export const sendStudentNotification = async (payload: NotificationPayload): Promise<void> => {
    try {
        console.log('[Notification] Sending notification:', payload);

        // Get student preferences
        const preferences = await getNotificationPreferences(payload.studentId);
        if (!preferences) {
            console.warn('[Notification] No preferences found for student:', payload.studentId);
            return;
        }

        // Check if this notification type is enabled
        const typeKey = `notify_on_${payload.type}` as keyof typeof preferences;
        if (preferences[typeKey] === false) {
            console.log('[Notification] Notification type disabled for student:', payload.type);
            return;
        }

        // Determine which channels to use
        const channels = payload.channels || getEnabledChannels(preferences);

        // Send to each enabled channel
        const promises = channels.map(channel => {
            switch (channel) {
                case 'push':
                    return sendPushNotification(payload);
                case 'whatsapp':
                    return sendWhatsAppNotification(payload, preferences.whatsapp_number);
                case 'email':
                    return sendEmailNotification(payload, preferences.email);
                case 'in_app':
                    return sendInAppNotification(payload);
                default:
                    return Promise.resolve();
            }
        });

        await Promise.allSettled(promises);

        // Log to notification history
        await logNotificationHistory(payload, channels);

        console.log('[Notification] Notification sent successfully');
    } catch (error) {
        console.error('[Notification] Error sending notification:', error);
        throw error;
    }
};

/**
 * Send notification to parent
 */
export const sendParentNotification = async (payload: NotificationPayload): Promise<void> => {
    try {
        console.log('[Notification] Sending parent notification:', payload);

        // Get student's parent info
        const { data: student } = await supabase
            .from('students')
            .select('parent_phone, parent_name')
            .eq('id', payload.studentId)
            .single();

        if (!student?.parent_phone) {
            console.log('[Notification] No parent phone found for student:', payload.studentId);
            return;
        }

        // Send WhatsApp to parent
        // NOTE: We currently only support WhatsApp for parents as that's the primary communication channel
        await sendWhatsAppNotification(payload, student.parent_phone);

        console.log('[Notification] Parent notification sent successfully');

        // Log to history
        await logNotificationHistory({ ...payload, title: `[Veli] ${payload.title}` }, ['whatsapp']);

    } catch (error) {
        console.error('[Notification] Error sending parent notification:', error);
        // Don't throw, we don't want to break the flow if parent notification fails
    }
};

/**
 * Send push notification
 */
const sendPushNotification = async (payload: NotificationPayload): Promise<void> => {
    try {
        // Get student's user_id
        const { data: student } = await supabase
            .from('students')
            .select('user_id')
            .eq('id', payload.studentId)
            .single();

        if (!student?.user_id) {
            console.warn('[Push] Student user_id not found');
            return;
        }

        // Get active push subscriptions for this user
        const { data: subscriptions } = await supabase
            .from('push_subscriptions')
            .select('*')
            .eq('user_id', student.user_id)
            .eq('is_active', true);

        if (!subscriptions || subscriptions.length === 0) {
            console.log('[Push] No active subscriptions found');
            return;
        }

        // Send push notification via Edge Function
        const { error } = await supabase.functions.invoke('send-push-notification', {
            body: {
                subscriptions,
                title: payload.title,
                body: payload.message,
                icon: '/icon-192x192.png',
                badge: '/badge-72x72.png',
                data: {
                    type: payload.type,
                    entityType: payload.entityType,
                    entityId: payload.entityId,
                    actionUrl: payload.actionUrl
                }
            }
        });

        if (error) throw error;

        console.log('[Push] Push notification sent');
    } catch (error) {
        console.error('[Push] Error sending push notification:', error);
        throw error;
    }
};

/**
 * Send WhatsApp notification
 */
const sendWhatsAppNotification = async (
    payload: NotificationPayload,
    phoneNumber?: string
): Promise<void> => {
    try {
        if (!phoneNumber) {
            console.warn('[WhatsApp] No phone number provided');
            return;
        }

        // Format message for WhatsApp
        const whatsappMessage = formatWhatsAppMessage(payload);

        // Open WhatsApp with pre-filled message
        // Note: This will open WhatsApp but won't auto-send (WhatsApp API limitation)
        const cleanPhone = phoneNumber.replace(/\D/g, '');
        const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappMessage)}`;

        // For server-side sending, you would use WhatsApp Business API here
        // For now, we'll log the URL that would be used
        console.log('[WhatsApp] WhatsApp notification prepared:', whatsappUrl);

        // Store the notification for manual sending
        await supabase
            .from('notification_history')
            .insert({
                student_id: payload.studentId,
                type: payload.type,
                channel: 'whatsapp',
                title: payload.title,
                message: whatsappMessage,
                entity_type: payload.entityType,
                entity_id: payload.entityId,
                status: 'pending'
            });

    } catch (error) {
        console.error('[WhatsApp] Error preparing WhatsApp notification:', error);
        throw error;
    }
};

/**
 * Send email notification
 */
const sendEmailNotification = async (
    payload: NotificationPayload,
    email?: string
): Promise<void> => {
    try {
        if (!email) {
            console.warn('[Email] No email address provided');
            return;
        }

        // Send email via Edge Function
        const { error } = await supabase.functions.invoke('send-email-notification', {
            body: {
                to: email,
                subject: payload.title,
                html: formatEmailMessage(payload),
                type: payload.type
            }
        });

        if (error) throw error;

        console.log('[Email] Email notification sent');
    } catch (error) {
        console.error('[Email] Error sending email notification:', error);
        throw error;
    }
};

/**
 * Send in-app notification (existing system)
 */
const sendInAppNotification = async (payload: NotificationPayload): Promise<void> => {
    try {
        const { error } = await supabase
            .from('notifications')
            .insert({
                recipient_id: payload.studentId,
                message: payload.message,
                read: false,
                timestamp: new Date().toISOString(),
                entity_type: payload.entityType,
                entity_id: payload.entityId
            });

        if (error) throw error;

        console.log('[In-App] In-app notification created');
    } catch (error) {
        console.error('[In-App] Error creating in-app notification:', error);
        throw error;
    }
};

/**
 * Log notification to history
 */
const logNotificationHistory = async (
    payload: NotificationPayload,
    channels: NotificationChannel[]
): Promise<void> => {
    try {
        const records = channels.map(channel => ({
            student_id: payload.studentId,
            type: payload.type,
            channel,
            title: payload.title,
            message: payload.message,
            entity_type: payload.entityType,
            entity_id: payload.entityId,
            status: 'sent',
            sent_at: new Date().toISOString()
        }));

        await supabase
            .from('notification_history')
            .insert(records);

    } catch (error) {
        console.error('[History] Error logging notification history:', error);
    }
};

/**
 * Get enabled channels from preferences
 */
const getEnabledChannels = (preferences: any): NotificationChannel[] => {
    const channels: NotificationChannel[] = ['in_app']; // Always send in-app

    if (preferences.push_enabled) channels.push('push');
    if (preferences.whatsapp_enabled) channels.push('whatsapp');
    if (preferences.email_enabled) channels.push('email');

    return channels;
};

/**
 * Format WhatsApp message
 */
const formatWhatsAppMessage = (payload: NotificationPayload): string => {
    const emoji = getNotificationEmoji(payload.type);
    return `${emoji} *${payload.title}*\n\n${payload.message}\n\n_TedrisEDU Platform_`;
};

/**
 * Format email message
 */
const formatEmailMessage = (payload: NotificationPayload): string => {
    const emoji = getNotificationEmoji(payload.type);

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Inter', sans-serif; background-color: #F7F8FC; padding: 20px; }
                .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 10px rgba(0,0,0,0.08); }
                .header { text-align: center; margin-bottom: 30px; }
                .title { font-size: 24px; font-weight: 700; color: #111827; margin-bottom: 10px; }
                .message { font-size: 16px; color: #6B7280; line-height: 1.6; margin-bottom: 20px; }
                .button { display: inline-block; background: #2BB4A9; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; }
                .footer { text-align: center; margin-top: 30px; color: #9CA3AF; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div style="font-size: 48px; margin-bottom: 10px;">${emoji}</div>
                    <div class="title">${payload.title}</div>
                </div>
                <div class="message">${payload.message}</div>
                ${payload.actionUrl ? `<div style="text-align: center;"><a href="${payload.actionUrl}" class="button">Görüntüle</a></div>` : ''}
                <div class="footer">
                    <p>TedrisEDU Platform</p>
                    <p>Bu bir otomatik bildirimdir.</p>
                </div>
            </div>
        </body>
        </html>
    `;
};

/**
 * Get emoji for notification type
 */
const getNotificationEmoji = (type: NotificationType): string => {
    const emojis: Record<NotificationType, string> = {
        assignment: '📚',
        test: '📝',
        homework: '✏️',
        lesson: '👨‍🏫',
        achievement: '🏆',
        general: '📢'
    };
    return emojis[type] || '📢';
};

/**
 * Bulk send notifications to multiple students
 */
export const sendBulkNotifications = async (
    studentIds: string[],
    notification: Omit<NotificationPayload, 'studentId'>
): Promise<void> => {
    try {
        const promises = studentIds.map(studentId =>
            sendStudentNotification({ ...notification, studentId })
        );

        await Promise.allSettled(promises);
        console.log('[Notification] Bulk notifications sent');
    } catch (error) {
        console.error('[Notification] Error sending bulk notifications:', error);
        throw error;
    }
};

/**
 * Helper functions for common notification scenarios
 */

export const notifyAssignmentCreated = async (
    studentId: string,
    assignmentTitle: string,
    assignmentId: string,
    dueDate?: string
) => {
    const dueDateText = dueDate
        ? ` Teslim tarihi: ${new Date(dueDate).toLocaleDateString('tr-TR')}`
        : '';

    const payload: NotificationPayload = {
        studentId,
        type: 'assignment',
        title: 'Yeni Ödev Atandı',
        message: `"${assignmentTitle}" adlı ödev size atandı.${dueDateText}`,
        entityType: 'assignment',
        entityId: assignmentId,
        actionUrl: '/student-dashboard'
    };

    await sendStudentNotification(payload);
    await sendParentNotification(payload);
};

export const notifyTestAssigned = async (
    studentId: string,
    testTitle: string,
    testId: string,
    testType: 'diagnosis' | 'question_bank' | 'pdf' | 'test'
) => {
    const payload: NotificationPayload = {
        studentId,
        type: 'test',
        title: 'Yeni Test Atandı',
        message: `"${testTitle}" adlı test size atandı. Testi çözmek için giriş yapın.`,
        entityType: testType,
        entityId: testId,
        actionUrl: '/student-dashboard'
    };

    await sendStudentNotification(payload);
    await sendParentNotification(payload);
};

export const notifyHomeworkReminder = async (
    studentId: string,
    homeworkDetails: string
) => {
    const payload: NotificationPayload = {
        studentId,
        type: 'homework',
        title: 'Ödev Hatırlatması',
        message: homeworkDetails,
        actionUrl: '/student-dashboard'
    };

    await sendStudentNotification(payload);
    await sendParentNotification(payload);
};

export const notifyLessonScheduled = async (
    studentId: string,
    lessonDate: string,
    subject: string
) => {
    const dateStr = new Date(lessonDate).toLocaleString('tr-TR', {
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit'
    });

    const payload: NotificationPayload = {
        studentId,
        type: 'lesson',
        title: 'Ders Hatırlatması',
        message: `${subject} dersiniz ${dateStr} tarihinde başlayacak.`,
        actionUrl: '/student-dashboard'
    };

    await sendStudentNotification(payload);
    await sendParentNotification(payload);
};

export const notifyAchievementUnlocked = async (
    studentId: string,
    achievementTitle: string,
    achievementDescription: string
) => {
    await sendStudentNotification({
        studentId,
        type: 'achievement',
        title: '🎉 Yeni Başarı Kazandınız!',
        message: `${achievementTitle}: ${achievementDescription}`,
        actionUrl: '/student-dashboard'
    });
};
