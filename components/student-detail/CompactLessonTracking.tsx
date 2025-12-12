import React, { useState } from 'react';
import { PrivateLesson, LessonStats, PaymentSummary, StudentPaymentConfig } from '../../types';
import StudentPaymentSettings from '../StudentPaymentSettings';

interface CompactLessonTrackingProps {
    lessonStats: LessonStats | null;
    paymentSummary: PaymentSummary | null;
    completedLessons: PrivateLesson[];
    studentId: string;
    teacherId: string;
    paymentConfig: StudentPaymentConfig | null;
    onUpdatePaymentConfig: (config: StudentPaymentConfig) => void;
    onViewLesson: (lesson: PrivateLesson) => void;
}

const CompactLessonTracking: React.FC<CompactLessonTrackingProps> = ({
    lessonStats,
    paymentSummary,
    completedLessons,
    studentId,
    teacherId,
    paymentConfig,
    onUpdatePaymentConfig,
    onViewLesson
}) => {
    const [showSettings, setShowSettings] = useState(false);
    const [isExpanded, setIsExpanded] = useState(true);

    // Calculate derived stats or fallback to 0
    const totalScheduled = lessonStats?.totalScheduled || 0;
    const totalCompleted = lessonStats?.totalCompleted || 0;
    const completionRate = lessonStats?.completionRate || 0;

    const totalEarned = paymentSummary?.totalEarned || 0;
    const totalPending = paymentSummary?.totalPending || 0;
    const currency = paymentSummary?.currency || 'TL';

    return (
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300">
            {/* Minimal Header */}
            <div
                className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-between cursor-pointer transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-lg shadow-sm border border-white/10 text-white">
                        <span className="text-xl">📚</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-white">Özel Ders Takibi</h3>
                        <p className="text-xs text-blue-100">
                            {totalCompleted} ders tamamlandı • {totalPending > 0 ? <span className="text-orange-200 font-bold">{totalPending} {currency} bekliyor</span> : 'Ödeme bekleyen yok'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowSettings(!showSettings);
                        }}
                        className={`p-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-1 ${showSettings ? 'bg-white text-blue-700' : 'text-blue-100 hover:bg-white/10'
                            }`}
                    >
                        <span>⚙️</span>
                        <span className="hidden sm:inline">Ayarlar</span>
                    </button>
                    <button className="text-blue-200 hover:text-white">
                        <svg
                            className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7 7" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Content Area - Collapsible */}
            <div className={`transition-all duration-300 overflow-hidden ${isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 border-t border-b border-gray-100 divide-x divide-gray-100 bg-white">
                    <div className="p-4 text-center">
                        <div className="text-xs text-gray-500 font-medium mb-1">DERS DURUMU</div>
                        <div className="font-bold text-gray-800 text-lg">
                            <span className="text-green-600">{totalCompleted}</span>
                            <span className="text-gray-300 mx-1">/</span>
                            <span>{totalScheduled}</span>
                        </div>
                    </div>
                    <div className="p-4 text-center">
                        <div className="text-xs text-gray-500 font-medium mb-1">BAŞARI ORANI</div>
                        <div className="font-bold text-blue-600 text-lg">
                            %{completionRate}
                        </div>
                    </div>
                    <div className="p-4 text-center">
                        <div className="text-xs text-gray-500 font-medium mb-1">TOPLAM KAZANÇ</div>
                        <div className="font-bold text-emerald-600 text-lg">
                            {totalEarned.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} <span className="text-sm font-normal">{currency}</span>
                        </div>
                    </div>
                    <div className="p-4 text-center bg-orange-50/30">
                        <div className="text-xs text-orange-600 font-medium mb-1">BEKLEYEN ÖDEME</div>
                        <div className="font-bold text-orange-600 text-lg">
                            {totalPending.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} <span className="text-sm font-normal">{currency}</span>
                        </div>
                    </div>
                </div>

                {/* Settings Panel (Conditional) */}
                {showSettings && (
                    <div className="p-4 bg-yellow-50 border-b border-yellow-100 animate-fade-in-down">
                        <StudentPaymentSettings
                            studentId={studentId}
                            teacherId={teacherId}
                            initialConfig={paymentConfig}
                            onUpdate={onUpdatePaymentConfig}
                        />
                    </div>
                )}

                {/* Recent Lessons List */}
                <div className="bg-white">
                    <div className="px-4 py-2 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Son Ders Aktiviteleri</h4>
                    </div>
                    <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto">
                        {completedLessons.length > 0 ? (
                            completedLessons.map(lesson => (
                                <div
                                    key={lesson.id}
                                    onClick={() => onViewLesson(lesson)}
                                    className="p-3 hover:bg-gray-50 transition-colors cursor-pointer flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`w-2 h-2 rounded-full ${lesson.attendance?.attendanceStatus === 'completed' ? 'bg-green-500' :
                                            lesson.attendance?.attendanceStatus === 'missed' ? 'bg-red-500' : 'bg-orange-500'
                                            } flex-shrink-0`}></div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-gray-800 text-sm truncate">{lesson.subject}</span>
                                                <span className="text-xs text-gray-500">
                                                    {new Date(lesson.startTime).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                                                </span>
                                            </div>
                                            {lesson.topic && (
                                                <p className="text-xs text-gray-500 truncate max-w-[200px] sm:max-w-xs">{lesson.topic}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {/* Payment Status Pill */}
                                        {lesson.attendance?.attendanceStatus === 'completed' && (
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap ${lesson.attendance.paymentStatus === 'paid' ? 'bg-green-50 text-green-600' :
                                                lesson.attendance.paymentStatus === 'partial' ? 'bg-yellow-50 text-yellow-600' :
                                                    'bg-red-50 text-red-600'
                                                }`}>
                                                {lesson.attendance.paymentStatus === 'paid' ? 'Ödendi' :
                                                    lesson.attendance.paymentStatus === 'partial' ? 'Kısmi' : 'Ödenmedi'}
                                            </span>
                                        )}
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-300 group-hover:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-4 text-center text-sm text-gray-500">
                                Henüz ders kaydı bulunmuyor.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div >
    );
};

export default CompactLessonTracking;
