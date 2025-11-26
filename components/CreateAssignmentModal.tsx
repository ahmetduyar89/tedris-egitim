import React, { useState, useEffect } from 'react';
import { User, Student, Subject, Assignment, AssignmentType, Test } from '../types';
import { suggestHomework } from '../services/optimizedAIService';
import { db } from '../services/dbAdapter';

interface CreateAssignmentModalProps {
    user: User;
    student: Student;
    onClose: () => void;
    onAssign: (assignment: Assignment) => void;
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

    useEffect(() => {
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        setDueDate(nextWeek.toISOString().split('T')[0]);
    }, []);

    const handleAiSuggest = async () => {
        setIsAiLoading(true);
        try {
            const testsSnapshot = await db.collection('tests')
                .where('studentId', '==', student.id)
                .where('completed', '==', true)
                .get();

            let weakTopics = ['Genel Tekrar'];
            if (!testsSnapshot.empty) {
                const completedTests = testsSnapshot.docs.map((doc: any) => doc.data() as Test);
                completedTests.sort((a, b) => new Date(b.submissionDate!).getTime() - new Date(a.submissionDate!).getTime());

                const lastTest = completedTests[0];
                if (lastTest && lastTest.analysis?.analysis?.weakTopics && lastTest.analysis.analysis.weakTopics.length > 0) {
                    weakTopics = lastTest.analysis.analysis.weakTopics;
                }
            }

            const suggestions = await suggestHomework(student.grade, subject, weakTopics);
            if (suggestions.length > 0) {
                setTitle(suggestions[0].title);
                setDescription(suggestions[0].description);
            } else {
                alert("AI, bu öğrenci için şu anda bir ödev önerisi bulamadı.");
            }
        } catch (error) {
            console.error("Error getting AI homework suggestion:", error);
            alert("AI ödev önerisi oluşturulurken bir hata oluştu.");
        } finally {
            setIsAiLoading(false);
        }
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
                        <button type="button" onClick={onClose} className="bg-gray-500 text-white px-4 py-2 rounded-xl">İptal</button>
                        <button type="submit" className="bg-primary text-white px-4 py-2 rounded-xl">Ödevi Ata</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateAssignmentModal;