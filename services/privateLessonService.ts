import { supabase } from './dbAdapter';
import { LessonAttendance, StudentPaymentConfig, LessonStats, PaymentSummary } from '../types';

// ==================== Lesson Attendance Functions ====================

/**
 * Mark lesson attendance and payment status
 */
export async function markLessonAttendance(
    lessonId: string,
    studentId: string,
    tutorId: string,
    attendanceStatus: 'completed' | 'missed' | 'cancelled',
    paymentData?: {
        paymentAmount?: number;
        paymentStatus: 'paid' | 'unpaid' | 'partial';
        paymentDate?: string;
        paymentNotes?: string;
    }
): Promise<LessonAttendance> {
    // Check if attendance already exists
    const { data: existing, error: fetchError } = await supabase
        .from('lesson_attendance')
        .select('*')
        .eq('lesson_id', lessonId)
        .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw fetchError;
    }

    const attendanceData = {
        lesson_id: lessonId,
        student_id: studentId,
        tutor_id: tutorId,
        attendance_status: attendanceStatus,
        payment_amount: paymentData?.paymentAmount,
        payment_status: paymentData?.paymentStatus || 'unpaid',
        payment_date: paymentData?.paymentDate,
        payment_notes: paymentData?.paymentNotes,
        marked_at: new Date().toISOString()
    };

    let result;
    if (existing) {
        // Update existing attendance
        const { data, error } = await supabase
            .from('lesson_attendance')
            .update(attendanceData)
            .eq('id', existing.id)
            .select()
            .single();

        if (error) throw error;
        result = data;
    } else {
        // Create new attendance record
        const { data, error } = await supabase
            .from('lesson_attendance')
            .insert([attendanceData])
            .select()
            .single();

        if (error) throw error;
        result = data;
    }

    // Update the lesson status in private_lessons table
    const { error: updateError } = await supabase
        .from('private_lessons')
        .update({ status: attendanceStatus })
        .eq('id', lessonId);

    if (updateError) {
        console.error('Error updating lesson status:', updateError);
        // Don't throw - attendance is already saved
    }

    return mapAttendanceFromDB(result);
}

/**
 * Get lesson attendance by lesson ID
 */
export async function getLessonAttendance(lessonId: string): Promise<LessonAttendance | null> {
    const { data, error } = await supabase
        .from('lesson_attendance')
        .select('*')
        .eq('lesson_id', lessonId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null; // No rows found
        throw error;
    }

    return mapAttendanceFromDB(data);
}

/**
 * Get all lesson attendance records for a student
 */
export async function getStudentLessonHistory(
    studentId: string,
    tutorId: string
): Promise<LessonAttendance[]> {
    const { data, error } = await supabase
        .from('lesson_attendance')
        .select('*')
        .eq('student_id', studentId)
        .eq('tutor_id', tutorId)
        .order('marked_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(mapAttendanceFromDB);
}

/**
 * Delete lesson attendance record
 */
export async function deleteLessonAttendance(attendanceId: string): Promise<void> {
    const { error } = await supabase
        .from('lesson_attendance')
        .delete()
        .eq('id', attendanceId);

    if (error) throw error;
}

// ==================== Payment Configuration Functions ====================

/**
 * Set or update student payment configuration
 */
export async function setStudentPaymentConfig(
    studentId: string,
    tutorId: string,
    perLessonFee: number,
    currency: string = 'TL',
    notes?: string
): Promise<StudentPaymentConfig> {
    // Check if config already exists
    const { data: existing, error: fetchError } = await supabase
        .from('student_payment_config')
        .select('*')
        .eq('student_id', studentId)
        .eq('tutor_id', tutorId)
        .maybeSingle();

    if (fetchError) {
        throw fetchError;
    }

    const configData = {
        student_id: studentId,
        tutor_id: tutorId,
        per_lesson_fee: perLessonFee,
        currency,
        notes
    };

    let result;
    if (existing) {
        // Update existing config
        const { data, error } = await supabase
            .from('student_payment_config')
            .update(configData)
            .eq('id', existing.id)
            .select()
            .single();

        if (error) throw error;
        result = data;
    } else {
        // Create new config
        const { data, error } = await supabase
            .from('student_payment_config')
            .insert([configData])
            .select()
            .single();

        if (error) throw error;
        result = data;
    }

    return mapPaymentConfigFromDB(result);
}

/**
 * Get student payment configuration
 */
export async function getStudentPaymentConfig(
    studentId: string,
    tutorId: string
): Promise<StudentPaymentConfig | null> {
    const { data, error } = await supabase
        .from('student_payment_config')
        .select('*')
        .eq('student_id', studentId)
        .eq('tutor_id', tutorId)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return mapPaymentConfigFromDB(data);
}

/**
 * Update payment status for an attendance record
 */
export async function updatePaymentStatus(
    attendanceId: string,
    paymentStatus: 'paid' | 'unpaid' | 'partial',
    paymentDate?: string,
    paymentNotes?: string
): Promise<LessonAttendance> {
    const { data, error } = await supabase
        .from('lesson_attendance')
        .update({
            payment_status: paymentStatus,
            payment_date: paymentDate,
            payment_notes: paymentNotes
        })
        .eq('id', attendanceId)
        .select()
        .single();

    if (error) throw error;

    return mapAttendanceFromDB(data);
}

// ==================== Statistics Functions ====================

/**
 * Get lesson statistics for a student
 */
export async function getStudentLessonStats(
    studentId: string,
    tutorId: string
): Promise<LessonStats> {
    // Get all lessons for this student
    const { data: lessons, error: lessonsError } = await supabase
        .from('private_lessons')
        .select('id, start_time')
        .eq('student_id', studentId)
        .eq('tutor_id', tutorId);

    if (lessonsError) throw lessonsError;

    const totalScheduled = lessons?.length || 0;

    // Get attendance records
    const { data: attendance, error: attendanceError } = await supabase
        .from('lesson_attendance')
        .select('attendance_status')
        .eq('student_id', studentId)
        .eq('tutor_id', tutorId);

    if (attendanceError) throw attendanceError;

    const totalCompleted = attendance?.filter(a => a.attendance_status === 'completed').length || 0;
    const totalMissed = attendance?.filter(a => a.attendance_status === 'missed').length || 0;
    const totalCancelled = attendance?.filter(a => a.attendance_status === 'cancelled').length || 0;

    const completionRate = totalScheduled > 0
        ? Math.round((totalCompleted / totalScheduled) * 100)
        : 0;

    return {
        totalScheduled,
        totalCompleted,
        totalMissed,
        totalCancelled,
        completionRate
    };
}

/**
 * Get payment summary for a student
 */
export async function getPaymentSummary(
    studentId: string,
    tutorId: string,
    dateRange?: { start: string; end: string }
): Promise<PaymentSummary> {
    let query = supabase
        .from('lesson_attendance')
        .select('payment_amount, payment_status')
        .eq('student_id', studentId)
        .eq('tutor_id', tutorId);

    if (dateRange) {
        query = query
            .gte('marked_at', dateRange.start)
            .lte('marked_at', dateRange.end);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Get currency from payment config
    const config = await getStudentPaymentConfig(studentId, tutorId);
    const currency = config?.currency || 'TL';

    const totalLessons = data?.length || 0;
    const paidLessons = data?.filter(a => a.payment_status === 'paid').length || 0;
    const unpaidLessons = data?.filter(a => a.payment_status === 'unpaid').length || 0;

    const totalEarned = data
        ?.filter(a => a.payment_status === 'paid')
        .reduce((sum, a) => sum + (a.payment_amount || 0), 0) || 0;

    const totalPending = data
        ?.filter(a => a.payment_status === 'unpaid' || a.payment_status === 'partial')
        .reduce((sum, a) => sum + (a.payment_amount || 0), 0) || 0;

    return {
        totalEarned,
        totalPending,
        totalLessons,
        paidLessons,
        unpaidLessons,
        currency
    };
}

/**
 * Get bulk payment summaries for multiple students
 */
export async function getBulkPaymentSummaries(
    studentIds: string[],
    tutorId: string,
    dateRange?: { start: string; end: string }
): Promise<Record<string, PaymentSummary>> {
    if (studentIds.length === 0) return {};

    // 1. Fetch all attendance records for these students
    let query = supabase
        .from('lesson_attendance')
        .select('student_id, payment_amount, payment_status, marked_at')
        .in('student_id', studentIds)
        .eq('tutor_id', tutorId);

    if (dateRange) {
        query = query
            .gte('marked_at', dateRange.start)
            .lte('marked_at', dateRange.end);
    }

    const { data: attendanceData, error: attendanceError } = await query;
    if (attendanceError) throw attendanceError;

    // 2. Fetch all payment configs for these students
    const { data: configData, error: configError } = await supabase
        .from('student_payment_config')
        .select('student_id, currency')
        .in('student_id', studentIds)
        .eq('tutor_id', tutorId);

    if (configError) throw configError;

    // 3. Map configs for easy lookup
    const configMap = new Map<string, string>();
    configData?.forEach(config => {
        configMap.set(config.student_id, config.currency);
    });

    // 4. Aggregate data per student
    const summaries: Record<string, PaymentSummary> = {};

    studentIds.forEach(studentId => {
        const studentAttendance = attendanceData?.filter(a => a.student_id === studentId) || [];
        const currency = configMap.get(studentId) || 'TL';

        const totalLessons = studentAttendance.length;
        const paidLessons = studentAttendance.filter(a => a.payment_status === 'paid').length;
        const unpaidLessons = studentAttendance.filter(a => a.payment_status === 'unpaid').length;

        const totalEarned = studentAttendance
            .filter(a => a.payment_status === 'paid')
            .reduce((sum, a) => sum + (a.payment_amount || 0), 0);

        const totalPending = studentAttendance
            .filter(a => a.payment_status === 'unpaid' || a.payment_status === 'partial')
            .reduce((sum, a) => sum + (a.payment_amount || 0), 0);

        summaries[studentId] = {
            totalEarned,
            totalPending,
            totalLessons,
            paidLessons,
            unpaidLessons,
            currency
        };
    });

    return summaries;
}

/**
 * Get upcoming lessons for a student
 */
export async function getStudentLessons(
    studentId: string,
    limit: number = 5
): Promise<any[]> {
    const now = new Date().toISOString();

    const { data, error } = await supabase
        .from('private_lessons')
        .select('*')
        .eq('student_id', studentId)
        .or(`end_time.gte.${now},status.eq.started`)
        .order('start_time', { ascending: true })
        .limit(limit);

    if (error) throw error;

    return data || [];
}

// ==================== Helper Functions ====================

function mapAttendanceFromDB(data: any): LessonAttendance {
    return {
        id: data.id,
        lessonId: data.lesson_id,
        studentId: data.student_id,
        tutorId: data.tutor_id,
        attendanceStatus: data.attendance_status,
        paymentAmount: data.payment_amount ? parseFloat(data.payment_amount) : undefined,
        paymentStatus: data.payment_status,
        paymentDate: data.payment_date,
        paymentNotes: data.payment_notes,
        markedAt: data.marked_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at
    };
}

function mapPaymentConfigFromDB(data: any): StudentPaymentConfig {
    return {
        id: data.id,
        studentId: data.student_id,
        tutorId: data.tutor_id,
        perLessonFee: parseFloat(data.per_lesson_fee),
        currency: data.currency,
        notes: data.notes,
        createdAt: data.created_at,
        updatedAt: data.updated_at
    };
}
