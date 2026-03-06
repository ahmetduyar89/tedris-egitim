import React, { useState } from 'react';
import { Submission, AssignmentStatus, AIHomeworkAnalysis, Assignment } from '../types';
import { evaluateHomework } from '../services/optimizedAIService';

interface GradeSubmissionModalProps {
    submission: Submission;
    assignment: Assignment;
    onClose: () => void;
    onGrade: (submission: Submission) => void;
}

const GradeSubmissionModal: React.FC<GradeSubmissionModalProps> = ({ submission, assignment, onClose, onGrade }) => {
    console.log('[GradeSubmissionModal] Rendering with submission:', submission);
    console.log('[GradeSubmissionModal] Assignment:', assignment);

    const [teacherScore, setTeacherScore] = useState<number | ''>(submission.teacherScore || '');
    const [teacherFeedback, setTeacherFeedback] = useState(submission.teacherFeedback || submission.aiAnalysis?.feedback || '');
    const [aiAnalysisResult, setAiAnalysisResult] = useState<AIHomeworkAnalysis | null>(submission.aiAnalysis || null);
    const [isAiLoading, setIsAiLoading] = useState(false);

    const handleAiEvaluate = async () => {
        setIsAiLoading(true);
        try {
            const { scorePercent, feedback, weakTopics } = await evaluateHomework(assignment.title, submission.submissionText || '');
            setTeacherScore(scorePercent);
            setTeacherFeedback(feedback);
            setAiAnalysisResult({ feedback, weakTopics });
        } catch (error) {
            alert("AI değerlendirmesi sırasında bir hata oluştu.");
        } finally {
            setIsAiLoading(false);
        }
    };

    const handleSubmit = () => {
        const gradedSubmission: Submission = {
            ...submission,
            teacherScore: Number(teacherScore),
            teacherFeedback,
            aiAnalysis: aiAnalysisResult || undefined,
            aiScore: aiAnalysisResult ? Number(teacherScore) : undefined,
            status: AssignmentStatus.Graded,
        };
        onGrade(gradedSubmission);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Ödev Değerlendirme</h2>
                    <button onClick={handleAiEvaluate} disabled={isAiLoading} className="bg-blue-100 text-primary px-3 py-1 rounded-lg text-sm font-semibold flex items-center disabled:opacity-50">
                        {isAiLoading ? 'Değerlendiriliyor...' : 'AI ile Değerlendir'}
                    </button>
                </div>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold">Öğrenci Teslimi</h3>
                    <p className="whitespace-pre-wrap border p-2 rounded bg-white">{submission.submissionText || "Metin teslimi yok."}</p>
                    {submission.fileUrl && (
                        <div className="mt-4 p-4 bg-white rounded-xl border border-gray-200">
                            <p className="font-semibold mb-2 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32a1.5 1.5 0 0 1-2.121-2.121l10.94-10.94" />
                                </svg>
                                Yüklenen Dosya
                            </p>
                            {['jpg', 'jpeg', 'png', 'webp'].some(ext => submission.fileUrl?.toLowerCase().endsWith(ext)) ? (
                                <div className="space-y-3">
                                    <img
                                        src={submission.fileUrl}
                                        alt="Öğrenci teslimi"
                                        className="max-w-full rounded-lg border shadow-sm max-h-[400px] object-contain mx-auto transition-transform hover:scale-[1.02]"
                                    />
                                    <div className="text-center">
                                        <a href={submission.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline font-medium">
                                            Tam Boyutlu Görüntüle
                                        </a>
                                    </div>
                                </div>
                            ) : (
                                <a href={submission.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-4 py-2 bg-blue-50 text-primary rounded-lg text-sm font-semibold hover:bg-blue-100 transition-colors">
                                    Dosyayı Yeni Sekmede Aç
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 ml-2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 11h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 4.5 10.5-10.5m0 0h-5.25m5.25 0V11" />
                                    </svg>
                                </a>
                            )}
                        </div>
                    )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Geri Bildirim</label>
                        <textarea value={teacherFeedback} onChange={e => setTeacherFeedback(e.target.value)} rows={3} className="w-full p-2 border rounded-lg" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Puan (0-100)</label>
                        <input type="number" value={teacherScore} onChange={e => setTeacherScore(e.target.value === '' ? '' : Number(e.target.value))} className="w-full p-2 border rounded-lg text-center" />
                    </div>
                </div>
                <div className="flex justify-end space-x-3 pt-4 mt-4 border-t">
                    <button type="button" onClick={onClose} className="bg-gray-500 text-white px-4 py-2 rounded-xl">İptal</button>
                    <button onClick={handleSubmit} className="bg-accent text-white px-4 py-2 rounded-xl">Notu Kaydet</button>
                </div>
            </div>
        </div>
    );
};

export default GradeSubmissionModal;