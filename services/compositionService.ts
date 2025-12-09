import { supabase } from './dbAdapter';
import { Composition, CompositionAssignment, AICompositionFeedback } from '../types';

// ============================================================================
// COMPOSITION CRUD OPERATIONS
// ============================================================================

/**
 * Create a new composition topic
 */
export async function createComposition(
    composition: Omit<Composition, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Composition> {
    const { data, error } = await supabase
        .from('compositions')
        .insert({
            teacher_id: composition.teacherId,
            title: composition.title,
            description: composition.description,
            prompt: composition.prompt,
            guidelines: composition.guidelines,
            min_word_count: composition.minWordCount,
            max_word_count: composition.maxWordCount,
            difficulty_level: composition.difficultyLevel,
            grade_level: composition.gradeLevel,
            category: composition.category,
            rubric: composition.rubric,
            is_active: composition.isActive
        })
        .select()
        .single();

    if (error) throw error;
    return mapCompositionFromDB(data);
}

/**
 * Get all compositions for a teacher
 */
export async function getTeacherCompositions(teacherId: string): Promise<Composition[]> {
    const { data, error } = await supabase
        .from('compositions')
        .select('*')
        .eq('teacher_id', teacherId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(mapCompositionFromDB);
}

/**
 * Update a composition
 */
export async function updateComposition(
    id: string,
    updates: Partial<Composition>
): Promise<Composition> {
    const updateData: any = {};

    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.prompt !== undefined) updateData.prompt = updates.prompt;
    if (updates.guidelines !== undefined) updateData.guidelines = updates.guidelines;
    if (updates.minWordCount !== undefined) updateData.min_word_count = updates.minWordCount;
    if (updates.maxWordCount !== undefined) updateData.max_word_count = updates.maxWordCount;
    if (updates.difficultyLevel !== undefined) updateData.difficulty_level = updates.difficultyLevel;
    if (updates.gradeLevel !== undefined) updateData.grade_level = updates.gradeLevel;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.rubric !== undefined) updateData.rubric = updates.rubric;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

    const { data, error } = await supabase
        .from('compositions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return mapCompositionFromDB(data);
}

/**
 * Delete a composition (soft delete by setting is_active to false)
 */
export async function deleteComposition(id: string): Promise<void> {
    const { error } = await supabase
        .from('compositions')
        .update({ is_active: false })
        .eq('id', id);

    if (error) throw error;
}

// ============================================================================
// ASSIGNMENT OPERATIONS
// ============================================================================

/**
 * Assign a composition to multiple students
 * Skips students who already have this composition assigned
 */
export async function assignComposition(
    compositionId: string,
    studentIds: string[],
    teacherId: string,
    dueDate?: string,
    isMandatory: boolean = true
): Promise<{ assigned: number; skipped: number }> {
    // Check for existing assignments
    const { data: existingAssignments } = await supabase
        .from('composition_assignments')
        .select('student_id')
        .eq('composition_id', compositionId)
        .in('student_id', studentIds);

    const existingStudentIds = new Set(
        existingAssignments?.map(a => a.student_id) || []
    );

    // Filter out students who already have this assignment
    const newStudentIds = studentIds.filter(id => !existingStudentIds.has(id));

    if (newStudentIds.length === 0) {
        return { assigned: 0, skipped: studentIds.length };
    }

    const assignments = newStudentIds.map(studentId => ({
        composition_id: compositionId,
        student_id: studentId,
        teacher_id: teacherId,
        due_date: dueDate,
        is_mandatory: isMandatory,
        status: 'assigned'
    }));

    const { error } = await supabase
        .from('composition_assignments')
        .insert(assignments);

    if (error) throw error;

    return {
        assigned: newStudentIds.length,
        skipped: existingStudentIds.size
    };
}

/**
 * Get all composition assignments for a student
 */
export async function getStudentAssignments(studentId: string): Promise<CompositionAssignment[]> {
    const { data, error } = await supabase
        .from('composition_assignments')
        .select(`
      *,
      composition:compositions(*)
    `)
        .eq('student_id', studentId)
        .order('assigned_at', { ascending: false });

    if (error) throw error;
    return data.map(mapAssignmentFromDB);
}

/**
 * Get all composition assignments for a teacher
 */
export async function getTeacherAssignments(teacherId: string): Promise<CompositionAssignment[]> {
    const { data, error } = await supabase
        .from('composition_assignments')
        .select(`
      *,
      composition:compositions(*)
    `)
        .eq('teacher_id', teacherId)
        .order('assigned_at', { ascending: false });

    if (error) throw error;
    return data.map(mapAssignmentFromDB);
}

/**
 * Get a specific assignment by ID
 */
export async function getAssignmentById(assignmentId: string): Promise<CompositionAssignment | null> {
    const { data, error } = await supabase
        .from('composition_assignments')
        .select(`
      *,
      composition:compositions(*)
    `)
        .eq('id', assignmentId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
    }
    return mapAssignmentFromDB(data);
}

// ============================================================================
// SUBMISSION OPERATIONS
// ============================================================================

/**
 * Save a draft (auto-save)
 */
export async function saveDraft(assignmentId: string, text: string): Promise<void> {
    const updateData: any = {
        student_text: text,
        status: 'draft'
    };

    // Set started_at if not already set
    const { data: existing } = await supabase
        .from('composition_assignments')
        .select('started_at')
        .eq('id', assignmentId)
        .single();

    if (existing && !existing.started_at) {
        updateData.started_at = new Date().toISOString();
    }

    const { error } = await supabase
        .from('composition_assignments')
        .update(updateData)
        .eq('id', assignmentId);

    if (error) throw error;
}

/**
 * Submit a composition
 */
export async function submitComposition(
    assignmentId: string,
    text: string
): Promise<CompositionAssignment> {
    const { data, error } = await supabase
        .from('composition_assignments')
        .update({
            student_text: text,
            status: 'submitted',
            submitted_at: new Date().toISOString()
        })
        .eq('id', assignmentId)
        .select(`
    *,
    composition: compositions(*)
        `)
        .single();

    if (error) throw error;
    return mapAssignmentFromDB(data);
}

// ============================================================================
// EVALUATION OPERATIONS
// ============================================================================

/**
 * Save AI evaluation results
 */
export async function saveAIEvaluation(
    assignmentId: string,
    aiScore: number,
    aiFeedback: AICompositionFeedback
): Promise<void> {
    const { error } = await supabase
        .from('composition_assignments')
        .update({
            ai_score: aiScore,
            ai_feedback: aiFeedback,
            ai_evaluated_at: new Date().toISOString(),
            status: 'ai_evaluated'
        })
        .eq('id', assignmentId);

    if (error) throw error;
}

/**
 * Add teacher review
 */
export async function addTeacherReview(
    assignmentId: string,
    score: number,
    feedback: string
): Promise<void> {
    const { error } = await supabase
        .from('composition_assignments')
        .update({
            teacher_score: score,
            teacher_feedback: feedback,
            teacher_reviewed_at: new Date().toISOString(),
            status: 'teacher_reviewed'
        })
        .eq('id', assignmentId);

    if (error) throw error;
}

/**
 * Delete an assignment
 */
export async function deleteAssignment(assignmentId: string): Promise<void> {
    const { error } = await supabase
        .from('composition_assignments')
        .delete()
        .eq('id', assignmentId);

    if (error) throw error;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function mapCompositionFromDB(data: any): Composition {
    return {
        id: data.id,
        teacherId: data.teacher_id,
        title: data.title,
        description: data.description,
        prompt: data.prompt,
        guidelines: data.guidelines || [],
        minWordCount: data.min_word_count,
        maxWordCount: data.max_word_count,
        difficultyLevel: data.difficulty_level,
        gradeLevel: data.grade_level,
        category: data.category,
        rubric: data.rubric,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at
    };
}

function mapAssignmentFromDB(data: any): CompositionAssignment {
    return {
        id: data.id,
        compositionId: data.composition_id,
        studentId: data.student_id,
        teacherId: data.teacher_id,
        assignedAt: data.assigned_at,
        dueDate: data.due_date,
        status: data.status,
        isMandatory: data.is_mandatory,
        studentText: data.student_text,
        wordCount: data.word_count,
        startedAt: data.started_at,
        submittedAt: data.submitted_at,
        aiScore: data.ai_score,
        aiFeedback: data.ai_feedback,
        aiEvaluatedAt: data.ai_evaluated_at,
        teacherScore: data.teacher_score,
        teacherFeedback: data.teacher_feedback,
        teacherReviewedAt: data.teacher_reviewed_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        composition: data.composition ? mapCompositionFromDB(data.composition) : undefined
    };
}
