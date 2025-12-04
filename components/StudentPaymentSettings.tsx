import React, { useState, useEffect } from 'react';
import { StudentPaymentConfig } from '../types';
import * as privateLessonService from '../services/privateLessonService';

interface StudentPaymentSettingsProps {
    studentId: string;
    teacherId: string;
    initialConfig: StudentPaymentConfig | null;
    onUpdate: (config: StudentPaymentConfig) => void;
}

const StudentPaymentSettings: React.FC<StudentPaymentSettingsProps> = ({ studentId, teacherId, initialConfig, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [fee, setFee] = useState<string>('0');
    const [notes, setNotes] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (initialConfig) {
            setFee(initialConfig.perLessonFee.toString());
            setNotes(initialConfig.notes || '');
        }
    }, [initialConfig]);

    const handleSave = async () => {
        setIsLoading(true);
        try {
            await privateLessonService.setStudentPaymentConfig(
                studentId,
                teacherId,
                parseFloat(fee) || 0,
                'TL',
                notes
            );
            const newConfig = await privateLessonService.getStudentPaymentConfig(studentId, teacherId);
            if (newConfig) {
                onUpdate(newConfig);
            }
            setIsEditing(false);
        } catch (error) {
            console.error('Error saving payment config:', error);
            alert('Ücret ayarları kaydedilirken bir hata oluştu.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        if (initialConfig) {
            setFee(initialConfig.perLessonFee.toString());
            setNotes(initialConfig.notes || '');
        } else {
            setFee('0');
            setNotes('');
        }
    };

    return (
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-6 rounded-xl shadow-md border border-yellow-200">
            <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <svg className="w-6 h-6 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Ücret Ayarları
            </h4>

            {isEditing ? (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Ders Başı Ücret (TL)</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={fee}
                            onChange={e => setFee(e.target.value)}
                            onFocus={e => e.target.select()}
                            className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-all"
                            placeholder="0.00"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Notlar</label>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg py-2 px-3 h-20 focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-all"
                            placeholder="Ücret ile ilgili notlar..."
                        />
                    </div>
                    <div className="flex space-x-3">
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={isLoading}
                            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 transition-colors"
                        >
                            {isLoading ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                        <button
                            type="button"
                            onClick={handleCancel}
                            disabled={isLoading}
                            className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 font-medium disabled:opacity-50 transition-colors"
                        >
                            İptal
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    {initialConfig ? (
                        <>
                            <div className="flex justify-between items-center bg-white/50 p-3 rounded-lg">
                                <span className="text-gray-700">Ders Başı Ücret:</span>
                                <span className="font-bold text-gray-900 text-lg">{initialConfig.perLessonFee} {initialConfig.currency}</span>
                            </div>
                            {initialConfig.notes && (
                                <div className="bg-white rounded-lg p-3 border border-yellow-200">
                                    <p className="text-sm text-gray-600 italic">{initialConfig.notes}</p>
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={() => setIsEditing(true)}
                                className="w-full bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 font-medium transition-colors shadow-sm"
                            >
                                Düzenle
                            </button>
                        </>
                    ) : (
                        <div className="text-center py-4">
                            <p className="text-gray-600 mb-3">Henüz ücret ayarı yapılmamış</p>
                            <button
                                type="button"
                                onClick={() => setIsEditing(true)}
                                className="bg-yellow-600 text-white px-6 py-2 rounded-lg hover:bg-yellow-700 font-medium transition-colors shadow-sm"
                            >
                                Ücret Ayarla
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default StudentPaymentSettings;
