import React, { useState } from 'react';
import { BookQuestion } from '../types';
import { bulkCreateBookQuestions } from '../services/bookReadingService';

interface ManageBookQuestionsModalProps {
    bookId: string;
    bookTitle: string;
    existingQuestions: BookQuestion[];
    onClose: () => void;
    onSuccess: () => void;
}

const ManageBookQuestionsModal: React.FC<ManageBookQuestionsModalProps> = ({
    bookId,
    bookTitle,
    existingQuestions,
    onClose,
    onSuccess
}) => {
    const [questions, setQuestions] = useState<Array<{
        questionText: string;
        questionType: 'text' | 'multiple_choice' | 'yes_no' | 'rating';
        options?: string[];
        isRequired: boolean;
    }>>(existingQuestions.length > 0 ? existingQuestions.map(q => ({
        questionText: q.questionText,
        questionType: q.questionType,
        options: q.options,
        isRequired: q.isRequired
    })) : [{
        questionText: '',
        questionType: 'text',
        isRequired: true
    }]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const addQuestion = () => {
        setQuestions([...questions, {
            questionText: '',
            questionType: 'text',
            isRequired: true
        }]);
    };

    const removeQuestion = (index: number) => {
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const updateQuestion = (index: number, field: string, value: any) => {
        const updated = [...questions];
        updated[index] = { ...updated[index], [field]: value };

        // If changing to multiple_choice, initialize options
        if (field === 'questionType' && value === 'multiple_choice' && !updated[index].options) {
            updated[index].options = ['', '', '', ''];
        }

        setQuestions(updated);
    };

    const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
        const updated = [...questions];
        const options = [...(updated[questionIndex].options || [])];
        options[optionIndex] = value;
        updated[questionIndex].options = options;
        setQuestions(updated);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        for (const q of questions) {
            if (!q.questionText.trim()) {
                alert('Lütfen tüm soruları doldurun.');
                return;
            }
            if (q.questionType === 'multiple_choice') {
                if (!q.options || q.options.length < 2 || q.options.some(o => !o.trim())) {
                    alert('Çoktan seçmeli sorular için en az 2 seçenek gereklidir.');
                    return;
                }
            }
        }

        setIsSubmitting(true);
        try {
            await bulkCreateBookQuestions(bookId, questions);
            alert(`${questions.length} soru başarıyla eklendi!`);
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error creating questions:', error);
            alert('Sorular eklenirken bir hata oluştu: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const getQuestionTypeLabel = (type: string) => {
        switch (type) {
            case 'text': return 'Metin';
            case 'multiple_choice': return 'Çoktan Seçmeli';
            case 'yes_no': return 'Evet/Hayır';
            case 'rating': return 'Puanlama (1-5)';
            default: return type;
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Kitap Soruları</h2>
                        <p className="text-sm text-gray-600 mt-1">{bookTitle}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Info Box */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-700">
                            📝 Öğrencilerin kitabı okuduktan sonra cevaplaması için sorular oluşturun.
                            Karakterler, olay örgüsü, mekân ve zaman gibi konularda sorular sorabilirsiniz.
                        </p>
                    </div>

                    {/* Questions */}
                    <div className="space-y-6">
                        {questions.map((question, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="font-semibold text-gray-900">Soru {index + 1}</h3>
                                    {questions.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeQuestion(index)}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    )}
                                </div>

                                {/* Question Type */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Soru Tipi</label>
                                    <select
                                        value={question.questionType}
                                        onChange={(e) => updateQuestion(index, 'questionType', e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg p-2"
                                    >
                                        <option value="text">Metin (Uzun Cevap)</option>
                                        <option value="multiple_choice">Çoktan Seçmeli</option>
                                        <option value="yes_no">Evet/Hayır</option>
                                        <option value="rating">Puanlama (1-5)</option>
                                    </select>
                                </div>

                                {/* Question Text */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Soru</label>
                                    <textarea
                                        value={question.questionText}
                                        onChange={(e) => updateQuestion(index, 'questionText', e.target.value)}
                                        placeholder="Sorunuzu yazın..."
                                        rows={2}
                                        className="w-full border border-gray-300 rounded-lg p-2"
                                        required
                                    />
                                </div>

                                {/* Options for Multiple Choice */}
                                {question.questionType === 'multiple_choice' && (
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Seçenekler</label>
                                        <div className="space-y-2">
                                            {(question.options || ['', '', '', '']).map((option, optIndex) => (
                                                <input
                                                    key={optIndex}
                                                    type="text"
                                                    value={option}
                                                    onChange={(e) => updateOption(index, optIndex, e.target.value)}
                                                    placeholder={`Seçenek ${optIndex + 1}`}
                                                    className="w-full border border-gray-300 rounded-lg p-2"
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Required Checkbox */}
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={question.isRequired}
                                        onChange={(e) => updateQuestion(index, 'isRequired', e.target.checked)}
                                        className="mr-2"
                                    />
                                    <label className="text-sm text-gray-700">Zorunlu soru</label>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Add Question Button */}
                    <button
                        type="button"
                        onClick={addQuestion}
                        className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
                    >
                        + Yeni Soru Ekle
                    </button>

                    {/* Submit Button */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Kaydediliyor...' : `Soruları Kaydet (${questions.length})`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ManageBookQuestionsModal;
