import { supabase } from './dbAdapter';
import { Parent, ParentStudentRelation, Student, PrivateLesson, Test, Assignment } from '../types';

/**
 * Veli Portalı Servisleri
 * Velilerin çocuklarının eğitim bilgilerine erişimi için servisler
 */

// ============================================================================
// VELİ YÖNETİMİ
// ============================================================================

/**
 * Veli bilgilerini getir
 */
export const getParent = async (parentId: string): Promise<Parent | null> => {
    try {
        const { data, error } = await supabase
            .from('parents')
            .select('*')
            .eq('id', parentId)
            .single();

        if (error) throw error;

        if (!data) return null;

        return {
            id: data.id,
            name: data.name,
            email: data.email,
            phone: data.phone,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        };
    } catch (error) {
        console.error('Error fetching parent:', error);
        throw error;
    }
};

/**
 * Velinin öğrencilerini getir
 */
export const getParentStudents = async (parentId: string): Promise<Student[]> => {
    try {
        const { data, error } = await supabase
            .from('parent_student_relations')
            .select(`
                student_id,
                students (
                    id,
                    name,
                    grade,
                    tutor_id,
                    contact,
                    parent_name,
                    parent_phone,
                    level,
                    xp,
                    learning_loop_status
                )
            `)
            .eq('parent_id', parentId);

        if (error) throw error;

        if (!data) return [];

        return data.map((row: any) => ({
            id: row.students.id,
            name: row.students.name,
            grade: row.students.grade,
            tutorId: row.students.tutor_id,
            contact: row.students.contact,
            parentName: row.students.parent_name,
            parentPhone: row.students.parent_phone,
            level: row.students.level || 1,
            xp: row.students.xp || 0,
            badges: [],
            learningLoopStatus: row.students.learning_loop_status,
            progressReports: []
        }));
    } catch (error) {
        console.error('Error fetching parent students:', error);
        throw error;
    }
};

// ============================================================================
// ÖZEL DERS NOTLARI
// ============================================================================

/**
 * Öğrencinin tamamlanan özel ders notlarını getir
 * İşlenen konular ve ders notları dahil
 */
export const getStudentLessonNotes = async (
    studentId: string,
    limit: number = 20
): Promise<PrivateLesson[]> => {
    try {
        const { data, error } = await supabase
            .from('private_lessons')
            .select('*')
            .eq('student_id', studentId)
            .eq('status', 'completed')
            .order('start_time', { ascending: false })
            .limit(limit);

        if (error) throw error;

        if (!data) return [];

        return data.map((row: any) => ({
            id: row.id,
            tutorId: row.tutor_id,
            studentId: row.student_id,
            studentName: row.student_name,
            startTime: row.start_time,
            endTime: row.end_time,
            subject: row.subject,
            topic: row.topic,
            status: row.status,
            notes: row.notes,
            duration: row.duration,
            color: row.color,
            contact: row.contact,
            grade: row.grade,
            lessonNotes: row.lesson_notes,
            homework: row.homework,
            type: row.type
        }));
    } catch (error) {
        console.error('Error fetching student lesson notes:', error);
        throw error;
    }
};

/**
 * Öğrencinin yaklaşan derslerini getir
 */
export const getUpcomingLessons = async (studentId: string): Promise<PrivateLesson[]> => {
    try {
        const now = new Date().toISOString();

        const { data, error } = await supabase
            .from('private_lessons')
            .select('*')
            .eq('student_id', studentId)
            .eq('status', 'scheduled')
            .gte('start_time', now)
            .order('start_time', { ascending: true })
            .limit(10);

        if (error) throw error;

        if (!data) return [];

        return data.map((row: any) => ({
            id: row.id,
            tutorId: row.tutor_id,
            studentId: row.student_id,
            studentName: row.student_name,
            startTime: row.start_time,
            endTime: row.end_time,
            subject: row.subject,
            topic: row.topic,
            status: row.status,
            duration: row.duration,
            type: row.type
        }));
    } catch (error) {
        console.error('Error fetching upcoming lessons:', error);
        throw error;
    }
};

// ============================================================================
// PERFORMANS TAKİBİ
// ============================================================================

/**
 * Öğrencinin test sonuçlarını getir
 */
export const getStudentTests = async (
    studentId: string,
    limit: number = 10
): Promise<Test[]> => {
    try {
        const { data, error } = await supabase
            .from('tests')
            .select('*')
            .eq('student_id', studentId)
            .eq('completed', true)
            .order('submission_date', { ascending: false })
            .limit(limit);

        if (error) throw error;

        return data || [];
    } catch (error) {
        console.error('Error fetching student tests:', error);
        throw error;
    }
};

/**
 * Öğrencinin genel performans özetini getir
 */
export const getStudentPerformanceSummary = async (studentId: string) => {
    try {
        const tests = await getStudentTests(studentId, 20);

        if (tests.length === 0) {
            return {
                averageScore: 0,
                totalTests: 0,
                recentTests: [],
                trend: 'stable' as 'improving' | 'declining' | 'stable'
            };
        }

        const totalScore = tests.reduce((sum, test) => sum + (test.score || 0), 0);
        const averageScore = Math.round(totalScore / tests.length);

        // Son 5 test için trend analizi
        const recentTests = tests.slice(0, 5);
        let trend: 'improving' | 'declining' | 'stable' = 'stable';

        if (recentTests.length >= 3) {
            const firstHalf = recentTests.slice(Math.floor(recentTests.length / 2));
            const secondHalf = recentTests.slice(0, Math.floor(recentTests.length / 2));

            const firstAvg = firstHalf.reduce((sum, t) => sum + (t.score || 0), 0) / firstHalf.length;
            const secondAvg = secondHalf.reduce((sum, t) => sum + (t.score || 0), 0) / secondHalf.length;

            if (secondAvg > firstAvg + 5) trend = 'improving';
            else if (secondAvg < firstAvg - 5) trend = 'declining';
        }

        return {
            averageScore,
            totalTests: tests.length,
            recentTests: recentTests.map(t => ({
                title: t.title,
                score: t.score,
                date: t.submissionDate
            })),
            trend
        };
    } catch (error) {
        console.error('Error fetching performance summary:', error);
        throw error;
    }
};

// ============================================================================
// ÖDEV TAKİBİ
// ============================================================================

/**
 * Öğrencinin aktif ödevlerini getir
 */
export const getStudentActiveAssignments = async (studentId: string): Promise<Assignment[]> => {
    try {
        const { data, error } = await supabase
            .from('assignments')
            .select('*')
            .eq('student_id', studentId)
            .order('due_date', { ascending: true });

        if (error) throw error;

        return data || [];
    } catch (error) {
        console.error('Error fetching student assignments:', error);
        throw error;
    }
};

/**
 * Öğrencinin ödev istatistiklerini getir
 */
export const getAssignmentStats = async (studentId: string) => {
    try {
        const assignments = await getStudentActiveAssignments(studentId);

        const now = new Date();
        const pending = assignments.filter(a => !a.submission && new Date(a.dueDate) > now);
        const overdue = assignments.filter(a => !a.submission && new Date(a.dueDate) <= now);
        const completed = assignments.filter(a => a.submission);

        return {
            total: assignments.length,
            pending: pending.length,
            overdue: overdue.length,
            completed: completed.length
        };
    } catch (error) {
        console.error('Error fetching assignment stats:', error);
        throw error;
    }
};
