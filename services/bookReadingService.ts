import { supabase } from './dbAdapter';
import {
    Book,
    BookQuestion,
    BookAssignment,
    BookQuestionAnswer
} from '../types';

/**
 * Book Reading Service
 * Manages book library, assignments, questions, and student answers
 */

// ============================================================================
// BOOK MANAGEMENT
// ============================================================================

export const createBook = async (
    teacherId: string,
    title: string,
    author: string,
    pageCount: number,
    estimatedReadingDays: number,
    difficultyLevel: number = 3,
    summary?: string,
    coverImageUrl?: string
): Promise<Book> => {
    const { data, error } = await supabase
        .from('books')
        .insert({
            title,
            author,
            page_count: pageCount,
            estimated_reading_days: estimatedReadingDays,
            difficulty_level: difficultyLevel,
            summary,
            cover_image_url: coverImageUrl,
            created_by: teacherId
        })
        .select()
        .single();

    if (error) throw error;

    return mapBook(data);
};

export const getTeacherBooks = async (teacherId: string): Promise<Book[]> => {
    const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('created_by', teacherId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(mapBook);
};

export const deleteBook = async (bookId: string): Promise<void> => {
    const { error } = await supabase
        .from('books')
        .update({ is_active: false })
        .eq('id', bookId);

    if (error) throw error;
};

// ============================================================================
// BOOK QUESTIONS
// ============================================================================

export const createBookQuestion = async (
    bookId: string,
    questionText: string,
    questionType: 'open_ended' | 'multiple_choice' = 'open_ended',
    options?: string[],
    orderIndex?: number,
    isRequired: boolean = true
): Promise<BookQuestion> => {
    const { data, error } = await supabase
        .from('book_questions')
        .insert({
            book_id: bookId,
            question_text: questionText,
            question_type: questionType,
            options,
            order_index: orderIndex,
            is_required: isRequired
        })
        .select()
        .single();

    if (error) throw error;

    return mapBookQuestion(data);
};

export const getBookQuestions = async (bookId: string): Promise<BookQuestion[]> => {
    console.log('[getBookQuestions] Fetching questions for book ID:', bookId);

    const { data, error } = await supabase
        .from('book_questions')
        .select('*')
        .eq('book_id', bookId)
        .order('order_index', { ascending: true });

    console.log('[getBookQuestions] Query result:', { data, error });
    console.log('[getBookQuestions] Number of questions found:', data?.length || 0);

    if (error) {
        console.error('[getBookQuestions] Error fetching questions:', error);
        throw error;
    }

    const mappedQuestions = (data || []).map(mapBookQuestion);
    console.log('[getBookQuestions] Mapped questions:', mappedQuestions);

    return mappedQuestions;
};

export const updateBookQuestion = async (
    questionId: string,
    updates: {
        questionText?: string;
        questionType?: 'open_ended' | 'multiple_choice';
        options?: string[];
        orderIndex?: number;
        isRequired?: boolean;
    }
): Promise<void> => {
    const updateData: any = {};
    if (updates.questionText !== undefined) updateData.question_text = updates.questionText;
    if (updates.questionType !== undefined) updateData.question_type = updates.questionType;
    if (updates.options !== undefined) updateData.options = updates.options;
    if (updates.orderIndex !== undefined) updateData.order_index = updates.orderIndex;
    if (updates.isRequired !== undefined) updateData.is_required = updates.isRequired;

    const { error } = await supabase
        .from('book_questions')
        .update(updateData)
        .eq('id', questionId);

    if (error) throw error;
};

export const deleteBookQuestion = async (questionId: string): Promise<void> => {
    const { error } = await supabase
        .from('book_questions')
        .delete()
        .eq('id', questionId);

    if (error) throw error;
};

// ============================================================================
// BOOK ASSIGNMENTS
// ============================================================================

export const assignBookToStudent = async (
    bookId: string,
    studentId: string,
    teacherId: string,
    dueDate?: string
): Promise<BookAssignment> => {
    const { data, error } = await supabase
        .from('book_assignments')
        .insert({
            book_id: bookId,
            student_id: studentId,
            teacher_id: teacherId,
            due_date: dueDate,
            status: 'assigned'
        })
        .select(`
            *,
            books (*)
        `)
        .single();

    if (error) throw error;

    return mapBookAssignment(data);
};

export const getStudentBookAssignments = async (studentId: string): Promise<BookAssignment[]> => {
    const { data, error } = await supabase
        .from('book_assignments')
        .select(`
            *,
            books (*)
        `)
        .eq('student_id', studentId)
        .order('assigned_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(mapBookAssignment);
};

export const getTeacherBookAssignments = async (teacherId: string): Promise<BookAssignment[]> => {
    const { data, error } = await supabase
        .from('book_assignments')
        .select(`
            *,
            books (*)
        `)
        .eq('teacher_id', teacherId)
        .order('assigned_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(mapBookAssignment);
};

export const updateBookAssignmentStatus = async (
    assignmentId: string,
    status: 'assigned' | 'reading' | 'completed' | 'reviewed'
): Promise<void> => {
    const updateData: any = { status };

    if (status === 'reading' && !updateData.started_at) {
        updateData.started_at = new Date().toISOString();
    }

    if (status === 'completed' && !updateData.completed_at) {
        updateData.completed_at = new Date().toISOString();
    }

    const { error } = await supabase
        .from('book_assignments')
        .update(updateData)
        .eq('id', assignmentId);

    if (error) throw error;
};

export const updateBookAssignment = async (
    assignmentId: string,
    updates: {
        dueDate?: string;
        status?: 'assigned' | 'reading' | 'completed' | 'reviewed';
    }
): Promise<void> => {
    const updateData: any = {};
    if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate;
    if (updates.status !== undefined) updateData.status = updates.status;

    const { error } = await supabase
        .from('book_assignments')
        .update(updateData)
        .eq('id', assignmentId);

    if (error) throw error;
};

export const deleteBookAssignment = async (assignmentId: string): Promise<void> => {
    const { error } = await supabase
        .from('book_assignments')
        .delete()
        .eq('id', assignmentId);

    if (error) throw error;
};

export const submitTeacherReview = async (
    assignmentId: string,
    feedback: string,
    score: number
): Promise<void> => {
    const { error } = await supabase
        .from('book_assignments')
        .update({
            teacher_feedback: feedback,
            teacher_score: score,
            status: 'reviewed',
            reviewed_at: new Date().toISOString()
        })
        .eq('id', assignmentId);

    if (error) throw error;
};

// ============================================================================
// STUDENT ANSWERS
// ============================================================================

export const submitBookAnswers = async (
    assignmentId: string,
    answers: { [questionId: string]: string }
): Promise<void> => {
    // First, delete any existing answers for this assignment
    await supabase
        .from('book_question_answers')
        .delete()
        .eq('assignment_id', assignmentId);

    // Insert new answers
    const answersToInsert = Object.entries(answers)
        .filter(([_, answer]) => answer.trim() !== '')
        .map(([questionId, answerText]) => ({
            assignment_id: assignmentId,
            question_id: questionId,
            answer_text: answerText,
            submitted_at: new Date().toISOString()
        }));

    if (answersToInsert.length > 0) {
        const { error } = await supabase
            .from('book_question_answers')
            .insert(answersToInsert);

        if (error) throw error;
    }

    // Update assignment status to completed
    await updateBookAssignmentStatus(assignmentId, 'completed');
};

export const getStudentAnswers = async (assignmentId: string): Promise<BookQuestionAnswer[]> => {
    const { data, error } = await supabase
        .from('book_question_answers')
        .select(`
            *,
            book_questions (*)
        `)
        .eq('assignment_id', assignmentId)
        .order('submitted_at', { ascending: true });

    if (error) throw error;

    return (data || []).map(mapBookQuestionAnswer);
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const mapBook = (data: any): Book => ({
    id: data.id,
    title: data.title,
    author: data.author,
    pageCount: data.page_count,
    difficultyLevel: data.difficulty_level,
    estimatedReadingDays: data.estimated_reading_days,
    coverImageUrl: data.cover_image_url,
    summary: data.summary,
    createdAt: data.created_at,
    createdBy: data.created_by,
    isActive: data.is_active
});

const mapBookQuestion = (data: any): BookQuestion => ({
    id: data.id,
    bookId: data.book_id,
    questionText: data.question_text,
    questionType: data.question_type,
    options: data.options,
    orderIndex: data.order_index,
    isRequired: data.is_required,
    createdAt: data.created_at
});

const mapBookAssignment = (data: any): BookAssignment => ({
    id: data.id,
    bookId: data.book_id,
    studentId: data.student_id,
    teacherId: data.teacher_id,
    assignedAt: data.assigned_at,
    dueDate: data.due_date,
    status: data.status,
    startedAt: data.started_at,
    completedAt: data.completed_at,
    teacherFeedback: data.teacher_feedback,
    teacherScore: data.teacher_score,
    reviewedAt: data.reviewed_at,
    book: data.books ? mapBook(data.books) : undefined,
    questions: data.book_questions ? data.book_questions.map(mapBookQuestion) : undefined
});

const mapBookQuestionAnswer = (data: any): BookQuestionAnswer => ({
    id: data.id,
    assignmentId: data.assignment_id,
    questionId: data.question_id,
    answerText: data.answer_text,
    submittedAt: data.submitted_at,
    question: data.book_questions ? mapBookQuestion(data.book_questions) : undefined
});
