import React from 'react';
import { Student, PrivateLesson, WeeklyProgram } from '../../types';
import EditableWeeklySchedule from '../EditableWeeklySchedule';

interface StudentDetailModalProps {
    onClose: () => void;
    selectedStudent: Student;
    selectedLesson: PrivateLesson;
    detailActiveTab: 'notes' | 'homework' | 'ai' | 'attendance';
    setDetailActiveTab: (tab: 'notes' | 'homework' | 'ai' | 'attendance') => void;
    detailTopic: string;
    setDetailTopic: (topic: string) => void;
    detailLessonNotes: string;
    setDetailLessonNotes: (notes: string) => void;
    weeklyHomework: Record<string, string>;
    setWeeklyHomework: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    handleSaveStudentDetail: () => void;
    programViewMode: 'past' | 'current';
    setProgramViewMode: (mode: 'past' | 'current') => void;
    pastWeeklyProgram: WeeklyProgram | null;
    setPastWeeklyProgram: (program: WeeklyProgram) => void;
    currentWeeklyProgram: WeeklyProgram | null;
    setCurrentWeeklyProgram: (program: WeeklyProgram) => void;
    DAYS_TR: string[];
    aiSummary: string;
    aiHomeworkSuggestions: string[];
    aiLoading: boolean;
    handleGenerateAISuggestions: () => void;
    handleApplyAISuggestions: () => void;
    attendanceStatus: 'completed' | 'missed' | 'cancelled';
    setAttendanceStatus: (status: 'completed' | 'missed' | 'cancelled') => void;
    paymentStatus: 'paid' | 'unpaid' | 'partial';
    setPaymentStatus: (status: 'paid' | 'unpaid' | 'partial') => void;
    paymentAmount: string;
    setPaymentAmount: (amount: string) => void;
    paymentDate: string;
    setPaymentDate: (date: string) => void;
    paymentNotes: string;
    setPaymentNotes: (notes: string) => void;
    studentPaymentConfig: number;
    handleSaveAttendance: () => void;
}

const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
    onClose,
    selectedStudent,
    selectedLesson,
    detailActiveTab,
    setDetailActiveTab,
    detailTopic,
    setDetailTopic,
    detailLessonNotes,
    setDetailLessonNotes,
    weeklyHomework,
    setWeeklyHomework,
    handleSaveStudentDetail,
    programViewMode,
    setProgramViewMode,
    pastWeeklyProgram,
    setPastWeeklyProgram,
    currentWeeklyProgram,
    setCurrentWeeklyProgram,
    DAYS_TR,
    aiSummary,
    aiHomeworkSuggestions,
    aiLoading,
    handleGenerateAISuggestions,
    handleApplyAISuggestions,
    attendanceStatus,
    setAttendanceStatus,
    paymentStatus,
    setPaymentStatus,
    paymentAmount,
    setPaymentAmount,
    paymentDate,
    setPaymentDate,
    paymentNotes,
    setPaymentNotes,
    studentPaymentConfig,
    handleSaveAttendance
}) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1 flex-wrap">
                            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: selectedLesson.color || '#FFB6C1' }}></div>
                            <span className="text-xs sm:text-sm text-gray-500">{selectedLesson.subject}</span>
                            <span className="text-xs sm:text-sm text-gray-500 truncate">
                                {new Date(selectedLesson.startTime).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' })}
                            </span>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-bold font-poppins truncate">{selectedStudent.name}</h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 flex-shrink-0 ml-2">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex border-b border-gray-200 mb-4 sm:mb-6 overflow-x-auto scrollbar-hide -mx-4 sm:mx-0 px-4 sm:px-0">
                    {(['notes', 'homework', 'ai', 'attendance'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setDetailActiveTab(tab)}
                            className={`px-3 sm:px-6 py-3 font-medium flex items-center space-x-1 sm:space-x-2 whitespace-nowrap flex-shrink-0 text-sm sm:text-base ${detailActiveTab === tab ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
                        >
                            <span>{tab === 'notes' ? 'Ders Notları' : tab === 'homework' ? 'Haftalık Program' : tab === 'ai' ? 'AI Asistan' : 'Katılım'}</span>
                        </button>
                    ))}
                </div>

                {detailActiveTab === 'notes' && (
                    <div className="space-y-3 sm:space-y-4">
                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">İşlenen Konu</label>
                            <input
                                type="text"
                                value={detailTopic}
                                onChange={e => setDetailTopic(e.target.value)}
                                placeholder="Bugün ne işlendi?"
                                className="w-full border border-gray-300 rounded-lg py-2 px-3 text-sm sm:text-base"
                            />
                        </div>
                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Ders Notları</label>
                            <textarea
                                value={detailLessonNotes}
                                onChange={e => setDetailLessonNotes(e.target.value)}
                                placeholder="Ders notları..."
                                className="w-full border border-gray-300 rounded-lg py-2 px-3 h-24 sm:h-32 text-sm sm:text-base"
                            />
                        </div>
                        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4">
                            <button onClick={onClose} className="w-full sm:w-auto px-6 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 text-sm sm:text-base">
                                Vazgeç
                            </button>
                            <button onClick={handleSaveStudentDetail} className="w-full sm:w-auto px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark text-sm sm:text-base">
                                Kaydet
                            </button>
                        </div>
                    </div>
                )}

                {detailActiveTab === 'homework' && (
                    <div className="space-y-4">
                        <div className="flex bg-gray-100 p-1 rounded-xl mb-4">
                            <button
                                onClick={() => setProgramViewMode('past')}
                                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${programViewMode === 'past' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                ⏮ Geçen Haftanın Ödev Kontrolü
                            </button>
                            <button
                                onClick={() => setProgramViewMode('current')}
                                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${programViewMode === 'current' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                ⏭ Bu Haftanın Ödev Programı
                            </button>
                        </div>

                        {programViewMode === 'past' ? (
                            pastWeeklyProgram ? (
                                <EditableWeeklySchedule
                                    program={pastWeeklyProgram}
                                    onProgramUpdate={setPastWeeklyProgram}
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-gray-400 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                                    <p>Geçen haftaya ait bir program bulunamadı.</p>
                                </div>
                            )
                        ) : (
                            currentWeeklyProgram ? (
                                <EditableWeeklySchedule
                                    program={currentWeeklyProgram}
                                    onProgramUpdate={setCurrentWeeklyProgram}
                                    focusDay={DAYS_TR[(new Date(selectedLesson.startTime).getDay() + 6) % 7]}
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                                    <p>Haftalık program yükleniyor...</p>
                                </div>
                            )
                        )}
                        <div className="flex justify-end pt-4 border-t border-gray-100">
                            <button onClick={onClose} className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium">
                                Kapat
                            </button>
                        </div>
                    </div>
                )}

                {detailActiveTab === 'ai' && (
                    <div className="space-y-4 sm:space-y-6">
                        <div className="text-center">
                            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">Yapay Zeka Asistanı</h3>
                            <p className="text-sm sm:text-base text-gray-600">Mevcut konu ve notlarınıza göre ödev önerileri alın.</p>
                        </div>
                        {!aiSummary && !aiHomeworkSuggestions.length && (
                            <div className="text-center py-6">
                                <button
                                    onClick={handleGenerateAISuggestions}
                                    disabled={aiLoading || !detailTopic}
                                    className="px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl disabled:opacity-50 font-medium flex items-center space-x-2 mx-auto"
                                >
                                    {aiLoading ? 'Oluşturuluyor...' : 'Öneri Oluştur'}
                                </button>
                            </div>
                        )}
                        {aiSummary && (
                            <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 sm:p-5">
                                <h4 className="font-bold text-purple-900 mb-2 flex items-center">
                                    <span>✨ Konu Özeti</span>
                                </h4>
                                <p className="text-sm text-purple-800 leading-relaxed italic">{aiSummary}</p>
                            </div>
                        )}
                        {aiHomeworkSuggestions.length > 0 && (
                            <div className="space-y-3">
                                <h4 className="font-bold text-gray-800">📋 Ödev Önerileri</h4>
                                <div className="grid grid-cols-1 gap-3">
                                    {aiHomeworkSuggestions.map((suggestion, idx) => (
                                        <div key={idx} className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-3 sm:p-4 text-sm text-gray-700 flex justify-between items-center group">
                                            <span>{suggestion}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="pt-4 flex justify-end">
                                    <button
                                        onClick={handleApplyAISuggestions}
                                        className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all hover:scale-105"
                                    >
                                        Önerileri Haftalık Programa Uygula
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {detailActiveTab === 'attendance' && (
                    <div className="space-y-6">
                        <div className="bg-gray-50 p-4 rounded-xl space-y-4">
                            <label className="block text-sm font-medium text-gray-700">Ders Katılım Durumu</label>
                            <div className="grid grid-cols-3 gap-2">
                                {(['completed', 'missed', 'cancelled'] as const).map(status => (
                                    <button
                                        key={status}
                                        type="button"
                                        onClick={() => setAttendanceStatus(status)}
                                        className={`px-3 py-3 rounded-lg border-2 text-sm transition-all flex flex-col items-center justify-center gap-1 ${attendanceStatus === status
                                            ? status === 'completed' ? 'border-green-500 bg-green-50 text-green-700 font-semibold'
                                                : status === 'missed' ? 'border-red-500 bg-red-50 text-red-700 font-semibold'
                                                    : 'border-orange-500 bg-orange-50 text-orange-700 font-semibold'
                                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                                            }`}
                                    >
                                        <span className="text-lg">
                                            {status === 'completed' ? '✅' : status === 'missed' ? '❌' : '🚫'}
                                        </span>
                                        <span>
                                            {status === 'completed' ? 'Geldi' : status === 'missed' ? 'Gelmedi' : 'İptal'}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {attendanceStatus === 'completed' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                                <div className="space-y-4">
                                    <label className="block text-sm font-medium text-gray-700">Ödeme Durumu</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {(['paid', 'unpaid', 'partial'] as const).map(status => (
                                            <button
                                                key={status}
                                                type="button"
                                                onClick={() => setPaymentStatus(status)}
                                                className={`px-3 py-2 rounded-lg border-2 text-sm transition-all ${paymentStatus === status
                                                    ? status === 'paid' ? 'border-green-500 bg-green-50 text-green-700 font-semibold'
                                                        : status === 'unpaid' ? 'border-red-500 bg-red-50 text-red-700 font-semibold'
                                                            : 'border-yellow-500 bg-yellow-50 text-yellow-700 font-semibold'
                                                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                                                    }`}
                                            >
                                                {status === 'paid' ? '✓ Ödendi' : status === 'unpaid' ? '✗ Ödenmedi' : '◐ Kısmi'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Ücret (TL)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={paymentAmount}
                                            onChange={e => setPaymentAmount(e.target.value)}
                                            onFocus={e => e.target.select()}
                                            placeholder="0.00"
                                            className="w-full border border-gray-300 rounded-xl py-2 px-4 shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        />
                                        {studentPaymentConfig > 0 && (
                                            <p className="text-xs text-gray-500 mt-1 ml-1">
                                                Varsayılan: {studentPaymentConfig} TL
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Ödeme Tarihi</label>
                                        <input
                                            type="date"
                                            value={paymentDate}
                                            onChange={e => setPaymentDate(e.target.value)}
                                            className="w-full border border-gray-300 rounded-xl py-2 px-4 shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Ödeme Notları</label>
                                    <textarea
                                        value={paymentNotes}
                                        onChange={e => setPaymentNotes(e.target.value)}
                                        placeholder="Ödeme ile ilgili notlar..."
                                        className="w-full border border-gray-300 rounded-xl py-2 px-4 h-24 shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end pt-4 border-t border-gray-100">
                            <button
                                onClick={handleSaveAttendance}
                                className="w-full sm:w-auto px-8 py-3 bg-primary text-white rounded-xl hover:bg-primary-dark font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                Katılım Bilgisini Kaydet
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentDetailModal;
