import React, { useState, useEffect } from 'react';
import { Student, TurkishContentLibraryItem } from '../types';
import { createTurkishContentAssignment } from '../services/turkishLearningService';
import { supabase } from '../services/dbAdapter';

interface AssignTurkishContentModalProps {
    isOpen: boolean;
    onClose: () => void;
    teacherId: string;
    students: Student[];
    onAssignmentCreated: () => void;
}

const AssignTurkishContentModal: React.FC<AssignTurkishContentModalProps> = ({
    isOpen,
    onClose,
    teacherId,
    students,
    onAssignmentCreated
}) => {
    const [category, setCategory] = useState<'vocabulary' | 'idiom' | 'proverb'>('vocabulary');
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [selectedContentIds, setSelectedContentIds] = useState<string[]>([]);
    const [dueDate, setDueDate] = useState('');
    const [availableContents, setAvailableContents] = useState<TurkishContentLibraryItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadContents();
            // Set default due date to 7 days from now
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);
            setDueDate(nextWeek.toISOString().split('T')[0]);
        }
    }, [isOpen, category]);

    const loadContents = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('turkish_content_library')
                .select('*')
                .eq('teacher_id', teacherId)
                .eq('category', category)
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
        if (!selectedStudentId) {
            alert('Lütfen bir öğrenci seçin!');
            return;
        }

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
            await createTurkishContentAssignment(
                teacherId,
                selectedStudentId,
                selectedContentIds,
                category,
                dueDate
            );

            alert('Atama başarıyla oluşturuldu!');
            onAssignmentCreated();
            handleClose();
        } catch (error) {
            console.error('Error creating assignment:', error);
            alert('Atama oluşturulurken bir hata oluştu.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setCategory('vocabulary');
        setSelectedStudentId('');
        setSelectedContentIds([]);
        setDueDate('');
        onClose();
    };

    if (!isOpen) return null;

    const getCategoryIcon = () => {
        switch (category) {
            case 'vocabulary': return '📖';
            case 'idiom': return '💬';
            case 'proverb': return '🎯';
        }
    };

    const getCategoryName = () => {
        switch (category) {
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
                        <h2 className="text-2xl font-bold">
                            {getCategoryIcon()} Türkçe İçerik Ata
                        </h2>
                        <button
                            onClick={handleClose}
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
                        {/* Category Selection */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Kategori
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                <button
                                    onClick={() => setCategory('vocabulary')}
                                    className={`p-4 rounded-lg border-2 transition-all ${category === 'vocabulary'
                                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                                            : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="text-3xl mb-1">📖</div>
                                    <div className="font-semibold">Kelime</div>
                                </button>
                                <button
                                    onClick={() => setCategory('idiom')}
                                    className={`p-4 rounded-lg border-2 transition-all ${category === 'idiom'
                                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                                            : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="text-3xl mb-1">💬</div>
                                    <div className="font-semibold">Deyim</div>
                                </button>
                                <button
                                    onClick={() => setCategory('proverb')}
                                    className={`p-4 rounded-lg border-2 transition-all ${category === 'proverb'
                                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                                            : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="text-3xl mb-1">🎯</div>
                                    <div className="font-semibold">Atasözü</div>
                                </button>
                            </div>
                        </div>

                        {/* Student Selection */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Öğrenci
                            </label>
                            <select
                                value={selectedStudentId}
                                onChange={(e) => setSelectedStudentId(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Öğrenci seçin...</option>
                                {students.map(student => (
                                    <option key={student.id} value={student.id}>
                                        {student.name}
                                    </option>
                                ))}
                            </select>
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
                                    Bu kategoride içerik bulunamadı. Önce içerik eklemelisiniz.
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
                            onClick={handleClose}
                            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                            disabled={isSubmitting}
                        >
                            İptal
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || selectedContentIds.length === 0 || !selectedStudentId}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Atanıyor...' : 'Ata'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssignTurkishContentModal;
