import { supabase } from './dbAdapter';
import {
    TurkishContentLibraryItem,
    WeeklyTurkishGoals,
    FlashcardCategory
} from '../types';

/**
 * Turkish Learning Service
 * Manages vocabulary, idioms, proverbs, and weekly goals
 */

// ============================================================================
// CONTENT LIBRARY MANAGEMENT
// ============================================================================

export const createTurkishContent = async (
    teacherId: string,
    category: 'vocabulary' | 'idiom' | 'proverb',
    frontContent: string,
    backContent: string,
    exampleSentence?: string,
    difficultyLevel: number = 3,
    isAiGenerated: boolean = false
): Promise<TurkishContentLibraryItem> => {
    const { data, error } = await supabase
        .from('turkish_content_library')
        .insert({
            teacher_id: teacherId,
            category,
            front_content: frontContent,
            back_content: backContent,
            example_sentence: exampleSentence,
            difficulty_level: difficultyLevel,
            is_ai_generated: isAiGenerated
        })
        .select()
        .single();

    if (error) throw error;

    return {
        id: data.id,
        teacherId: data.teacher_id,
        category: data.category,
        frontContent: data.front_content,
        backContent: data.back_content,
        exampleSentence: data.example_sentence,
        difficultyLevel: data.difficulty_level,
        isAiGenerated: data.is_ai_generated,
        createdAt: data.created_at,
        isActive: data.is_active
    };
};

export const bulkCreateTurkishContent = async (
    teacherId: string,
    items: Array<{
        category: 'vocabulary' | 'idiom' | 'proverb';
        frontContent: string;
        backContent: string;
        exampleSentence?: string;
        difficultyLevel?: number;
    }>
): Promise<TurkishContentLibraryItem[]> => {
    const insertData = items.map(item => ({
        teacher_id: teacherId,
        category: item.category,
        front_content: item.frontContent,
        back_content: item.backContent,
        example_sentence: item.exampleSentence,
        difficulty_level: item.difficultyLevel || 3,
        is_ai_generated: false
    }));

    const { data, error } = await supabase
        .from('turkish_content_library')
        .insert(insertData)
        .select();

    if (error) throw error;

    return data.map(item => ({
        id: item.id,
        teacherId: item.teacher_id,
        category: item.category,
        frontContent: item.front_content,
        backContent: item.back_content,
        exampleSentence: item.example_sentence,
        difficultyLevel: item.difficulty_level,
        isAiGenerated: item.is_ai_generated,
        createdAt: item.created_at,
        isActive: item.is_active
    }));
};

export const getTeacherTurkishContent = async (
    teacherId: string,
    category?: 'vocabulary' | 'idiom' | 'proverb'
): Promise<TurkishContentLibraryItem[]> => {
    let query = supabase
        .from('turkish_content_library')
        .select('*')
        .eq('teacher_id', teacherId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

    if (category) {
        query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data.map(item => ({
        id: item.id,
        teacherId: item.teacher_id,
        category: item.category,
        frontContent: item.front_content,
        backContent: item.back_content,
        exampleSentence: item.example_sentence,
        difficultyLevel: item.difficulty_level,
        isAiGenerated: item.is_ai_generated,
        createdAt: item.created_at,
        isActive: item.is_active
    }));
};

export const updateTurkishContent = async (
    contentId: string,
    updates: {
        frontContent?: string;
        backContent?: string;
        exampleSentence?: string;
        difficultyLevel?: number;
    }
): Promise<void> => {
    const updateData: any = {};
    if (updates.frontContent !== undefined) updateData.front_content = updates.frontContent;
    if (updates.backContent !== undefined) updateData.back_content = updates.backContent;
    if (updates.exampleSentence !== undefined) updateData.example_sentence = updates.exampleSentence;
    if (updates.difficultyLevel !== undefined) updateData.difficulty_level = updates.difficultyLevel;

    const { error } = await supabase
        .from('turkish_content_library')
        .update(updateData)
        .eq('id', contentId);

    if (error) throw error;
};

export const deleteTurkishContent = async (contentId: string): Promise<void> => {
    const { error } = await supabase
        .from('turkish_content_library')
        .update({ is_active: false })
        .eq('id', contentId);

    if (error) throw error;
};

// ============================================================================
// WEEKLY CONTENT ASSIGNMENT
// ============================================================================

export const assignWeeklyContent = async (
    teacherId: string,
    studentId: string,
    weekStartDate: string,
    vocabularyIds: string[],
    idiomIds: string[],
    proverbIds: string[]
): Promise<void> => {
    const allContentIds = [...vocabularyIds, ...idiomIds, ...proverbIds];

    if (allContentIds.length === 0) {
        throw new Error('No content selected');
    }

    // Verify all content exists and belongs to teacher
    const { data: contentItems, error: fetchError } = await supabase
        .from('turkish_content_library')
        .select('*')
        .in('id', allContentIds)
        .eq('teacher_id', teacherId)
        .eq('is_active', true);

    if (fetchError) throw fetchError;

    if (!contentItems || contentItems.length !== allContentIds.length) {
        throw new Error('Some content items not found or not accessible');
    }

    // Create assignments for each content item
    const assignmentData = contentItems.map(item => ({
        teacher_id: teacherId,
        student_id: studentId,
        content_id: item.id,
        week_start_date: weekStartDate,
        is_learned: false,
        review_count: 0
    }));

    const { error: assignmentError } = await supabase
        .from('turkish_content_assignments')
        .insert(assignmentData);

    if (assignmentError) {
        // If error is due to duplicate, ignore it (content already assigned)
        if (!assignmentError.message?.includes('duplicate')) {
            throw assignmentError;
        }
    }

    // Also create flashcards for spaced repetition system
    const flashcardData = contentItems.map(item => ({
        teacher_id: teacherId,
        subject: 'Türkçe',
        grade: 8, // Default, can be customized
        topic: item.category,
        front_content: item.front_content,
        back_content: item.back_content,
        difficulty_level: item.difficulty_level,
        category: item.category,
        week_assigned: weekStartDate,
        is_ai_generated: item.is_ai_generated
    }));

    const { data: flashcards, error: flashcardError } = await supabase
        .from('flashcards')
        .insert(flashcardData)
        .select();

    if (flashcardError) throw flashcardError;

    // Create spaced repetition schedule for each flashcard
    const scheduleData = flashcards.map(flashcard => ({
        student_id: studentId,
        flashcard_id: flashcard.id,
        ease_factor: 2.5,
        interval_days: 1,
        repetition_count: 0,
        next_review_date: weekStartDate,
        mastery_level: 0
    }));

    const { error: scheduleError } = await supabase
        .from('spaced_repetition_schedule')
        .insert(scheduleData);

    if (scheduleError) throw scheduleError;

    // Create or update weekly goals
    await createOrUpdateWeeklyGoals(studentId, weekStartDate, {
        vocabularyTarget: vocabularyIds.length,
        idiomsTarget: idiomIds.length,
        proverbsTarget: proverbIds.length
    });
};

// ============================================================================
// WEEKLY GOALS MANAGEMENT
// ============================================================================

export const createOrUpdateWeeklyGoals = async (
    studentId: string,
    weekStartDate: string,
    goals?: {
        vocabularyTarget?: number;
        idiomsTarget?: number;
        proverbsTarget?: number;
        bookAssignmentId?: string;
    }
): Promise<WeeklyTurkishGoals> => {
    const { data: existing, error: fetchError } = await supabase
        .from('weekly_turkish_goals')
        .select('*')
        .eq('student_id', studentId)
        .eq('week_start_date', weekStartDate)
        .maybeSingle();

    if (fetchError) throw fetchError;

    if (existing) {
        // Update existing
        const updateData: any = {};
        if (goals?.vocabularyTarget !== undefined) updateData.vocabulary_target = goals.vocabularyTarget;
        if (goals?.idiomsTarget !== undefined) updateData.idioms_target = goals.idiomsTarget;
        if (goals?.proverbsTarget !== undefined) updateData.proverbs_target = goals.proverbsTarget;
        if (goals?.bookAssignmentId !== undefined) updateData.book_assignment_id = goals.bookAssignmentId;

        const { data, error } = await supabase
            .from('weekly_turkish_goals')
            .update(updateData)
            .eq('id', existing.id)
            .select()
            .single();

        if (error) throw error;
        return mapWeeklyGoals(data);
    } else {
        // Create new
        const { data, error } = await supabase
            .from('weekly_turkish_goals')
            .insert({
                student_id: studentId,
                week_start_date: weekStartDate,
                vocabulary_target: goals?.vocabularyTarget || 10,
                idioms_target: goals?.idiomsTarget || 10,
                proverbs_target: goals?.proverbsTarget || 10,
                book_assignment_id: goals?.bookAssignmentId
            })
            .select()
            .single();

        if (error) throw error;
        return mapWeeklyGoals(data);
    }
};

export const getWeeklyGoals = async (
    studentId: string,
    weekStartDate: string
): Promise<WeeklyTurkishGoals | null> => {
    const { data, error } = await supabase
        .from('weekly_turkish_goals')
        .select('*, book_assignments(*)')
        .eq('student_id', studentId)
        .eq('week_start_date', weekStartDate)
        .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return mapWeeklyGoals(data);
};

export const getCurrentWeekGoals = async (studentId: string): Promise<WeeklyTurkishGoals | null> => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
    const weekStartDate = weekStart.toISOString().split('T')[0];

    return getWeeklyGoals(studentId, weekStartDate);
};

export const updateGoalProgress = async (
    studentId: string,
    weekStartDate: string,
    category: 'vocabulary' | 'idiom' | 'proverb',
    increment: number = 1
): Promise<void> => {
    const goals = await getWeeklyGoals(studentId, weekStartDate);
    if (!goals) return;

    const updateData: any = {};
    if (category === 'vocabulary') {
        updateData.vocabulary_learned = Math.min(goals.vocabularyLearned + increment, goals.vocabularyTarget);
    } else if (category === 'idiom') {
        updateData.idioms_learned = Math.min(goals.idiomsLearned + increment, goals.idiomsTarget);
    } else if (category === 'proverb') {
        updateData.proverbs_learned = Math.min(goals.proverbsLearned + increment, goals.proverbsTarget);
    }

    const { error } = await supabase
        .from('weekly_turkish_goals')
        .update(updateData)
        .eq('id', goals.id);

    if (error) throw error;
};

// ============================================================================
// STUDENT CONTENT ASSIGNMENTS
// ============================================================================

/**
 * Get assigned Turkish content for a student for a specific week
 */
export const getStudentWeeklyContent = async (
    studentId: string,
    weekStartDate: string,
    category?: 'vocabulary' | 'idiom' | 'proverb'
): Promise<TurkishContentLibraryItem[]> => {
    let query = supabase
        .from('turkish_content_assignments')
        .select(`
            *,
            content:turkish_content_library(*)
        `)
        .eq('student_id', studentId)
        .eq('week_start_date', weekStartDate);

    if (category) {
        query = query.eq('turkish_content_library.category', category);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data.map((assignment: any) => ({
        id: assignment.content.id,
        teacherId: assignment.content.teacher_id,
        category: assignment.content.category,
        frontContent: assignment.content.front_content,
        backContent: assignment.content.back_content,
        exampleSentence: assignment.content.example_sentence,
        difficultyLevel: assignment.content.difficulty_level,
        isAiGenerated: assignment.content.is_ai_generated,
        createdAt: assignment.content.created_at,
        isActive: assignment.content.is_active,
        assignmentId: assignment.id,
        isLearned: assignment.is_learned,
        learnedAt: assignment.learned_at,
        reviewCount: assignment.review_count
    }));
};

/**
 * Get current week's assigned content for a student
 */
export const getCurrentWeekStudentContent = async (
    studentId: string,
    category?: 'vocabulary' | 'idiom' | 'proverb'
): Promise<TurkishContentLibraryItem[]> => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
    const weekStartDate = weekStart.toISOString().split('T')[0];

    return getStudentWeeklyContent(studentId, weekStartDate, category);
};

/**
 * Mark a content item as learned
 */
export const markContentAsLearned = async (
    assignmentId: string,
    isLearned: boolean = true
): Promise<void> => {
    const updateData: any = {
        is_learned: isLearned
    };

    if (isLearned) {
        updateData.learned_at = new Date().toISOString();
    } else {
        updateData.learned_at = null;
    }

    const { error } = await supabase
        .from('turkish_content_assignments')
        .update(updateData)
        .eq('id', assignmentId);

    if (error) throw error;
};

/**
 * Increment review count for a content item
 */
export const incrementReviewCount = async (
    assignmentId: string
): Promise<void> => {
    const { data: assignment, error: fetchError } = await supabase
        .from('turkish_content_assignments')
        .select('review_count')
        .eq('id', assignmentId)
        .single();

    if (fetchError) throw fetchError;

    const { error } = await supabase
        .from('turkish_content_assignments')
        .update({
            review_count: (assignment.review_count || 0) + 1,
            last_reviewed_at: new Date().toISOString()
        })
        .eq('id', assignmentId);

    if (error) throw error;
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const mapWeeklyGoals = (data: any): WeeklyTurkishGoals => ({
    id: data.id,
    studentId: data.student_id,
    weekStartDate: data.week_start_date,
    vocabularyTarget: data.vocabulary_target,
    vocabularyLearned: data.vocabulary_learned,
    idiomsTarget: data.idioms_target,
    idiomsLearned: data.idioms_learned,
    proverbsTarget: data.proverbs_target,
    proverbsLearned: data.proverbs_learned,
    bookAssignmentId: data.book_assignment_id,
    bookCompleted: data.book_completed,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    bookAssignment: data.book_assignments
});
