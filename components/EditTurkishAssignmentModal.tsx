import React, { useState, useEffect } from 'react';
import { TurkishContentAssignment, TurkishContentLibraryItem } from '../types';
import { updateTurkishContentAssignment } from '../services/turkishLearningService';
import { supabase } from '../services/dbAdapter';

interface EditTurkishAssignmentModalProps {
    assignment: TurkishContentAssignment & { studentName: string };
    teacherId: string;
    onClose: () => void;
    onSuccess: () => void;
}

const EditTurkishAssignmentModal: React.FC<EditTurkishAssignmentModalProps> = ({
    assignment,
    teacherId,
    onClose,
    onSuccess
}) => {
    const [selectedContentIds, setSelectedContentIds] = useState<string[]>(assignment.contentIds);
    const [dueDate, setDueDate] = useState(assignment.dueDate.split('T')[0]);
    const [availableContents, setAvailableContents] = useState<TurkishContentLibraryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadContents();
    }, []);

    const loadContents = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('turkish_content_library')
                .select('*')
                .eq('teacher_id', teacherId)
                .eq('category', assignment.category)
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const mappedContents: TurkishContentLibraryItem[] = data.map((item: any) => ({
                id: item.id,
                teacherId: item.teacher_id,
                category: item.category,
                frontContent: item.front_content,
                backContent: item.back_content,
                exampleSentence: item.example_sentence,
                difficultyLevel: item.difficulty_level,
                isAiGenerated: item.is_ai_generated,
                createdAt: item.created_at,
                isActive: item.is_active
            }));

            setAvailableContents(mappedContents);
        } catch (error) {
            console.error('Error loading contents:', error);
            alert('İçerikler yüklenirken bir hata oluştu.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleContentToggle = (contentId: string) => {
        if (selectedContentIds.includes(contentId)) {
            setSelectedContentIds(selectedContentIds.filter(id => id !== contentId));
        } else {
            setSelectedContentIds([...selectedContentIds, contentId]);
        }
    };

    const handleSelectAll = () => {
        if (selectedContentIds.length === availableContents.length) {
            setSelectedContentIds([]);
        } else {
            setSelectedContentIds(availableContents.map(c => c.id));
        }
    };

    const handleSubmit = async () => {
        if (selectedContentIds.length === 0) {
            alert('Lütfen en az bir içerik seçin!');
            return;
        }

        if (!dueDate) {
            alert('Lütfen bir son tarih seçin!');
            return;
        }

        setIsSubmitting(true);
        try {
            await updateTurkishContentAssignment(assignment.id, {
                contentIds: selectedContentIds,
                dueDate
            });

            alert('Atama başarıyla güncellendi!');
            onSuccess();
        } catch (error) {
            console.error('Error updating assignment:', error);
            alert('Atama güncellenirken bir hata oluştu.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getCategoryIcon = () => {
        switch (assignment.category) {
            case 'vocabulary': return '📖';
            case 'idiom': return '💬';
            case 'proverb': return '🎯';
        }
    };

    const getCategoryName = () => {
        switch (assignment.category) {
            case 'vocabulary': return 'Kelime';
            case 'idiom': return 'Deyim';
            case 'proverb': return 'Atasözü';
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold">
                                {getCategoryIcon()} Atamayı Düzenle
                            </h2>
                            <p className="text-blue-100 mt-1">
                                {assignment.studentName} - {getCategoryName()}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:text-gray-200 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-6">
                        {/* Info Box */}
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="flex gap-2">
                                <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <div>
                                    <p className="text-sm font-semibold text-yellow-800">Önemli Not</p>
                                    <p className="text-sm text-yellow-700 mt-1">
                                        İçerik değişikliği yaparsanız, öğrencinin öğrenme ilerlemesi sıfırlanacaktır.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Due Date */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Son Tarih
                            </label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Content Selection */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-semibold text-gray-700">
                                    İçerik Seçimi ({selectedContentIds.length} seçili)
                                </label>
                                <button
                                    onClick={handleSelectAll}
                                    className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
                                >
                                    {selectedContentIds.length === availableContents.length ? 'Tümünü Kaldır' : 'Tümünü Seç'}
                                </button>
                            </div>

                            {isLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                </div>
                            ) : availableContents.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    Bu kategoride içerik bulunamadı.
                                </div>
                            ) : (
                                <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                                    {availableContents.map(content => (
                                        <label
                                            key={content.id}
                                            className="flex items-start gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedContentIds.includes(content.id)}
                                                onChange={() => handleContentToggle(content.id)}
                                                className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="font-semibold text-gray-900">
                                                    {content.frontContent}
                                                </div>
                                                <div className="text-sm text-gray-600 mt-1">
                                                    {content.backContent}
                                                </div>
                                                {content.exampleSentence && (
                                                    <div className="text-xs text-gray-500 mt-1 italic">
                                                        Örnek: {content.exampleSentence}
                                                    </div>
                                                )}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 p-6 bg-gray-50">
                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                            disabled={isSubmitting}
                        >
                            İptal
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || selectedContentIds.length === 0}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Güncelleniyor...' : 'Güncelle'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditTurkishAssignmentModal;
