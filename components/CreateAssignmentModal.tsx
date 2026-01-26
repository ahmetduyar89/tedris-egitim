import React, { useState, useEffect } from 'react';
import { User, Student, Subject, Assignment, AssignmentType, Test, QuestionType, Difficulty } from '../types';
import { suggestHomework } from '../services/optimizedAIService';
import { db } from '../services/dbAdapter';

interface CreateAssignmentModalProps {
    user: User;
    student: Student;
    onClose: () => void;
    onAssign: (assignment: Assignment, whatsappWindow?: any) => void;
}

const CreateAssignmentModal: React.FC<CreateAssignmentModalProps> = ({ user, student, onClose, onAssign }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [subject, setSubject] = useState<Subject>(Subject.Mathematics);
    const [dueDate, setDueDate] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [contentType, setContentType] = useState<'pdf' | 'video' | 'image' | 'html' | ''>('');
    const [fileUrl, setFileUrl] = useState('');
    const [htmlContent, setHtmlContent] = useState('');
    const [aiSuggestions, setAiSuggestions] = useState<{ title: string, questions: any[] } | null>(null);


    useEffect(() => {
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        setDueDate(nextWeek.toISOString().split('T')[0]);
    }, []);

    const handleAiSuggest = async () => {
        setIsAiLoading(true);
        try {
            // 1. Load last 3 tests
            const testsSnapshot = await db.collection('tests')
                .where('studentId', '==', student.id)
                .where('completed', '==', true)
                .orderBy('submissionDate', 'desc')
                .limit(3)
                .get();

            let weakTopicsCount: { [key: string]: number } = {};

            if (!testsSnapshot.empty) {
                testsSnapshot.docs.forEach((doc: any) => {
                    const test = doc.data() as Test;
                    const topics = test.analysis?.analysis?.weakTopics || [];
                    topics.forEach((t: string) => {
                        weakTopicsCount[t] = (weakTopicsCount[t] || 0) + 1;
                    });
                });
            }

            // Get top weak topic
            const sortedWeakTopics = Object.entries(weakTopicsCount).sort((a, b) => b[1] - a[1]);
            const topWeakTopic = sortedWeakTopics.length > 0 ? sortedWeakTopics[0][0] : 'Genel Tekrar';

            // 2. Generate 5 targeted questions
            const { generateTestQuestions } = await import('../services/optimizedAIService');
            const questions = await generateTestQuestions(
                student.grade,
                [{ subject, unit: topWeakTopic, count: 5 }],
                QuestionType.MultipleChoice,
                Difficulty.Medium
            );

            setAiSuggestions({
                title: `${topWeakTopic} Odaklı Gelişim Çalışması`,
                questions: questions
            });

        } catch (error) {
            console.error("Error in Hybrid Homework Suggestion:", error);
            alert("AI önerisi hazırlanırken bir hata oluştu.");
        } finally {
            setIsAiLoading(false);
        }
    };

    const addSuggestedQuestions = () => {
        if (!aiSuggestions) return;

        const questionsText = aiSuggestions.questions.map((q: any, i: number) => (
            `${i + 1}. SORU: ${q.questionText}\n   Seçenekler: ${q.options.join(', ')}\n`
        )).join('\n');

        setDescription(prev => prev + (prev ? '\n\n' : '') +
            `🤖 AI ÖNERİSİ: Bu öğrencinin son testlerindeki '${aiSuggestions.title.split(' ')[0]}' eksiği için özel sorular:\n\n` +
            questionsText);

        if (!title) setTitle(aiSuggestions.title);
        setAiSuggestions(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const newAssignment: Omit<Assignment, 'id'> & { id?: string } = {
            teacherId: user.id,
            studentId: student.id,
            subject,
            title,
            description,
            dueDate,
            aiSuggested: false,
            createdAt: new Date().toISOString(),
            viewedByStudent: false,
            contentType: contentType || undefined,
            fileUrl: contentType && contentType !== 'html' ? fileUrl : undefined,
            htmlContent: contentType === 'html' ? htmlContent : undefined,
        };
        // @ts-ignore - passing extra prop for notification handling
        onAssign(newAssignment as Assignment);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Yeni Ödev Oluştur</h2>
                    <button onClick={handleAiSuggest} disabled={isAiLoading} className="bg-blue-100 text-primary px-3 py-1 rounded-lg text-sm font-semibold flex items-center disabled:opacity-50">
                        {isAiLoading ? 'Öneriliyor...' : 'AI Ödev Öner'}
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" placeholder="Ödev Başlığı" value={title} onChange={e => setTitle(e.target.value)} required className="w-full p-2 border rounded-lg" />
                    <textarea placeholder="Açıklama" value={description} onChange={e => setDescription(e.target.value)} required rows={4} className="w-full p-2 border rounded-lg" />
                    <div className="grid grid-cols-2 gap-4">
                        <select value={subject} onChange={e => setSubject(e.target.value as Subject)} className="w-full p-2 border rounded-lg">
                            {Object.values(Subject).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} required className="w-full p-2 border rounded-lg" />
                    </div>

                    <div className="border-t pt-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Ek İçerik (Opsiyonel)</label>
                        <select
                            value={contentType}
                            onChange={e => {
                                const newType = e.target.value as typeof contentType;
                                setContentType(newType);
                                setFileUrl('');
                                setHtmlContent('');
                            }}
                            className="w-full p-2 border rounded-lg mb-3"
                        >
                            <option value="">İçerik Yok</option>
                            <option value="pdf">PDF</option>
                            <option value="video">Video</option>
                            <option value="image">Resim</option>
                            <option value="html">HTML İçerik</option>
                        </select>

                        {contentType && contentType !== 'html' && (
                            <input
                                type="text"
                                placeholder={`${contentType.toUpperCase()} URL'si`}
                                value={fileUrl}
                                onChange={e => setFileUrl(e.target.value)}
                                className="w-full p-2 border rounded-lg"
                                required
                            />
                        )}

                        {contentType === 'html' && (
                            <textarea
                                placeholder="HTML kodunu buraya yapıştırın..."
                                value={htmlContent}
                                onChange={e => setHtmlContent(e.target.value)}
                                className="w-full p-2 border rounded-lg h-32 font-mono text-sm"
                                required
                            />
                        )}
                    </div>
                    <div className="flex justify-end space-x-3 pt-4">
                        <div className="flex-1 flex items-center mr-4">
                        </div>
                        <button type="button" onClick={onClose} className="bg-gray-500 text-white px-4 py-2 rounded-xl">İptal</button>
                        <button type="submit" className="bg-primary text-white px-4 py-2 rounded-xl">Ödevi Ata</button>
                    </div>
                </form>

                {/* Hybrid Homework AI Suggestion Overlay/Section */}
                {aiSuggestions && (
                    <div className="mt-6 pt-6 border-t border-blue-100 animate-fade-in">
                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-xl">🤖</span>
                                <h3 className="font-bold text-blue-900">AI Hibrit Ödev Önerisi</h3>
                            </div>
                            <p className="text-sm text-blue-800 mb-4">
                                Öğrencinin son 3 testini analiz ettim. <b>{aiSuggestions.title.split(' ')[0]}</b> konusunda eksikleri var.
                                Senin için bu eksiklere nokta atışı 5 pratik sorusu hazırladım.
                            </p>

                            <div className="space-y-3 mb-4">
                                {aiSuggestions.questions.slice(0, 2).map((q, i) => (
                                    <div key={i} className="text-xs bg-white/50 p-2 rounded border border-blue-50 text-gray-600 line-clamp-2 italic">
                                        Q{i + 1}: {q.questionText}
                                    </div>
                                ))}
                                {aiSuggestions.questions.length > 2 && (
                                    <div className="text-[10px] text-blue-400 text-center">+ {aiSuggestions.questions.length - 2} soru daha...</div>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={addSuggestedQuestions}
                                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors"
                                >
                                    Ekle ve Devam Et
                                </button>
                                <button
                                    onClick={() => setAiSuggestions(null)}
                                    className="px-4 py-2 text-blue-600 text-sm font-medium hover:bg-blue-100 rounded-lg transition-colors"
                                >
                                    Yoksay
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreateAssignmentModal;