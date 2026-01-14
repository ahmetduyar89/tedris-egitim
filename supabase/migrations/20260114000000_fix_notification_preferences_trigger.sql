-- Migration: Fix student notification preferences trigger
-- Date: 2026-01-14
-- Description: Fixes "record new has no field email" error by fetching email from users table

CREATE OR REPLACE FUNCTION public.create_default_notification_preferences()
RETURNS TRIGGER AS $$
DECLARE
    student_email TEXT;
BEGIN
    -- Fetch email from users table as it's not present in students table
    SELECT email INTO student_email FROM public.users WHERE id = NEW.id;
    
    INSERT INTO public.student_notification_preferences (
        student_id,
        whatsapp_number,
        email
    ) VALUES (
        NEW.id,
        NEW.contact,
        student_email
    )
    ON CONFLICT (student_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
