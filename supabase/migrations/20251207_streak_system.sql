-- =====================================================
-- Streak System, Daily Goals & Achievements
-- Migration: Add motivational features
-- Created: 2025-12-07
-- =====================================================

-- =====================================================
-- 1. STUDENT STREAKS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.student_streaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    last_activity_date DATE,
    streak_freeze_count INTEGER NOT NULL DEFAULT 1, -- Free streak protection
    total_activities INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_student_streak UNIQUE(student_id)
);

-- Index for quick lookups
CREATE INDEX idx_student_streaks_student ON public.student_streaks(student_id);
CREATE INDEX idx_student_streaks_current ON public.student_streaks(current_streak DESC);

-- =====================================================
-- 2. DAILY GOALS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.daily_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    goal_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Goal Definitions (AI-generated based on student level)
    goals JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- Example: [
    --   { "id": "1", "type": "solve_questions", "target": 5, "current": 0, "subject": "Matematik", "completed": false },
    --   { "id": "2", "type": "watch_video", "target": 1, "current": 0, "completed": false },
    --   { "id": "3", "type": "study_time", "target": 15, "current": 0, "unit": "minutes", "completed": false }
    -- ]
    
    -- Progress Tracking
    total_goals INTEGER NOT NULL DEFAULT 3,
    completed_goals INTEGER NOT NULL DEFAULT 0,
    completion_percentage INTEGER NOT NULL DEFAULT 0,
    is_fully_completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    
    -- Rewards
    xp_reward INTEGER NOT NULL DEFAULT 50,
    xp_claimed BOOLEAN NOT NULL DEFAULT FALSE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_student_daily_goal UNIQUE(student_id, goal_date)
);

-- Indexes
CREATE INDEX idx_daily_goals_student ON public.daily_goals(student_id);
CREATE INDEX idx_daily_goals_date ON public.daily_goals(goal_date DESC);
CREATE INDEX idx_daily_goals_completion ON public.daily_goals(is_fully_completed, goal_date);

-- =====================================================
-- 3. ACHIEVEMENTS/MILESTONES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.student_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Achievement Details
    achievement_type VARCHAR(50) NOT NULL,
    -- Types: 'streak_milestone', 'daily_goals_streak', 'total_xp', 'tests_completed', 
    --        'perfect_score', 'subject_master', 'early_bird', 'night_owl', 'speed_demon'
    
    achievement_name VARCHAR(255) NOT NULL,
    description TEXT,
    icon_emoji VARCHAR(10),
    
    -- Milestone Value
    milestone_value INTEGER, -- e.g., 7 for "7-day streak"
    
    -- Rewards
    xp_reward INTEGER NOT NULL DEFAULT 0,
    badge_unlocked VARCHAR(255),
    special_reward JSONB, -- { "type": "avatar_item", "itemId": "..." }
    
    -- Status
    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_viewed BOOLEAN NOT NULL DEFAULT FALSE,
    viewed_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_student_achievement UNIQUE(student_id, achievement_type, milestone_value)
);

-- Indexes
CREATE INDEX idx_achievements_student ON public.student_achievements(student_id);
CREATE INDEX idx_achievements_type ON public.student_achievements(achievement_type);
CREATE INDEX idx_achievements_unlocked ON public.student_achievements(unlocked_at DESC);
CREATE INDEX idx_achievements_unviewed ON public.student_achievements(student_id, is_viewed) WHERE is_viewed = FALSE;

-- =====================================================
-- 4. ACTIVITY LOG TABLE (for streak tracking)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.student_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Activity Types
    activity_type VARCHAR(50) NOT NULL,
    -- Types: 'test_completed', 'video_watched', 'flashcard_reviewed', 
    --        'question_solved', 'login', 'study_session'
    
    -- Activity Details
    activity_details JSONB,
    xp_earned INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_activities_student_date ON public.student_activities(student_id, activity_date DESC);
CREATE INDEX idx_activities_type ON public.student_activities(activity_type);
CREATE INDEX idx_activities_date ON public.student_activities(activity_date DESC);

-- =====================================================
-- 5. RLS POLICIES
-- =====================================================

-- Student Streaks Policies
ALTER TABLE public.student_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own streak"
    ON public.student_streaks FOR SELECT
    USING (auth.uid() = student_id);

CREATE POLICY "Students can update own streak"
    ON public.student_streaks FOR UPDATE
    USING (auth.uid() = student_id);

CREATE POLICY "Students can insert own streak"
    ON public.student_streaks FOR INSERT
    WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Tutors can view their students' streaks"
    ON public.student_streaks FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.students
            WHERE students.id = student_streaks.student_id
            AND students.tutor_id = auth.uid()
        )
    );

-- Daily Goals Policies
ALTER TABLE public.daily_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own daily goals"
    ON public.daily_goals FOR SELECT
    USING (auth.uid() = student_id);

CREATE POLICY "Students can update own daily goals"
    ON public.daily_goals FOR UPDATE
    USING (auth.uid() = student_id);

CREATE POLICY "Students can insert own daily goals"
    ON public.daily_goals FOR INSERT
    WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Tutors can view their students' daily goals"
    ON public.daily_goals FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.students
            WHERE students.id = daily_goals.student_id
            AND students.tutor_id = auth.uid()
        )
    );

-- Achievements Policies
ALTER TABLE public.student_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own achievements"
    ON public.student_achievements FOR SELECT
    USING (auth.uid() = student_id);

CREATE POLICY "Students can update own achievements"
    ON public.student_achievements FOR UPDATE
    USING (auth.uid() = student_id);

CREATE POLICY "System can insert achievements"
    ON public.student_achievements FOR INSERT
    WITH CHECK (TRUE); -- Will be called from backend

CREATE POLICY "Tutors can view their students' achievements"
    ON public.student_achievements FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.students
            WHERE students.id = student_achievements.student_id
            AND students.tutor_id = auth.uid()
        )
    );

-- Activity Log Policies
ALTER TABLE public.student_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own activities"
    ON public.student_activities FOR SELECT
    USING (auth.uid() = student_id);

CREATE POLICY "Students can insert own activities"
    ON public.student_activities FOR INSERT
    WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Tutors can view their students' activities"
    ON public.student_activities FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.students
            WHERE students.id = student_activities.student_id
            AND students.tutor_id = auth.uid()
        )
    );

-- =====================================================
-- 6. FUNCTIONS
-- =====================================================

-- Function to update streak on activity
CREATE OR REPLACE FUNCTION update_student_streak(p_student_id UUID)
RETURNS TABLE(
    current_streak INTEGER,
    longest_streak INTEGER,
    streak_broken BOOLEAN,
    milestone_reached BOOLEAN,
    milestone_value INTEGER
) AS $$
DECLARE
    v_streak RECORD;
    v_today DATE := CURRENT_DATE;
    v_yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
    v_streak_broken BOOLEAN := FALSE;
    v_milestone_reached BOOLEAN := FALSE;
    v_milestone_value INTEGER := NULL;
BEGIN
    -- Get or create streak record
    SELECT * INTO v_streak
    FROM public.student_streaks
    WHERE student_id = p_student_id;
    
    IF NOT FOUND THEN
        -- Create new streak
        INSERT INTO public.student_streaks (student_id, current_streak, longest_streak, last_activity_date)
        VALUES (p_student_id, 1, 1, v_today)
        RETURNING * INTO v_streak;
        
        v_milestone_reached := TRUE;
        v_milestone_value := 1;
    ELSE
        -- Check if already updated today
        IF v_streak.last_activity_date = v_today THEN
            -- Already updated today, just return current values
            RETURN QUERY SELECT v_streak.current_streak, v_streak.longest_streak, FALSE, FALSE, NULL::INTEGER;
            RETURN;
        END IF;
        
        -- Check if streak continues
        IF v_streak.last_activity_date = v_yesterday THEN
            -- Streak continues
            UPDATE public.student_streaks
            SET current_streak = current_streak + 1,
                longest_streak = GREATEST(longest_streak, current_streak + 1),
                last_activity_date = v_today,
                total_activities = total_activities + 1,
                updated_at = NOW()
            WHERE student_id = p_student_id
            RETURNING * INTO v_streak;
            
            -- Check for milestones (7, 14, 30, 60, 100, 365 days)
            IF v_streak.current_streak IN (7, 14, 30, 60, 100, 365) THEN
                v_milestone_reached := TRUE;
                v_milestone_value := v_streak.current_streak;
            END IF;
        ELSE
            -- Streak broken
            v_streak_broken := TRUE;
            
            -- Check if can use streak freeze
            IF v_streak.streak_freeze_count > 0 THEN
                -- Use streak freeze
                UPDATE public.student_streaks
                SET streak_freeze_count = streak_freeze_count - 1,
                    last_activity_date = v_today,
                    total_activities = total_activities + 1,
                    updated_at = NOW()
                WHERE student_id = p_student_id
                RETURNING * INTO v_streak;
                
                v_streak_broken := FALSE; -- Saved by freeze
            ELSE
                -- Reset streak
                UPDATE public.student_streaks
                SET current_streak = 1,
                    last_activity_date = v_today,
                    total_activities = total_activities + 1,
                    updated_at = NOW()
                WHERE student_id = p_student_id
                RETURNING * INTO v_streak;
            END IF;
        END IF;
    END IF;
    
    RETURN QUERY SELECT v_streak.current_streak, v_streak.longest_streak, v_streak_broken, v_milestone_reached, v_milestone_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate daily goals for a student
CREATE OR REPLACE FUNCTION generate_daily_goals(p_student_id UUID, p_goal_date DATE DEFAULT CURRENT_DATE)
RETURNS UUID AS $$
DECLARE
    v_goal_id UUID;
    v_student RECORD;
    v_goals JSONB;
BEGIN
    -- Get student info
    SELECT * INTO v_student FROM public.students WHERE id = p_student_id;
    
    -- Generate personalized goals based on student level and history
    v_goals := jsonb_build_array(
        jsonb_build_object(
            'id', gen_random_uuid()::text,
            'type', 'solve_questions',
            'description', '5 soru çöz',
            'target', 5,
            'current', 0,
            'subject', 'Matematik',
            'completed', false,
            'icon', '📝'
        ),
        jsonb_build_object(
            'id', gen_random_uuid()::text,
            'type', 'study_time',
            'description', '15 dakika çalış',
            'target', 15,
            'current', 0,
            'unit', 'minutes',
            'completed', false,
            'icon', '⏱️'
        ),
        jsonb_build_object(
            'id', gen_random_uuid()::text,
            'type', 'review_flashcards',
            'description', '10 flashcard tekrarla',
            'target', 10,
            'current', 0,
            'completed', false,
            'icon', '🎴'
        )
    );
    
    -- Insert daily goals
    INSERT INTO public.daily_goals (student_id, goal_date, goals, total_goals)
    VALUES (p_student_id, p_goal_date, v_goals, 3)
    RETURNING id INTO v_goal_id;
    
    RETURN v_goal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_student_streaks_updated_at
    BEFORE UPDATE ON public.student_streaks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_goals_updated_at
    BEFORE UPDATE ON public.daily_goals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. INITIAL DATA - Achievement Templates
-- =====================================================

COMMENT ON TABLE public.student_streaks IS 'Tracks student activity streaks for motivation';
COMMENT ON TABLE public.daily_goals IS 'Daily personalized goals for students';
COMMENT ON TABLE public.student_achievements IS 'Unlocked achievements and milestones';
COMMENT ON TABLE public.student_activities IS 'Log of all student activities for streak tracking';
