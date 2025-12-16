import React, { useState, useEffect } from 'react';
import { Student } from '../types';
import * as parentService from '../services/parentService';

interface ParentPerformanceViewProps {
    student: Student;
}

const ParentPerformanceView: React.FC<ParentPerformanceViewProps> = ({ student }) => {
    const [loading, setLoading] = useState(true);
    const [performanceSummary, setPerformanceSummary] = useState<any>(null);
    const [recentTests, setRecentTests] = useState<any[]>([]);

    useEffect(() => {
        const fetchPerformance = async () => {
            try {
                setLoading(true);
                const [summary, tests] = await Promise.all([
                    parentService.getStudentPerformanceSummary(student.id),
                    parentService.getStudentTests(student.id, 10)
                ]);
                setPerformanceSummary(summary);
                setRecentTests(tests);
            } catch (error) {
                console.error('Error fetching performance:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPerformance();
    }, [student.id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!performanceSummary) {
        return (
            <div className="text-center py-12 text-gray-500">
                <div className="text-6xl mb-4">📊</div>
                <p>Performans verisi yüklenemedi</p>
            </div>
        );
    }

    const getTrendIcon = (trend: string) => {
        switch (trend) {
            case 'improving':
                return <span className="text-green-500">📈 Yükseliyor</span>;
            case 'declining':
                return <span className="text-red-500">📉 Düşüyor</span>;
            default:
                return <span className="text-gray-500">➡️ Stabil</span>;
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 85) return 'text-green-600 bg-green-50';
        if (score >= 70) return 'text-blue-600 bg-blue-50';
        if (score >= 50) return 'text-yellow-600 bg-yellow-50';
        return 'text-red-600 bg-red-50';
    };

    return (
        <div className="space-y-6">
            {/* Özet Kartları */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Ortalama Puan */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-blue-700">Ortalama Puan</span>
                        <span className="text-2xl">📊</span>
                    </div>
                    <div className="text-3xl font-bold text-blue-900">
                        {performanceSummary.averageScore}
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                        100 üzerinden
                    </div>
                </div>

                {/* Toplam Test */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-purple-700">Toplam Test</span>
                        <span className="text-2xl">📝</span>
                    </div>
                    <div className="text-3xl font-bold text-purple-900">
                        {performanceSummary.totalTests}
                    </div>
                    <div className="text-xs text-purple-600 mt-1">
                        Tamamlanan test sayısı
                    </div>
                </div>

                {/* Trend */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-green-700">Performans Trendi</span>
                        <span className="text-2xl">📈</span>
                    </div>
                    <div className="text-lg font-bold text-green-900 mt-2">
                        {getTrendIcon(performanceSummary.trend)}
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                        Son 5 test bazında
                    </div>
                </div>
            </div>

            {/* Son Testler */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800">Son Test Sonuçları</h3>
                    <p className="text-sm text-gray-600 mt-1">Son {recentTests.length} test</p>
                </div>

                {recentTests.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <div className="text-4xl mb-2">📝</div>
                        <p>Henüz test sonucu bulunmuyor</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {recentTests.map((test, index) => (
                            <div key={test.id || index} className="p-4 hover:bg-gray-50 transition">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-gray-900">{test.title}</h4>
                                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                            <span className="flex items-center gap-1">
                                                📅 {new Date(test.submissionDate || test.submission_date).toLocaleDateString('tr-TR')}
                                            </span>
                                            {test.subject && (
                                                <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">
                                                    {test.subject}
                                                </span>
                                            )}
                                            {test.testType && (
                                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                                    {test.testType}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <div className={`text-2xl font-bold px-4 py-2 rounded-lg ${getScoreColor(test.score || 0)}`}>
                                            {test.score || 0}
                                        </div>
                                        <div className="text-xs text-center text-gray-500 mt-1">
                                            {test.correctAnswers || 0}/{test.totalQuestions || 0} doğru
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Performans Grafiği Placeholder */}
            {recentTests.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Performans Grafiği</h3>
                    <div className="h-64 flex items-end justify-around gap-2">
                        {performanceSummary.recentTests.slice(0, 10).reverse().map((test: any, index: number) => {
                            const height = (test.score / 100) * 100;
                            return (
                                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                                    <div className="text-xs font-semibold text-gray-700">{test.score}</div>
                                    <div
                                        className={`w-full rounded-t-lg transition-all hover:opacity-80 ${test.score >= 85 ? 'bg-green-500' :
                                                test.score >= 70 ? 'bg-blue-500' :
                                                    test.score >= 50 ? 'bg-yellow-500' :
                                                        'bg-red-500'
                                            }`}
                                        style={{ height: `${height}%` }}
                                        title={test.title}
                                    ></div>
                                    <div className="text-xs text-gray-500 text-center line-clamp-1">
                                        {new Date(test.date).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-4 flex items-center justify-center gap-4 text-xs">
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-green-500 rounded"></div>
                            <span>Mükemmel (85+)</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-blue-500 rounded"></div>
                            <span>İyi (70-84)</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                            <span>Orta (50-69)</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-red-500 rounded"></div>
                            <span>Gelişmeli (&lt;50)</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ParentPerformanceView;
