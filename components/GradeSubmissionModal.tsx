import React, { useState } from 'react';
import { Submission, AssignmentStatus, AIHomeworkAnalysis, Assignment } from '../types';
import { evaluateHomework } from '../services/geminiService';

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
                    {submission.fileUrl && <p><strong>Dosya:</strong> <a href="#" className="text-primary underline">{submission.fileUrl}</a></p>}
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