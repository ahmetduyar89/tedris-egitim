import { supabase } from './dbAdapter';
import { getTodaysDailyGoals, updateDailyGoalProgress } from './streakService';

/**
 * Activity Tracker Helper
 * Automatically updates daily goals based on student activities
 */

interface GoalProgressUpdate {
    goalType: string;
    progress: number;
}

/**
 * Map activity types to goal types and progress amounts
 */
function mapActivityToGoalProgress(activityType: string, activityDetails?: any): GoalProgressUpdate[] {
    const updates: GoalProgressUpdate[] = [];

    switch (activityType) {
        case 'test_completed':
            // Completing a test counts as solving multiple questions
            const questionCount = activityDetails?.questionCount || 5;
            updates.push({ goalType: 'solve_questions', progress: questionCount });

            // Also counts towards study time (assume 15 minutes per test)
            updates.push({ goalType: 'study_time', progress: 15 });
            break;

        case 'question_solved':
            updates.push({ goalType: 'solve_questions', progress: 1 });
            break;

        case 'video_watched':
            const duration = activityDetails?.duration || 5;
            updates.push({ goalType: 'study_time', progress: duration });
            break;

        case 'flashcard_reviewed':
            const cardCount = activityDetails?.cardCount || 1;
            updates.push({ goalType: 'review_flashcards', progress: cardCount });
            break;

        case 'assignment_submitted':
            // Homework submission counts as study time
            updates.push({ goalType: 'study_time', progress: 30 });
            updates.push({ goalType: 'solve_questions', progress: 3 });
            break;

        case 'study_session':
            const sessionDuration = activityDetails?.duration || 10;
            updates.push({ goalType: 'study_time', progress: sessionDuration });
            break;
    }

    return updates;
}

/**
 * Update daily goals based on an activity
 * This is called automatically after logging an activity
 */
export async function updateDailyGoalsFromActivity(
    studentId: string,
    activityType: string,
    activityDetails?: any
): Promise<void> {
    try {
        // Get today's goals
        const dailyGoals = await getTodaysDailyGoals(studentId);
        if (!dailyGoals) {
            console.log('⚠️ No daily goals found for today, skipping auto-update');
            return;
        }

        // Map activity to goal progress
        const progressUpdates = mapActivityToGoalProgress(activityType, activityDetails);

        if (progressUpdates.length === 0) {
            console.log(`ℹ️ Activity type "${activityType}" doesn't map to any daily goals`);
            return;
        }

        // Update each matching goal
        for (const update of progressUpdates) {
            // Find matching goal
            const matchingGoal = dailyGoals.goals.find(g =>
                g.type === update.goalType && !g.completed
            );

            if (matchingGoal) {
                console.log(`📈 Updating goal "${matchingGoal.description}" +${update.progress}`);
                await updateDailyGoalProgress(studentId, matchingGoal.id, update.progress);
            }
        }

        console.log('✅ Daily goals updated from activity');
    } catch (error) {
        console.error('❌ Error updating daily goals from activity:', error);
        // Don't throw - we don't want to break the main flow if goal update fails
    }
}

/**
 * Award XP to student
 * Integrates with existing XP system
 */
export async function awardActivityXP(studentId: string, xpAmount: number): Promise<void> {
    try {
        // Get current student data
        const { data: student, error: fetchError } = await supabase
            .from('students')
            .select('xp')
            .eq('id', studentId)
            .single();

        if (fetchError) throw fetchError;

        // Update XP
        const newXP = (student.xp || 0) + xpAmount;

        const { error: updateError } = await supabase
            .from('students')
            .update({ xp: newXP })
            .eq('id', studentId);

        if (updateError) throw updateError;

        console.log(`💎 Awarded ${xpAmount} XP to student (Total: ${newXP})`);
    } catch (error) {
        console.error('❌ Error awarding XP:', error);
        // Don't throw - XP is not critical
    }
}
