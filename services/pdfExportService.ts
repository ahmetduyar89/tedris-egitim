import { Student, WeeklyProgram, TaskStatus, Assignment, QuestionBankAssignment } from '../types';

/**
 * Service for exporting data to PDF format
 */
class PDFExportService {
    /**
     * Exports weekly plan to PDF
     */
    public exportWeeklyPlan(student: Student, weeklyProgram: WeeklyProgram | null): void {
        if (!weeklyProgram) return;
        const { days } = weeklyProgram;

        const content = this.generateWeeklyPlanHtml(student, days);
        this.printHtml(content);
    }

    /**
     * Exports academic analysis to PDF
     */
    public exportAcademicAnalysis(
        student: Student,
        assignedTests: any[],
        assignments: Assignment[],
        questionBankAssignments: (QuestionBankAssignment & { questionBank?: any })[]
    ): void {
        const stats = this.calculateAnalysisStats(assignedTests, assignments, questionBankAssignments);
        const topics = this.identifyPerformanceTopics(assignedTests, assignments, questionBankAssignments);

        const content = this.generateAnalysisHtml(student, stats, topics);
        this.printHtml(content);
    }

    /**
     * Exports an existing HTML element content to PDF (Generic)
     */
    public exportElementToPDF(elementId: string, title: string): void {
        const element = document.getElementById(elementId);
        if (!element) {
            console.error(`Element with id ${elementId} not found`);
            return;
        }

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>${title}</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                    @media print {
                        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        .no-print { display: none; }
                    }
                    body { font-family: 'Inter', sans-serif; padding: 20px; }
                </style>
            </head>
            <body>
                ${element.innerHTML}
            </body>
            </html>
        `;

        this.printHtml(htmlContent);
    }

    // --- Private Helper Methods ---

    private generateWeeklyPlanHtml(student: Student, days: any[]): string {
        let htmlContent = `
            <!DOCTYPE html>
            <html><head>
                <title>${student.name} - Haftalık Plan</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                    @media print {
                        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        .no-print { display: none; }
                    }
                    body { font-family: 'Inter', sans-serif; }
                </style>
            </head>
            <body class="p-8 font-sans">
                <h1 class="text-3xl font-bold mb-2">${student.name} - Haftalık Plan</h1>
                <p class="text-lg text-gray-600 mb-8">${student.grade}. Sınıf</p>
                <div class="space-y-6">`;

        days.forEach(day => {
            const dayTasks = day.tasks || [];
            const dayTotalDuration = dayTasks.reduce((sum: number, task: any) => sum + (task.duration || 0), 0);
            htmlContent += `
                <div class="p-4 border rounded-lg break-inside-avoid">
                    <div class="flex justify-between items-center mb-3">
                        <h2 class="text-xl font-bold text-indigo-600">${day.day}</h2>
                        <span class="font-semibold text-gray-700">Toplam: ${dayTotalDuration} dk</span>
                    </div>
                    <ul class="list-disc pl-5 space-y-2">`;
            if (dayTasks.length > 0) {
                dayTasks.forEach((task: any) => {
                    const isCompleted = task.status === TaskStatus.Completed || task.status === 'tamamlandı';
                    htmlContent += `<li class="${isCompleted ? 'text-gray-500 line-through' : 'text-gray-800'}">${isCompleted ? '✅' : '⬜️'} ${task.description} (${task.duration || 0} dk)</li>`;
                });
            } else {
                htmlContent += `<li class="text-gray-400 list-none">Dinlenme günü.</li>`;
            }
            htmlContent += `</ul></div>`;
        });

        htmlContent += `
                </div>
                <div class="no-print mt-8 text-center">
                    <button onclick="window.print()" class="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700">
                        Yazdır veya PDF Olarak Kaydet
                    </button>
                </div>
            </body></html>`;

        return htmlContent;
    }

    private calculateAnalysisStats(assignedTests: any[], assignments: Assignment[], qbAssignments: any[]) {
        const completedTests = assignedTests.filter(t => t.completed && t.analysis);
        const completedAssignments = assignments.filter(a => a.submission?.status === 'Değerlendirildi');
        const completedQBTests = qbAssignments.filter(qb => qb.status === 'Tamamlandı');

        const totalTests = completedTests.length;
        const totalAssignments = completedAssignments.length;
        const totalQBTests = completedQBTests.length;

        const avgTestScore = totalTests > 0
            ? Math.round(completedTests.reduce((sum, t) => sum + (t.score || 0), 0) / totalTests)
            : 0;

        const avgAssignmentScore = totalAssignments > 0
            ? Math.round(completedAssignments.reduce((sum, a) => {
                const score = a.submission?.teacherScore ?? a.submission?.aiScore ?? 0;
                return sum + score;
            }, 0) / totalAssignments)
            : 0;

        const avgQBTestScore = totalQBTests > 0
            ? Math.round(completedQBTests.reduce((sum, qb) => sum + (qb.score || 0), 0) / totalQBTests)
            : 0;

        return {
            totalTests, totalAssignments, totalQBTests,
            avgTestScore, avgAssignmentScore, avgQBTestScore,
            generalAvg: Math.round((avgTestScore + avgAssignmentScore + avgQBTestScore) / 3)
        };
    }

    private identifyPerformanceTopics(assignedTests: any[], assignments: Assignment[], qbAssignments: any[]) {
        const completedTests = assignedTests.filter(t => t.completed && t.analysis);
        const completedAssignments = assignments.filter(a => a.submission?.status === 'Değerlendirildi');
        const completedQBTests = qbAssignments.filter(qb => qb.status === 'Tamamlandı');

        const invalidTopicPatterns = [/tespit edilememiştir/i, /bulunamadı/i, /yok/i, /bu sınavda/i, /henüz/i];
        const isValidTopic = (topic: string) => topic && topic.trim().length >= 3 && !invalidTopicPatterns.some(p => p.test(topic));

        const weakTopicsMap = new Map<string, number>();
        const strongTopicsMap = new Map<string, number>();

        // Process Tests
        completedTests.forEach(test => {
            test.analysis?.analysis?.weakTopics?.forEach((t: string) => isValidTopic(t) && weakTopicsMap.set(t, (weakTopicsMap.get(t) || 0) + 1));
            test.analysis?.analysis?.strongTopics?.forEach((t: string) => isValidTopic(t) && strongTopicsMap.set(t, (strongTopicsMap.get(t) || 0) + 1));
        });

        // Process Assignments
        completedAssignments.forEach(a => {
            a.submission?.aiAnalysis?.weakTopics?.forEach((t: string) => isValidTopic(t) && weakTopicsMap.set(t, (weakTopicsMap.get(t) || 0) + 1));
            a.submission?.aiAnalysis?.strongTopics?.forEach((t: string) => isValidTopic(t) && strongTopicsMap.set(t, (strongTopicsMap.get(t) || 0) + 1));
        });

        // Process QB
        completedQBTests.forEach(qb => {
            qb.aiFeedback?.weaknesses?.forEach((t: string) => isValidTopic(t) && weakTopicsMap.set(t, (weakTopicsMap.get(t) || 0) + 1));
            qb.aiFeedback?.strengths?.forEach((t: string) => isValidTopic(t) && strongTopicsMap.set(t, (strongTopicsMap.get(t) || 0) + 1));
        });

        return {
            weak: Array.from(weakTopicsMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5),
            strong: Array.from(strongTopicsMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5)
        };
    }

    private generateAnalysisHtml(student: Student, stats: any, topics: any): string {
        const dateStr = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>${student.name} - Analiz</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                    @media print {
                        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        .no-print { display: none; }
                    }
                    body { font-family: 'Inter', sans-serif; }
                    .gradient-header { background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); }
                </style>
            </head>
            <body class="bg-gray-50 p-8">
                <div class="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
                    <div class="gradient-header text-white p-6">
                        <h1 class="text-2xl font-bold">${student.name}</h1>
                        <p class="opacity-90">${student.grade}. Sınıf Performance Raporu - ${dateStr}</p>
                    </div>
                    <div class="p-6 space-y-8">
                        <div class="grid grid-cols-4 gap-4">
                            ${this.renderStatCard("Testler", stats.totalTests, `Ort: %${stats.avgTestScore}`, "blue")}
                            ${this.renderStatCard("Ödevler", stats.totalAssignments, `Ort: %${stats.avgAssignmentScore}`, "cyan")}
                            ${this.renderStatCard("Soru Bankası", stats.totalQBTests, `Ort: ${stats.avgQBTestScore}/100`, "purple")}
                            ${this.renderStatCard("Genel Ort.", `%${stats.generalAvg}`, "Tüm Aktiviteler", "green")}
                        </div>
                        
                        <div>
                            <h2 class="text-lg font-bold mb-3 text-red-600">⚠️ Gelişim Gereken Konular</h2>
                            <div class="space-y-2">
                                ${topics.weak.map(([topic, count]: any) => `
                                    <div class="flex justify-between p-3 bg-red-50 rounded border border-red-100">
                                        <span>${topic}</span>
                                        <span class="text-xs font-bold text-red-800">${count} Aktivite</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <div>
                            <h2 class="text-lg font-bold mb-3 text-green-600">💪 Güçlü Olduğu Konular</h2>
                            <div class="grid grid-cols-2 gap-2">
                                ${topics.strong.map(([topic]: any) => `
                                    <div class="p-2 bg-green-50 rounded border border-green-100 text-sm">✓ ${topic}</div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="no-print mt-6 text-center">
                    <button onclick="window.print()" class="bg-indigo-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-indigo-700">Yazdır / Kaydet</button>
                </div>
            </body></html>`;
    }

    private renderStatCard(label: string, value: any, sub: string, color: string): string {
        const colors: any = {
            blue: "bg-blue-50 border-blue-500 text-blue-600",
            cyan: "bg-cyan-50 border-cyan-500 text-cyan-600",
            purple: "bg-purple-50 border-purple-500 text-purple-600",
            green: "bg-green-50 border-green-500 text-green-600"
        };
        return `
            <div class="${colors[color]} p-4 rounded-lg border-l-4 shadow-sm">
                <div class="text-xs text-gray-500 font-medium">${label}</div>
                <div class="text-xl font-bold">${value}</div>
                <div class="text-xs opacity-75">${sub}</div>
            </div>`;
    }

    private printHtml(htmlContent: string): void {
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = url;
        document.body.appendChild(iframe);

        iframe.onload = () => {
            setTimeout(() => {
                iframe.contentWindow?.print();
                setTimeout(() => {
                    document.body.removeChild(iframe);
                    URL.revokeObjectURL(url);
                }, 100);
            }, 500);
        };
    }
}

export const pdfExportService = new PDFExportService();
