import { db, supabase } from './dbAdapter';
import { Student, WeeklyProgram, LearningLoopStatus, Test, ReviewPackage, Task, TaskStatus } from '../types';

/**
 * Service for handling student-related activities and complex business logic
 */
export const studentActivityService = {
    /**
     * Aggregates and updates student learning loop status
     */
    async updateLearningLoopStatus(student: Student, status: LearningLoopStatus): Promise<void> {
        try {
            await db.collection('students').doc(student.id).update({
                learningLoopStatus: status
            });
        } catch (error) {
            console.error('Error updating learning loop status:', error);
            throw error;
        }
    },

    /**
     * Saves or updates a weekly program for a student
     */
    async saveWeeklyProgram(
        studentId: string,
        programData: Omit<WeeklyProgram, 'id' | 'studentId' | 'week'>,
        existingProgramId?: string
    ): Promise<WeeklyProgram> {
        try {
            let programToSave: any;
            if (existingProgramId) {
                programToSave = { ...programData };
                await db.collection('weeklyPrograms').doc(existingProgramId).update(programToSave);
                return { id: existingProgramId, studentId, week: 1, ...programToSave } as WeeklyProgram;
            } else {
                const now = new Date();
                const day = now.getDay();
                const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
                const weekStart = new Date(now.setDate(diff));
                weekStart.setHours(0, 0, 0, 0);
                const weekId = weekStart.toISOString().split('T')[0];

                const newProgramData = { studentId, week: 1, weekId, ...programData };
                const docRef = await db.collection('weeklyPrograms').add(newProgramData);
                return { id: docRef.id, ...newProgramData } as WeeklyProgram;
            }
        } catch (error) {
            console.error('Error in saveWeeklyProgram:', error);
            throw error;
        }
    },

    /**
     * Assigns a review package to a student's weekly program
     */
    async assignReviewPackage(student: Student, pkg: ReviewPackage, weeklyProgram: WeeklyProgram | null): Promise<WeeklyProgram> {
        try {
            const { id, ...pkgData } = pkg;
            const pkgRef = await db.collection('reviewPackages').add(pkgData);

            const newTask: Task = {
                id: `task-${Date.now()}`,
                description: `'${pkg.topic}' Konu Tekrarını Tamamla`,
                status: TaskStatus.Assigned,
                reviewPackageId: pkgRef.id,
                duration: 20,
            };

            let programToUpdate = weeklyProgram ? JSON.parse(JSON.stringify(weeklyProgram)) : {
                studentId: student.id,
                week: 1,
                days: Array.from({ length: 7 }, (_, i) => ({
                    day: ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'][i],
                    tasks: []
                }))
            };

            // Assign to Monday (or first day)
            programToUpdate.days[0].tasks.push(newTask);

            const resultProgram = await this.saveWeeklyProgram(
                student.id,
                { days: programToUpdate.days, weekId: programToUpdate.weekId },
                weeklyProgram?.id
            );

            return resultProgram;
        } catch (error) {
            console.error('Error assigning review package:', error);
            throw error;
        }
    },

    /**
     * Updates test analysis and status
     */
    async updateTestAnalysis(testId: string, analysisReport: any): Promise<void> {
        try {
            await db.collection('tests').doc(testId).update({
                analysis: analysisReport,
                questions: analysisReport.questionEvaluations
            });
        } catch (error) {
            console.error('Error updating test analysis:', error);
            throw error;
        }
    }
};
