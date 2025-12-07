-- Migration: Comprehensive Notification System
-- Created: 2025-12-07
-- Description: Adds push notification support, student preferences, and notification history

-- 1. Student Notification Preferences Table
CREATE TABLE IF NOT EXISTS public.student_notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    
    -- Notification Channels
    push_enabled BOOLEAN DEFAULT true,
    whatsapp_enabled BOOLEAN DEFAULT true,
    email_enabled BOOLEAN DEFAULT true,
    
    -- Notification Types
    notify_on_assignment BOOLEAN DEFAULT true,
    notify_on_test BOOLEAN DEFAULT true,
    notify_on_homework BOOLEAN DEFAULT true,
    notify_on_lesson BOOLEAN DEFAULT true,
    notify_on_achievement BOOLEAN DEFAULT true,
    
    -- Contact Information
    whatsapp_number TEXT,
    email TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(student_id)
);

-- 2. Push Notification Subscriptions Table
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Push Subscription Details (from browser Push API)
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    
    -- Device Information
    user_agent TEXT,
    device_type TEXT, -- 'mobile', 'tablet', 'desktop'
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, endpoint)
);

-- 3. Notification History Table (for tracking sent notifications)
CREATE TABLE IF NOT EXISTS public.notification_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    
    -- Notification Details
    type TEXT NOT NULL, -- 'assignment', 'test', 'homework', 'lesson', 'achievement'
    channel TEXT NOT NULL, -- 'push', 'whatsapp', 'email'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    
    -- Related Entity
    entity_type TEXT,
    entity_id UUID,
    
    -- Status
    status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'delivered', 'read'
    error_message TEXT,
    
    -- Timestamps
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_notification_preferences_student 
    ON public.student_notification_preferences(student_id);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user 
    ON public.push_subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active 
    ON public.push_subscriptions(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_notification_history_student 
    ON public.notification_history(student_id);

CREATE INDEX IF NOT EXISTS idx_notification_history_status 
    ON public.notification_history(status);

CREATE INDEX IF NOT EXISTS idx_notification_history_created 
    ON public.notification_history(created_at DESC);

-- 5. Add updated_at trigger for preferences
CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_notification_preferences_updated_at
    BEFORE UPDATE ON public.student_notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_preferences_updated_at();

-- 6. RLS Policies

-- Student Notification Preferences
ALTER TABLE public.student_notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own notification preferences"
    ON public.student_notification_preferences
    FOR SELECT
    USING (
        student_id IN (
            SELECT id FROM public.students WHERE id = auth.uid()
        )
    );

CREATE POLICY "Students can update their own notification preferences"
    ON public.student_notification_preferences
    FOR UPDATE
    USING (
        student_id IN (
            SELECT id FROM public.students WHERE id = auth.uid()
        )
    );

CREATE POLICY "Teachers can view their students' notification preferences"
    ON public.student_notification_preferences
    FOR SELECT
    USING (
        student_id IN (
            SELECT id FROM public.students WHERE tutor_id = auth.uid()
        )
    );

CREATE POLICY "System can insert notification preferences"
    ON public.student_notification_preferences
    FOR INSERT
    WITH CHECK (true);

-- Push Subscriptions
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own push subscriptions"
    ON public.push_subscriptions
    FOR ALL
    USING (user_id = auth.uid());

-- Notification History
ALTER TABLE public.notification_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own notification history"
    ON public.notification_history
    FOR SELECT
    USING (
        student_id IN (
            SELECT id FROM public.students WHERE id = auth.uid()
        )
    );

CREATE POLICY "Teachers can view their students' notification history"
    ON public.notification_history
    FOR SELECT
    USING (
        student_id IN (
            SELECT id FROM public.students WHERE tutor_id = auth.uid()
        )
    );

CREATE POLICY "System can insert notification history"
    ON public.notification_history
    FOR INSERT
    WITH CHECK (true);

-- 7. Function to create default preferences for new students
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.student_notification_preferences (
        student_id,
        whatsapp_number,
        email
    ) VALUES (
        NEW.id,
        NEW.contact,
        NEW.email
    )
    ON CONFLICT (student_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_default_notification_preferences
    AFTER INSERT ON public.students
    FOR EACH ROW
    EXECUTE FUNCTION create_default_notification_preferences();

-- 8. Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.student_notification_preferences TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;
GRANT SELECT, INSERT ON public.notification_history TO authenticated;

COMMENT ON TABLE public.student_notification_preferences IS 'Stores student notification channel preferences and settings';
COMMENT ON TABLE public.push_subscriptions IS 'Stores browser push notification subscriptions for PWA';
COMMENT ON TABLE public.notification_history IS 'Tracks all notifications sent to students across all channels';
