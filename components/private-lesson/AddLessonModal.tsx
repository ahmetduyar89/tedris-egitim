import React from 'react';
import { Student, Subject } from '../../types';

interface AddLessonModalProps {
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    allStudents: Student[];
    formDay: string;
    setFormDay: (day: string) => void;
    formStudentId: string;
    setFormStudentId: (id: string) => void;
    formSubject: Subject;
    setFormSubject: (subject: Subject) => void;
    formTime: string;
    setFormTime: (time: string) => void;
    formDuration: number;
    setFormDuration: (duration: number) => void;
    formColor: string;
    setFormColor: (color: string) => void;
    DAYS_TR: string[];
    DURATION_OPTIONS: number[];
    COLORS: string[];
}

const AddLessonModal: React.FC<AddLessonModalProps> = ({
    onClose,
    onSubmit,
    allStudents,
    formDay,
    setFormDay,
    formStudentId,
    setFormStudentId,
    formSubject,
    setFormSubject,
    formTime,
    setFormTime,
    formDuration,
    setFormDuration,
    formColor,
    setFormColor,
    DAYS_TR,
    DURATION_OPTIONS,
    COLORS
}) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg sm:text-xl font-bold font-poppins mb-2">Yeni Ders Ekle</h3>
                <p className="text-xs sm:text-sm text-gray-500 mb-4">Programa ders ekle</p>

                <form onSubmit={onSubmit} className="space-y-3 sm:space-y-4">
                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Gün</label>
                        <select
                            value={formDay}
                            onChange={e => setFormDay(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg py-2 px-3 text-sm sm:text-base"
                        >
                            {DAYS_TR.map(day => (
                                <option key={day} value={day}>{day}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Öğrenci Seç</label>
                        <select
                            value={formStudentId}
                            onChange={e => setFormStudentId(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg py-2 px-3 text-sm sm:text-base"
                            required
                        >
                            <option value="">Öğrenci seçiniz...</option>
                            {allStudents.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Ders</label>
                        <select
                            value={formSubject}
                            onChange={e => setFormSubject(e.target.value as Subject)}
                            className="w-full border border-gray-300 rounded-lg py-2 px-3 text-sm sm:text-base"
                        >
                            {Object.values(Subject).map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Saat</label>
                            <input
                                type="time"
                                value={formTime}
                                onChange={e => setFormTime(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg py-2 px-3 text-sm sm:text-base"
                            />
                        </div>
                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Süre (Dk)</label>
                            <select
                                value={formDuration}
                                onChange={e => setFormDuration(parseInt(e.target.value))}
                                className="w-full border border-gray-300 rounded-lg py-2 px-3 text-sm sm:text-base"
                            >
                                {DURATION_OPTIONS.map(duration => (
                                    <option key={duration} value={duration}>{duration} dk</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Renk</label>
                        <div className="flex flex-wrap gap-2">
                            {COLORS.slice(0, 7).map(color => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => setFormColor(color)}
                                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 ${formColor === color ? 'border-gray-800 scale-110' : 'border-gray-200'} transition-transform`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row justify-between gap-2 sm:gap-0 pt-4">
                        <button type="button" onClick={onClose} className="w-full sm:w-auto px-6 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 text-sm sm:text-base">
                            İptal
                        </button>
                        <button type="submit" className="w-full sm:w-auto px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark text-sm sm:text-base">
                            Ekle
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddLessonModal;
