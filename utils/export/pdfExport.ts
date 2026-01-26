import { Student, WeeklyProgram, TaskStatus, Assignment, QuestionBankAssignment, PDFTest, PDFTestSubmission } from '../../types';

export const handleExportWeeklyPlanToPDF = (student: Student, weeklyProgram: WeeklyProgram | null) => {
    if (!weeklyProgram) return;
    const { days } = weeklyProgram;
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
        let dayTotalDuration = dayTasks.reduce((sum, task) => sum + (task.duration || 0), 0);
        htmlContent += `
            <div class="p-4 border rounded-lg break-inside-avoid">
                <div class="flex justify-between items-center mb-3">
                    <h2 class="text-xl font-bold text-indigo-600">${day.day}</h2>
                    <span class="font-semibold text-gray-700">Toplam: ${dayTotalDuration} dk</span>
                </div>
                <ul class="list-disc pl-5 space-y-2">`;
        if (dayTasks.length > 0) {
            dayTasks.forEach(task => {
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
        </body>
        </html>`;

    printHtml(htmlContent);
};

export const handleExportAnalysisToPDF = (
    student: Student,
    assignedTests: any[],
    assignments: Assignment[],
    questionBankAssignments: (QuestionBankAssignment & { questionBank?: any })[]
) => {
    const completedTests = assignedTests.filter(t => t.completed && t.analysis);
    const completedAssignments = assignments.filter(a => a.submission?.status === 'Değerlendirildi');
    const completedQBTests = questionBankAssignments.filter(qb => qb.status === 'Tamamlandı');

    const totalTests = completedTests.length;
    const totalAssignments = completedAssignments.length;
    const totalQBTests = completedQBTests.length;

    const avgTestScore = totalTests > 0
        ? Math.round(completedTests.reduce((sum, t) => sum + (t.score || 0), 0) / totalTests)
        : 0;

    const avgAssignmentScore = completedAssignments.length > 0
        ? Math.round(completedAssignments.reduce((sum, a) => {
            const score = a.submission?.teacherScore ?? a.submission?.aiScore ?? 0;
            return sum + score;
        }, 0) / completedAssignments.length)
        : 0;

    const avgQBTestScore = totalQBTests > 0
        ? Math.round(completedQBTests.reduce((sum, qb) => sum + (qb.score || 0), 0) / totalQBTests)
        : 0;

    const invalidTopicPatterns = [
        /tespit edilememiştir/i,
        /bulunamadı/i,
        /yok/i,
        /bu sınavda/i,
        /henüz/i
    ];

    const isValidTopic = (topic: string) => {
        if (!topic || topic.trim().length < 3) return false;
        return !invalidTopicPatterns.some(pattern => pattern.test(topic));
    };

    const weakTopicsMap = new Map<string, number>();
    completedTests.forEach(test => {
        test.analysis?.analysis?.weakTopics?.forEach((topic: string) => {
            if (isValidTopic(topic)) {
                weakTopicsMap.set(topic, (weakTopicsMap.get(topic) || 0) + 1);
            }
        });
    });
    completedAssignments.forEach(assignment => {
        assignment.submission?.aiAnalysis?.weakTopics?.forEach((topic: string) => {
            if (isValidTopic(topic)) {
                weakTopicsMap.set(topic, (weakTopicsMap.get(topic) || 0) + 1);
            }
        });
    });
    completedQBTests.forEach(qbTest => {
        if (qbTest.aiFeedback?.weaknesses) {
            qbTest.aiFeedback.weaknesses.forEach((topic: string) => {
                if (isValidTopic(topic)) {
                    weakTopicsMap.set(topic, (weakTopicsMap.get(topic) || 0) + 1);
                }
            });
        }
    });

    const strongTopicsMap = new Map<string, number>();
    completedTests.forEach(test => {
        test.analysis?.analysis?.strongTopics?.forEach((topic: string) => {
            if (isValidTopic(topic)) {
                strongTopicsMap.set(topic, (strongTopicsMap.get(topic) || 0) + 1);
            }
        });
    });
    completedAssignments.forEach(assignment => {
        assignment.submission?.aiAnalysis?.strongTopics?.forEach((topic: string) => {
            if (isValidTopic(topic)) {
                strongTopicsMap.set(topic, (strongTopicsMap.get(topic) || 0) + 1);
            }
        });
    });
    completedQBTests.forEach(qbTest => {
        if (qbTest.aiFeedback?.strengths) {
            qbTest.aiFeedback.strengths.forEach((topic: string) => {
                if (isValidTopic(topic)) {
                    strongTopicsMap.set(topic, (strongTopicsMap.get(topic) || 0) + 1);
                }
            });
        }
    });

    const weakTopics = Array.from(weakTopicsMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    const strongTopics = Array.from(strongTopicsMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>${student.name} - Genel Performans Analizi</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
                @media print {
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .no-print { display: none; }
                    .page-break { page-break-before: always; }
                }
                body { font-family: 'Inter', sans-serif; }
                .gradient-header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                }
                .stat-card {
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                }
            </style>
        </head>
        <body class="bg-gray-50 p-8">
            <div class="max-w-6xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
                <div class="gradient-header text-white p-8">
                    <h1 class="text-4xl font-bold mb-2">${student.name}</h1>
                    <p class="text-xl opacity-90">${student.grade}. Sınıf - Genel Performans Analizi</p>
                    <p class="text-sm opacity-75 mt-2">Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    })}</p>
                </div>

                <div class="p-8 space-y-8">
                    <div>
                        <h2 class="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                            <span class="text-3xl mr-2">📊</span>
                            Genel Özet
                        </h2>
                        <div class="grid grid-cols-4 gap-4">
                            <div class="stat-card bg-blue-50 p-4 rounded-xl border-l-4 border-blue-500">
                                <div class="text-sm text-gray-600 mb-1">Testler</div>
                                <div class="text-3xl font-bold text-blue-600">${totalTests}</div>
                                <div class="text-sm text-gray-500 mt-1">Ort: ${avgTestScore}%</div>
                            </div>
                            <div class="stat-card bg-cyan-50 p-4 rounded-xl border-l-4 border-cyan-500">
                                <div class="text-sm text-gray-600 mb-1">Ödevler</div>
                                <div class="text-3xl font-bold text-cyan-600">${totalAssignments}</div>
                                <div class="text-sm text-gray-500 mt-1">Ort: ${avgAssignmentScore}%</div>
                            </div>
                            <div class="stat-card bg-purple-50 p-4 rounded-xl border-l-4 border-purple-500">
                                <div class="text-sm text-gray-600 mb-1">Soru Bankası</div>
                                <div class="text-3xl font-bold text-purple-600">${totalQBTests}</div>
                                <div class="text-sm text-gray-500 mt-1">Ort: ${avgQBTestScore}/100</div>
                            </div>
                            <div class="stat-card bg-green-50 p-4 rounded-xl border-l-4 border-green-500">
                                <div class="text-sm text-gray-600 mb-1">Genel Ortalama</div>
                                <div class="text-3xl font-bold text-green-600">
                                    ${Math.round((avgTestScore + avgAssignmentScore + avgQBTestScore) / 3)}%
                                </div>
                                <div class="text-sm text-gray-500 mt-1">Tüm Aktiviteler</div>
                            </div>
                        </div>
                    </div>

                    ${weakTopics.length > 0 ? `
                    <div>
                        <h2 class="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                            <span class="text-3xl mr-2">⚠️</span>
                            En Çok Zorlanan Konular
                        </h2>
                        <p class="text-sm text-gray-500 mb-3">Testler, soru bankası ve ödevlerden toplanan veriler</p>
                        <div class="space-y-3">
                            ${weakTopics.map(([topic, count], idx) => `
                                <div class="flex items-center justify-between bg-red-50 p-4 rounded-lg border border-red-200">
                                    <div class="flex items-center space-x-3">
                                        <span class="text-2xl font-bold text-red-600">${idx + 1}</span>
                                        <span class="text-gray-800 font-medium">${topic}</span>
                                    </div>
                                    <span class="px-3 py-1 bg-red-200 text-red-800 rounded-full text-sm font-semibold">
                                        ${count} aktivitede
                                    </span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    ` : ''}

                    <div>
                        <h2 class="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                            <span class="text-3xl mr-2">💪</span>
                            En Güçlü Konular
                        </h2>
                        <p class="text-sm text-gray-500 mb-3">Testler, soru bankası ve ödevlerden toplanan veriler</p>
                        ${strongTopics.length > 0 ? `
                            <div class="grid grid-cols-2 gap-3">
                                ${strongTopics.map(([topic, count]) => `
                                    <div class="flex items-center justify-between bg-green-50 p-3 rounded-lg border border-green-200">
                                        <div class="flex items-center space-x-2">
                                            <span class="text-xl">✓</span>
                                            <span class="text-gray-800 font-medium">${topic}</span>
                                        </div>
                                        <span class="px-2 py-1 bg-green-200 text-green-800 rounded-full text-xs font-semibold">
                                            ${count} aktivite
                                        </span>
                                    </div>
                                `).join('')}
                            </div>
                        ` : `
                            <div class="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center">
                                <p class="text-gray-600 font-medium">
                                    Henüz güçlü olunan bir konu tespit edilememiştir.
                                </p>
                            </div>
                        `}
                    </div>

                    <div class="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
                        <h2 class="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                            <span class="text-3xl mr-2">💡</span>
                            Genel Öneriler
                        </h2>
                        <ul class="space-y-3">
                            ${avgTestScore < 70 && totalTests > 0 ? `
                                <li class="flex items-start bg-white p-3 rounded-lg">
                                    <span class="text-orange-600 mr-2 mt-1">→</span>
                                    <span class="text-gray-700">
                                        Test ortalaması ${avgTestScore}% seviyesinde. Konu anlatımı tekrarı ve düzenli örnek soru çalışması yapılması önerilir.
                                    </span>
                                </li>
                            ` : ''}
                            ${avgAssignmentScore < 70 && totalAssignments > 0 ? `
                                <li class="flex items-start bg-white p-3 rounded-lg">
                                    <span class="text-orange-600 mr-2 mt-1">→</span>
                                    <span class="text-gray-700">
                                        Ödev performansı ${avgAssignmentScore}% seviyesinde. Ödev yapım sürecinde daha dikkatli çalışma ve zaman yönetimi önerilir.
                                    </span>
                                </li>
                            ` : ''}
                            ${avgQBTestScore < 70 && totalQBTests > 0 ? `
                                <li class="flex items-start bg-white p-3 rounded-lg">
                                    <span class="text-orange-600 mr-2 mt-1">→</span>
                                    <span class="text-gray-700">
                                        Soru bankası testlerinde ${avgQBTestScore} puan ortalaması var. Soru çözüm tekniklerinin geliştirilmesi ve zaman yönetimi üzerine çalışılmalı.
                                    </span>
                                </li>
                            ` : ''}
                            ${weakTopics.length > 0 ? `
                                <li class="flex items-start bg-white p-3 rounded-lg">
                                    <span class="text-orange-600 mr-2 mt-1">→</span>
                                    <span class="text-gray-700">
                                        <strong>${weakTopics[0][0]}</strong> konusunda ${weakTopics[0][1]} farklı aktivitede zorluk yaşanmış. Bu konuda ek kaynak çalışması ve örnek soru çözümü yapılması önerilir.
                                    </span>
                                </li>
                            ` : ''}
                            ${weakTopics.length >= 2 ? `
                                <li class="flex items-start bg-white p-3 rounded-lg">
                                    <span class="text-orange-600 mr-2 mt-1">→</span>
                                    <span class="text-gray-700">
                                        <strong>${weakTopics[1][0]}</strong> konusunda da gelişim gerekiyor. Konu anlatımı tekrarı ve alıştırma soruları faydalı olacaktır.
                                    </span>
                                </li>
                            ` : ''}
                            ${weakTopics.length >= 3 ? `
                                <li class="flex items-start bg-white p-3 rounded-lg">
                                    <span class="text-orange-600 mr-2 mt-1">→</span>
                                    <span class="text-gray-700">
                                        <strong>${weakTopics[2][0]}</strong> konusuna da dikkat edilmeli. Temel kavramların pekiştirilmesi önerilir.
                                    </span>
                                </li>
                            ` : ''}
                            ${strongTopics.length > 0 ? `
                                <li class="flex items-start bg-white p-3 rounded-lg">
                                    <span class="text-green-600 mr-2 mt-1">✓</span>
                                    <span class="text-gray-700">
                                        <strong>${strongTopics[0][0]}</strong> konusunda başarılı performans gösterilmiş. Bu konudaki çalışma yöntemi diğer konulara da uygulanabilir.
                                    </span>
                                </li>
                            ` : ''}
                            ${strongTopics.length >= 2 ? `
                                <li class="flex items-start bg-white p-3 rounded-lg">
                                    <span class="text-green-600 mr-2 mt-1">✓</span>
                                    <span class="text-gray-700">
                                        <strong>${strongTopics[1][0]}</strong> konusundaki hakimiyet devam ettirilerek benzer konulara geçiş yapılabilir.
                                    </span>
                                </li>
                            ` : ''}
                            ${avgTestScore >= 85 && avgAssignmentScore >= 85 && avgQBTestScore >= 85 ? `
                                <li class="flex items-start bg-white p-3 rounded-lg">
                                    <span class="text-green-600 mr-2 mt-1">✓</span>
                                    <span class="text-gray-700">
                                        Tüm alanlarda yüksek başarı gösterilmektedir (%85+). Mevcut çalışma disiplini sürdürülmeli ve zorluk seviyesi artırılabilir.
                                    </span>
                                </li>
                            ` : ''}
                            ${totalTests + totalAssignments + totalQBTests < 5 ? `
                                <li class="flex items-start bg-white p-3 rounded-lg">
                                    <span class="text-blue-600 mr-2 mt-1">ℹ</span>
                                    <span class="text-gray-700">
                                        Daha detaylı analiz için daha fazla aktivite verisi gereklidir. Düzenli test ve ödev çalışması yapılması önerilir.
                                    </span>
                                </li>
                            ` : ''}
                        </ul>
                    </div>

                    <div class="text-center text-gray-500 text-sm mt-8 pt-6 border-t">
                        <p>Bu rapor sistem tarafından otomatik olarak oluşturulmuştur.</p>
                        <p class="mt-1">© ${new Date().getFullYear()} Özel Ders Takip Sistemi</p>
                    </div>
                </div>
            </div>

            <div class="no-print mt-8 text-center">
                <button onclick="window.print()" class="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 shadow-lg">
                    📄 Yazdır veya PDF Olarak Kaydet
                </button>
            </div>
        </body>
        </html>
    `;

    printHtml(htmlContent);
};

const printHtml = (htmlContent: string) => {
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
};
