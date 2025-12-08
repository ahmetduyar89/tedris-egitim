import { supabase } from './dbAdapter';
import {
    StudentStreak,
    StudentDailyGoals,
    StudentAchievement,
    StudentActivity,
    StreakUpdateResult,
    ActivityType,
    AchievementType
} from '../types';

/**
 * Streak Service
 * Handles student activity streaks, daily goals, and achievements
 */

// =====================================================
// STREAK MANAGEMENT
// =====================================================

/**
 * Get student's current streak
 */
export async function getStudentStreak(studentId: string): Promise<StudentStreak | null> {
    try {
        const { data, error } = await supabase
            .from('student_streaks')
            .select('*')
            .eq('student_id', studentId)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
        if (!data) return null;

        return {
            id: data.id,
            studentId: data.student_id,
            currentStreak: data.current_streak,
            longestStreak: data.longest_streak,
            lastActivityDate: data.last_activity_date,
            streakFreezeCount: data.streak_freeze_count,
            totalActivities: data.total_activities,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        };
    } catch (error) {
        console.error('Error fetching student streak:', error);
        throw error;
    }
}

/**
 * Update streak when student performs an activity
 * Uses database function for atomic updates
 */
export async function updateStreak(studentId: string): Promise<StreakUpdateResult> {
    try {
        const { data, error } = await supabase
            .rpc('update_student_streak', { p_student_id: studentId });

        if (error) throw error;

        const result = data[0];
        return {
            currentStreak: result.current_streak,
            longestStreak: result.longest_streak,
            streakBroken: result.streak_broken,
            milestoneReached: result.milestone_reached,
            milestoneValue: result.milestone_value
        };
    } catch (error) {
        console.error('Error updating streak:', error);
        throw error;
    }
}

/**
 * Log a student activity (triggers streak update)
 */
export async function logActivity(
    studentId: string,
    activityType: ActivityType,
    activityDetails?: any,
    xpEarned: number = 0
): Promise<{ activity: StudentActivity; streakResult: StreakUpdateResult }> {
    try {
        // Log the activity
        const { data: activityData, error: activityError } = await supabase
            .from('student_activities')
            .insert({
                student_id: studentId,
                activity_type: activityType,
                activity_details: activityDetails,
                xp_earned: xpEarned,
                activity_date: new Date().toISOString().split('T')[0]
            })
            .select()
            .single();

        if (activityError) throw activityError;

        // Update streak
        const streakResult = await updateStreak(studentId);

        // Check for achievements
        if (streakResult.milestoneReached && streakResult.milestoneValue) {
            await unlockStreakMilestone(studentId, streakResult.milestoneValue);
        }

        // Update daily goals automatically
        const { updateDailyGoalsFromActivity, awardActivityXP } = await import('./activityTracker');
        await updateDailyGoalsFromActivity(studentId, activityType, activityDetails);

        // Award XP
        if (xpEarned > 0) {
            await awardActivityXP(studentId, xpEarned);
        }

        const activity: StudentActivity = {
            id: activityData.id,
            studentId: activityData.student_id,
            activityDate: activityData.activity_date,
            activityType: activityData.activity_type,
            activityDetails: activityData.activity_details,
            xpEarned: activityData.xp_earned,
            createdAt: activityData.created_at
        };

        return { activity, streakResult };
    } catch (error) {
        console.error('Error logging activity:', error);
        throw error;
    }
}

// =====================================================
// DAILY GOALS
// =====================================================

/**
 * Get today's daily goals for a student
 */
export async function getTodaysDailyGoals(studentId: string): Promise<StudentDailyGoals | null> {
    try {
        const today = new Date().toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('daily_goals')
            .select('*')
            .eq('student_id', studentId)
            .eq('goal_date', today)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        if (!data) return null;

        return {
            id: data.id,
            studentId: data.student_id,
            goalDate: data.goal_date,
            goals: data.goals,
            totalGoals: data.total_goals,
            completedGoals: data.completed_goals,
            completionPercentage: data.completion_percentage,
            isFullyCompleted: data.is_fully_completed,
            completedAt: data.completed_at,
            xpReward: data.xp_reward,
            xpClaimed: data.xp_claimed,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        };
    } catch (error) {
        console.error('Error fetching daily goals:', error);
        throw error;
    }
}

/**
 * Generate daily goals for a student (if not exists for today)
 */
export async function generateDailyGoals(studentId: string): Promise<StudentDailyGoals> {
    try {
        // Check if goals already exist for today
        const existing = await getTodaysDailyGoals(studentId);
        if (existing) return existing;

        // Generate new goals using database function
        const { data, error } = await supabase
            .rpc('generate_daily_goals', {
                p_student_id: studentId,
                p_goal_date: new Date().toISOString().split('T')[0]
            });

        if (error) throw error;

        // Fetch the created goals
        const goals = await getTodaysDailyGoals(studentId);
        if (!goals) throw new Error('Failed to generate daily goals');

        return goals;
    } catch (error) {
        console.error('Error generating daily goals:', error);
        throw error;
    }
}

/**
 * Update progress on a daily goal
 */
export async function updateDailyGoalProgress(
    studentId: string,
    goalId: string,
    progress: number
): Promise<StudentDailyGoals> {
    try {
        const dailyGoals = await getTodaysDailyGoals(studentId);
        if (!dailyGoals) throw new Error('No daily goals found for today');

        // Update the specific goal
        const updatedGoals = dailyGoals.goals.map(goal => {
            if (goal.id === goalId) {
                const newCurrent = Math.min(goal.current + progress, goal.target);
                return {
                    ...goal,
                    current: newCurrent,
                    completed: newCurrent >= goal.target
                };
            }
            return goal;
        });

        // Calculate completion stats
        const completedCount = updatedGoals.filter(g => g.completed).length;
        const completionPercentage = Math.round((completedCount / updatedGoals.length) * 100);
        const isFullyCompleted = completedCount === updatedGoals.length;

        // Update in database
        const { data, error } = await supabase
            .from('daily_goals')
            .update({
                goals: updatedGoals,
                completed_goals: completedCount,
                completion_percentage: completionPercentage,
                is_fully_completed: isFullyCompleted,
                completed_at: isFullyCompleted ? new Date().toISOString() : null
            })
            .eq('id', dailyGoals.id)
            .select()
            .single();

        if (error) throw error;

        // If fully completed, award XP
        if (isFullyCompleted && !dailyGoals.xpClaimed) {
            await claimDailyGoalsReward(studentId, dailyGoals.id);
        }

        return {
            id: data.id,
            studentId: data.student_id,
            goalDate: data.goal_date,
            goals: data.goals,
            totalGoals: data.total_goals,
            completedGoals: data.completed_goals,
            completionPercentage: data.completion_percentage,
            isFullyCompleted: data.is_fully_completed,
            completedAt: data.completed_at,
            xpReward: data.xp_reward,
            xpClaimed: data.xp_claimed,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        };
    } catch (error) {
        console.error('Error updating daily goal progress:', error);
        throw error;
    }
}

/**
 * Claim XP reward for completing daily goals
 */
async function claimDailyGoalsReward(studentId: string, dailyGoalsId: string): Promise<void> {
    try {
        console.log('🎁 Claiming daily goals reward for student:', studentId);

        // Mark as claimed
        await supabase
            .from('daily_goals')
            .update({ xp_claimed: true })
            .eq('id', dailyGoalsId);

        // Log activity
        await logActivity(studentId, 'goal_completed', { dailyGoalsId }, 50);

        console.log('✅ Daily goals reward claimed successfully! +50 XP awarded');
    } catch (error) {
        console.error('❌ Error claiming daily goals reward:', error);
        throw error;
    }
}

// =====================================================
// ACHIEVEMENTS
// =====================================================

/**
 * Get all achievements for a student
 */
export async function getStudentAchievements(
    studentId: string,
    unviewedOnly: boolean = false
): Promise<StudentAchievement[]> {
    try {
        let query = supabase
            .from('student_achievements')
            .select('*')
            .eq('student_id', studentId)
            .order('unlocked_at', { ascending: false });

        if (unviewedOnly) {
            query = query.eq('is_viewed', false);
        }

        const { data, error } = await query;
        if (error) throw error;

        return (data || []).map(a => ({
            id: a.id,
            studentId: a.student_id,
            achievementType: a.achievement_type,
            achievementName: a.achievement_name,
            description: a.description,
            iconEmoji: a.icon_emoji,
            milestoneValue: a.milestone_value,
            xpReward: a.xp_reward,
            badgeUnlocked: a.badge_unlocked,
            specialReward: a.special_reward,
            unlockedAt: a.unlocked_at,
            isViewed: a.is_viewed,
            viewedAt: a.viewed_at,
            createdAt: a.created_at
        }));
    } catch (error) {
        console.error('Error fetching achievements:', error);
        throw error;
    }
}

/**
 * Unlock a streak milestone achievement
 */
async function unlockStreakMilestone(studentId: string, streakDays: number): Promise<void> {
    try {
        const milestoneNames: Record<number, string> = {
            7: '7 Gün Şampiyonu',
            14: '2 Hafta Ustası',
            30: 'Aylık Kahraman',
            60: '2 Ay Efsanesi',
            100: '100 Gün Fenomeni',
            365: 'Yılın Yıldızı'
        };

        const xpRewards: Record<number, number> = {
            7: 100,
            14: 200,
            30: 500,
            60: 1000,
            100: 2000,
            365: 10000
        };

        const name = milestoneNames[streakDays] || `${streakDays} Gün Streak`;
        const xpReward = xpRewards[streakDays] || streakDays * 10;

        await supabase
            .from('student_achievements')
            .insert({
                student_id: studentId,
                achievement_type: 'streak_milestone',
                achievement_name: name,
                description: `${streakDays} gün üst üste çalıştın! 🔥`,
                icon_emoji: '🔥',
                milestone_value: streakDays,
                xp_reward: xpReward,
                badge_unlocked: `streak_${streakDays}`
            });
    } catch (error) {
        // Ignore duplicate errors (achievement already unlocked)
        if (error.code !== '23505') {
            console.error('Error unlocking streak milestone:', error);
        }
    }
}

/**
 * Mark achievement as viewed
 */
export async function markAchievementAsViewed(achievementId: string): Promise<void> {
    try {
        await supabase
            .from('student_achievements')
            .update({
                is_viewed: true,
                viewed_at: new Date().toISOString()
            })
            .eq('id', achievementId);
    } catch (error) {
        console.error('Error marking achievement as viewed:', error);
        throw error;
    }
}

/**
 * Get streak statistics for leaderboard
 */
export async function getStreakLeaderboard(limit: number = 10): Promise<Array<{
    studentId: string;
    studentName: string;
    currentStreak: number;
    longestStreak: number;
}>> {
    try {
        const { data, error } = await supabase
            .from('student_streaks')
            .select(`
        student_id,
        current_streak,
        longest_streak,
        students!inner(name)
      `)
            .order('current_streak', { ascending: false })
            .limit(limit);

        if (error) throw error;

        return (data || []).map((item: any) => ({
            studentId: item.student_id,
            studentName: item.students?.name || 'Unknown',
            currentStreak: item.current_streak,
            longestStreak: item.longest_streak
        }));
    } catch (error) {
        console.error('Error fetching streak leaderboard:', error);
        return [];
    }
}
