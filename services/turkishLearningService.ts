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

// ============================================================================
// NEW TURKISH CONTENT ASSIGNMENT SYSTEM (3-Stage Learning Flow)
// ============================================================================

import { TurkishContentAssignment, TurkishContentProgress } from '../types';

/**
 * Create a new Turkish content assignment with deadline
 */
export const createTurkishContentAssignment = async (
    teacherId: string,
    studentId: string,
    contentIds: string[],
    category: 'vocabulary' | 'idiom' | 'proverb',
    dueDate: string
): Promise<TurkishContentAssignment> => {
    const { data, error } = await supabase
        .from('turkish_content_assignments')
        .insert({
            teacher_id: teacherId,
            student_id: studentId,
            content_ids: contentIds,
            category,
            due_date: dueDate,
            learning_status: 'not_started',
            learned_content_ids: [],
            practice_attempts: 0
        })
        .select()
        .single();

    if (error) throw error;

    return {
        id: data.id,
        studentId: data.student_id,
        teacherId: data.teacher_id,
        contentIds: data.content_ids,
        category: data.category,
        assignedAt: data.assigned_at,
        dueDate: data.due_date,
        learningStatus: data.learning_status,
        learnedContentIds: data.learned_content_ids,
        practiceAttempts: data.practice_attempts,
        practiceScore: data.practice_score,
        practiceCompletedAt: data.practice_completed_at,
        masteredAt: data.mastered_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at
    };
};

/**
 * Get all assignments for a student
 */
export const getStudentTurkishAssignments = async (
    studentId: string
): Promise<TurkishContentAssignment[]> => {
    const { data, error } = await supabase
        .from('turkish_content_assignments')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map((item: any) => ({
        id: item.id,
        studentId: item.student_id,
        teacherId: item.teacher_id,
        contentIds: item.content_ids,
        category: item.category,
        assignedAt: item.assigned_at,
        dueDate: item.due_date,
        learningStatus: item.learning_status,
        learnedContentIds: item.learned_content_ids,
        practiceAttempts: item.practice_attempts,
        practiceScore: item.practice_score,
        practiceCompletedAt: item.practice_completed_at,
        masteredAt: item.mastered_at,
        createdAt: item.created_at,
        updatedAt: item.updated_at
    }));
};

/**
 * Mark content as learned in an assignment
 */
export const markAssignmentContentAsLearned = async (
    assignmentId: string,
    contentId: string
): Promise<void> => {
    // Get current assignment
    const { data: assignment, error: fetchError } = await supabase
        .from('turkish_content_assignments')
        .select('learned_content_ids, student_id')
        .eq('id', assignmentId)
        .single();

    if (fetchError) throw fetchError;

    const learnedIds = assignment.learned_content_ids || [];
    if (!learnedIds.includes(contentId)) {
        learnedIds.push(contentId);
    }

    // Update assignment
    const { error } = await supabase
        .from('turkish_content_assignments')
        .update({
            learned_content_ids: learnedIds,
            learning_status: 'learning'
        })
        .eq('id', assignmentId);

    if (error) throw error;

    // Create or update progress record
    const { error: progressError } = await supabase
        .from('turkish_content_progress')
        .upsert({
            assignment_id: assignmentId,
            student_id: assignment.student_id,
            content_id: contentId,
            marked_as_learned: true,
            learned_at: new Date().toISOString(),
            view_count: 1
        }, {
            onConflict: 'assignment_id,content_id'
        });

    if (progressError) throw progressError;
};

/**
 * Get assignment progress details
 */
export const getAssignmentProgress = async (
    assignmentId: string
): Promise<TurkishContentProgress[]> => {
    const { data, error } = await supabase
        .from('turkish_content_progress')
        .select('*')
        .eq('assignment_id', assignmentId);

    if (error) throw error;

    return data.map((item: any) => ({
        id: item.id,
        assignmentId: item.assignment_id,
        studentId: item.student_id,
        contentId: item.content_id,
        viewCount: item.view_count,
        markedAsLearned: item.marked_as_learned,
        learnedAt: item.learned_at,
        practiceAttempts: item.practice_attempts,
        correctCount: item.correct_count,
        incorrectCount: item.incorrect_count,
        lastPracticeAt: item.last_practice_at,
        createdAt: item.created_at,
        updatedAt: item.updated_at
    }));
};

/**
 * Submit a practice answer
 */
export const submitPracticeAnswer = async (
    assignmentId: string,
    studentId: string,
    contentId: string,
    isCorrect: boolean
): Promise<void> => {
    const { data: progress, error: fetchError } = await supabase
        .from('turkish_content_progress')
        .select('*')
        .eq('assignment_id', assignmentId)
        .eq('content_id', contentId)
        .maybeSingle();

    if (fetchError) throw fetchError;

    const updateData: any = {
        practice_attempts: (progress?.practice_attempts || 0) + 1,
        last_practice_at: new Date().toISOString()
    };

    if (isCorrect) {
        updateData.correct_count = (progress?.correct_count || 0) + 1;
    } else {
        updateData.incorrect_count = (progress?.incorrect_count || 0) + 1;
    }

    const { error } = await supabase
        .from('turkish_content_progress')
        .upsert({
            assignment_id: assignmentId,
            student_id: studentId,
            content_id: contentId,
            ...updateData
        }, {
            onConflict: 'assignment_id,content_id'
        });

    if (error) throw error;
};

/**
 * Complete practice session and update score
 */
export const completePracticeSession = async (
    assignmentId: string,
    score: number
): Promise<void> => {
    const { data: assignment, error: fetchError } = await supabase
        .from('turkish_content_assignments')
        .select('practice_attempts')
        .eq('id', assignmentId)
        .single();

    if (fetchError) throw fetchError;

    const { error } = await supabase
        .from('turkish_content_assignments')
        .update({
            learning_status: 'practicing',
            practice_attempts: (assignment.practice_attempts || 0) + 1,
            practice_score: score,
            practice_completed_at: new Date().toISOString()
        })
        .eq('id', assignmentId);

    if (error) throw error;
};

/**
 * Move successfully learned content to flashcard system
 */
export const moveToSpacedRepetition = async (
    assignmentId: string,
    studentId: string
): Promise<void> => {
    // Get assignment details
    const { data: assignment, error: assignmentError } = await supabase
        .from('turkish_content_assignments')
        .select('*, turkish_content_library(*)')
        .eq('id', assignmentId)
        .single();

    if (assignmentError) throw assignmentError;

    // Get content items
    const { data: contentItems, error: contentError } = await supabase
        .from('turkish_content_library')
        .select('*')
        .in('id', assignment.content_ids);

    if (contentError) throw contentError;

    // Create flashcards
    const flashcardData = contentItems.map((item: any) => ({
        teacher_id: assignment.teacher_id,
        subject: 'Türkçe',
        grade: 8, // Default
        topic: item.category,
        front_content: item.front_content,
        back_content: item.back_content,
        difficulty_level: item.difficulty_level,
        category: item.category,
        is_ai_generated: item.is_ai_generated
    }));

    const { data: flashcards, error: flashcardError } = await supabase
        .from('flashcards')
        .insert(flashcardData)
        .select();

    if (flashcardError) throw flashcardError;

    // Create spaced repetition schedules
    const scheduleData = flashcards.map((flashcard: any) => ({
        student_id: studentId,
        flashcard_id: flashcard.id,
        ease_factor: 2.5,
        interval_days: 1,
        repetition_count: 0,
        next_review_date: new Date().toISOString(),
        mastery_level: 0
    }));

    const { error: scheduleError } = await supabase
        .from('spaced_repetition_schedule')
        .insert(scheduleData);

    if (scheduleError) throw scheduleError;

    // Mark assignment as mastered
    const { error: updateError } = await supabase
        .from('turkish_content_assignments')
        .update({
            learning_status: 'mastered',
            mastered_at: new Date().toISOString()
        })
        .eq('id', assignmentId);

    if (updateError) throw updateError;
};

// ============================================================================
// ASSIGNMENT MANAGEMENT (Teacher Functions)
// ============================================================================

/**
 * Get all Turkish content assignments created by a teacher
 */
export const getTeacherAssignments = async (
    teacherId: string
): Promise<(TurkishContentAssignment & { studentName: string })[]> => {
    const { data, error } = await supabase
        .from('turkish_content_assignments')
        .select(`
            *,
            students (
                id,
                name
            )
        `)
        .eq('teacher_id', teacherId)
        .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map((item: any) => ({
        id: item.id,
        studentId: item.student_id,
        teacherId: item.teacher_id,
        contentIds: item.content_ids,
        category: item.category,
        assignedAt: item.assigned_at,
        dueDate: item.due_date,
        learningStatus: item.learning_status,
        learnedContentIds: item.learned_content_ids,
        practiceAttempts: item.practice_attempts,
        practiceScore: item.practice_score,
        practiceCompletedAt: item.practice_completed_at,
        masteredAt: item.mastered_at,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        studentName: item.students?.name || 'Unknown Student'
    }));
};

/**
 * Update a Turkish content assignment
 */
export const updateTurkishContentAssignment = async (
    assignmentId: string,
    updates: {
        contentIds?: string[];
        dueDate?: string;
    }
): Promise<void> => {
    const updateData: any = {};

    if (updates.contentIds !== undefined) {
        updateData.content_ids = updates.contentIds;
        // Reset learned content if content changes
        updateData.learned_content_ids = [];
        updateData.learning_status = 'not_started';
    }

    if (updates.dueDate !== undefined) {
        updateData.due_date = updates.dueDate;
    }

    updateData.updated_at = new Date().toISOString();

    const { error } = await supabase
        .from('turkish_content_assignments')
        .update(updateData)
        .eq('id', assignmentId);

    if (error) throw error;
};

/**
 * Delete a Turkish content assignment
 */
export const deleteTurkishContentAssignment = async (
    assignmentId: string
): Promise<void> => {
    // First delete related progress records
    const { error: progressError } = await supabase
        .from('turkish_content_progress')
        .delete()
        .eq('assignment_id', assignmentId);

    if (progressError) throw progressError;

    // Then delete the assignment
    const { error } = await supabase
        .from('turkish_content_assignments')
        .delete()
        .eq('id', assignmentId);

    if (error) throw error;
};

