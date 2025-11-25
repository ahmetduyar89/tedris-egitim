import React, { useState } from 'react';
import { Assignment, Submission, AssignmentStatus } from '../types';
import { db } from '../services/dbAdapter';

interface SubmitHomeworkPageProps {
    assignment: Assignment;
    onBack: () => void;
    onSubmit: (submission: Submission) => void;
}

const SubmitHomeworkPage: React.FC<SubmitHomeworkPageProps> = ({ assignment, onBack, onSubmit }) => {
    const [submissionText, setSubmissionText] = useState(assignment.submission?.submissionText || '');
    const [file, setFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isHtmlModalOpen, setIsHtmlModalOpen] = useState(false);
    const htmlIframeRef = React.useRef<HTMLIFrameElement>(null);
    const modalHtmlIframeRef = React.useRef<HTMLIFrameElement>(null);

    const renderHtmlContent = (iframeRef: React.RefObject<HTMLIFrameElement>) => {
        if (assignment.contentType === 'html' && assignment.htmlContent && iframeRef.current) {
            const iframe = iframeRef.current;
            const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
            if (iframeDoc) {
                const htmlWithDefaults = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <style>
                            body {
                                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
                                line-height: 1.6;
                                color: #333;
                                padding: 20px;
                                margin: 0;
                                background: white;
                            }
                            h1, h2, h3, h4, h5, h6 {
                                margin-top: 24px;
                                margin-bottom: 16px;
                                font-weight: 600;
                                line-height: 1.25;
                            }
                            h1 { font-size: 2em; border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; }
                            h2 { font-size: 1.5em; border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; }
                            h3 { font-size: 1.25em; }
                            p { margin-bottom: 16px; }
                            img { max-width: 100%; height: auto; }
                            table { border-collapse: collapse; width: 100%; margin-bottom: 16px; }
                            table th, table td { border: 1px solid #dfe2e5; padding: 8px 13px; }
                            table th { background-color: #f6f8fa; font-weight: 600; }
                            code {
                                background-color: #f6f8fa;
                                padding: 2px 6px;
                                border-radius: 3px;
                                font-family: 'Courier New', monospace;
                            }
                            pre {
                                background-color: #f6f8fa;
                                padding: 16px;
                                border-radius: 6px;
                                overflow-x: auto;
                                margin-bottom: 16px;
                            }
                            pre code {
                                background: none;
                                padding: 0;
                            }
                            ul, ol { margin-bottom: 16px; padding-left: 2em; }
                            li { margin-bottom: 4px; }
                            blockquote {
                                border-left: 4px solid #dfe2e5;
                                padding-left: 16px;
                                margin-left: 0;
                                color: #6a737d;
                            }
                            a { color: #0366d6; text-decoration: none; }
                            a:hover { text-decoration: underline; }
                        </style>
                    </head>
                    <body>
                        ${assignment.htmlContent}
                    </body>
                    </html>
                `;
                iframeDoc.open();
                iframeDoc.write(htmlWithDefaults);
                iframeDoc.close();
            }
        }
    };

    React.useEffect(() => {
        const timer = setTimeout(() => {
            renderHtmlContent(htmlIframeRef);
        }, 100);
        return () => clearTimeout(timer);
    }, [assignment]);

    React.useEffect(() => {
        if (isHtmlModalOpen) {
            const timer = setTimeout(() => {
                renderHtmlContent(modalHtmlIframeRef);
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [isHtmlModalOpen, assignment]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!submissionText.trim() && !file) {
            alert("Lütfen bir cevap yazın veya bir dosya yükleyin.");
            return;
        }
        setIsSubmitting(true);

        const newSubmission: Submission = {
            id: `sub-${Date.now()}`,
            assignmentId: assignment.id,
            studentId: assignment.studentId,
            submissionText,
            fileUrl: file ? `/${file.name}` : undefined,
            submittedAt: new Date().toISOString(),
            status: AssignmentStatus.Submitted,
        };

        try {
            await db.collection('submissions').add({
                assignment_id: assignment.id,
                student_id: assignment.studentId,
                submission_text: submissionText,
                file_url: file ? `/${file.name}` : null,
                submitted_at: new Date().toISOString(),
                status: AssignmentStatus.Submitted
            });
            onSubmit(newSubmission);
        } catch (error) {
            console.error("Error submitting homework:", error);
            alert("Ödev teslim edilirken bir hata oluştu.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-background">
            <header className="bg-card-background shadow-md p-4 flex items-center z-10">
                <button onClick={onBack} className="text-primary hover:text-primary-dark mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
                </button>
                <h1 className="text-xl font-bold text-text-primary">Ödev Teslim</h1>
            </header>

            <main className="flex-grow p-4 md:p-8 overflow-y-auto">
                <div className="max-w-3xl mx-auto bg-card-background p-6 rounded-2xl shadow-lg">
                    <div className="border-b pb-4 mb-6">
                        <h2 className="text-2xl font-bold text-text-primary">{assignment.title}</h2>
                        <p className="text-sm text-text-secondary mt-1">{assignment.subject} &middot; Teslim Tarihi: {new Date(assignment.dueDate).toLocaleDateString('tr-TR')}</p>
                        <p className="mt-4 text-gray-700 whitespace-pre-wrap">{assignment.description}</p>

                        {assignment.contentType && (
                            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                                    </svg>
                                    Ek İçerik
                                </h3>
                                {assignment.contentType === 'pdf' && assignment.fileUrl && (
                                    <iframe src={assignment.fileUrl} className="w-full h-96 border-0 rounded-lg" title="PDF İçerik"></iframe>
                                )}
                                {assignment.contentType === 'video' && assignment.fileUrl && (
                                    <video controls src={assignment.fileUrl} className="w-full rounded-lg max-h-96"></video>
                                )}
                                {assignment.contentType === 'image' && assignment.fileUrl && (
                                    <img src={assignment.fileUrl} alt="Ödev İçeriği" className="w-full rounded-lg" />
                                )}
                                {assignment.contentType === 'html' && assignment.htmlContent && (
                                    <>
                                        <div className="relative">
                                            <iframe
                                                ref={htmlIframeRef}
                                                className="w-full border-0 rounded-lg bg-white"
                                                style={{ minHeight: '500px', height: '500px' }}
                                                title="HTML İçerik"
                                                sandbox="allow-scripts allow-same-origin allow-forms"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setIsHtmlModalOpen(true)}
                                            className="mt-3 w-full bg-primary text-white py-2 px-4 rounded-lg font-semibold hover:bg-primary-dark transition-colors flex items-center justify-center"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                                            </svg>
                                            Tam Ekranda Görüntüle
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-lg font-semibold text-gray-800 mb-2">Cevabın</label>
                            <textarea
                                value={submissionText}
                                onChange={e => setSubmissionText(e.target.value)}
                                rows={8}
                                className="w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-primary focus:border-primary"
                                placeholder="Cevabını buraya yaz..."
                                disabled={!!assignment.submission}
                            />
                        </div>
                        <div>
                             <label className="block text-lg font-semibold text-gray-800 mb-2">Dosya Yükle (Opsiyonel)</label>
                             <input 
                                type="file" 
                                onChange={e => setFile(e.target.files ? e.target.files[0] : null)}
                                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-primary hover:file:bg-blue-100"
                                disabled={!!assignment.submission}
                            />
                        </div>
                        
                        {!assignment.submission && (
                            <div className="text-right pt-4">
                                <button type="submit" disabled={isSubmitting} className="bg-accent text-white font-bold py-3 px-8 rounded-xl hover:bg-green-700 disabled:bg-gray-400 transition-colors">
                                    {isSubmitting ? 'Teslim Ediliyor...' : 'Ödevi Teslim Et'}
                                </button>
                            </div>
                        )}
                         {assignment.submission && assignment.submission.status === AssignmentStatus.Submitted && (
                             <div className="p-4 bg-blue-50 text-blue-800 rounded-lg text-center font-semibold">
                                 Bu ödevi {new Date(assignment.submission.submittedAt).toLocaleString('tr-TR')} tarihinde teslim ettin. Değerlendirme bekleniyor...
                             </div>
                         )}
                         {assignment.submission && assignment.submission.status === AssignmentStatus.Graded && (
                             <div className="space-y-4 mt-6">
                                 <div className="p-6 bg-green-50 rounded-lg border-2 border-green-200">
                                     <div className="flex items-center justify-between mb-4">
                                         <h3 className="text-xl font-bold text-green-800">Değerlendirme Tamamlandı</h3>
                                         <span className="text-3xl font-bold text-green-600">
                                             {assignment.submission.teacherScore ?? assignment.submission.aiScore}%
                                         </span>
                                     </div>
                                     {assignment.submission.teacherFeedback && (
                                         <div className="mt-4 p-4 bg-white rounded-lg">
                                             <h4 className="font-semibold text-gray-800 mb-2">Öğretmen Geri Bildirimi:</h4>
                                             <p className="text-gray-700 whitespace-pre-wrap">{assignment.submission.teacherFeedback}</p>
                                         </div>
                                     )}
                                     {assignment.submission.aiAnalysis && assignment.submission.aiAnalysis.weakTopics && assignment.submission.aiAnalysis.weakTopics.length > 0 && (
                                         <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                                             <h4 className="font-semibold text-yellow-800 mb-2">Geliştirilmesi Gereken Konular:</h4>
                                             <ul className="list-disc list-inside space-y-1">
                                                 {assignment.submission.aiAnalysis.weakTopics.map((topic, i) => (
                                                     <li key={i} className="text-yellow-700">{topic}</li>
                                                 ))}
                                             </ul>
                                         </div>
                                     )}
                                 </div>
                             </div>
                         )}

                    </form>
                </div>
            </main>

            {/* HTML İçerik Tam Ekran Modal */}
            {isHtmlModalOpen && assignment.contentType === 'html' && assignment.htmlContent && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 animate-fade-in"
                    onClick={() => setIsHtmlModalOpen(false)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full h-full max-w-7xl max-h-[95vh] flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex-shrink-0 flex justify-between items-center p-4 border-b bg-gray-50 rounded-t-2xl">
                            <h2 className="text-xl font-bold text-text-primary flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-2 text-primary">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
                                </svg>
                                HTML İçerik - Tam Ekran
                            </h2>
                            <button
                                onClick={() => setIsHtmlModalOpen(false)}
                                className="text-gray-500 hover:text-gray-800 text-3xl font-bold w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                &times;
                            </button>
                        </div>
                        <div className="flex-grow overflow-hidden p-4">
                            <iframe
                                ref={modalHtmlIframeRef}
                                className="w-full h-full border-0 rounded-lg bg-white shadow-inner"
                                title="HTML İçerik Tam Ekran"
                                sandbox="allow-scripts allow-same-origin allow-forms"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubmitHomeworkPage;