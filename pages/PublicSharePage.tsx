import React, { useState, useEffect } from 'react';
import { ContentLibraryItem, ContentType, InteractiveContent } from '../types';
import { db } from '../services/dbAdapter';

interface PublicSharePageProps {
    shareToken: string;
}

const InteractiveContentRenderer: React.FC<{ interactiveContent: InteractiveContent }> = ({ interactiveContent }) => {
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [showFeedback, setShowFeedback] = useState<Record<string, boolean>>({});

    const handleAnswerChange = (id: string, value: any) => {
        if (showFeedback[id]) return;
        setAnswers(prev => ({ ...prev, [id]: value }));
    };

    const checkAnswer = (id: string) => {
        setShowFeedback(prev => ({ ...prev, [id]: true }));
    };

    return (
        <div className="space-y-6">
            {interactiveContent.components.map(comp => {
                const { id, type, content } = comp;
                const isChecked = showFeedback[id];

                return (
                    <div key={id} className="p-4 bg-white rounded-xl border-2 border-gray-200 shadow-sm">
                        {type === 'text' && <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: content.text.replace(/\n/g, '<br/>') }} />}

                        {type === 'mcq' && (
                            <div>
                                <p className="font-semibold text-lg mb-4">{content.question}</p>
                                <div className="space-y-3">
                                    {content.options.map((opt: string, i: number) => {
                                        const isCorrect = opt === content.answer;
                                        const isSelected = answers[id] === opt;
                                        let optionClass = "border-gray-300 bg-white hover:bg-gray-50";
                                        if (isChecked) {
                                            if (isCorrect) optionClass = "border-green-500 bg-green-50";
                                            else if (isSelected) optionClass = "border-red-500 bg-red-50";
                                        }
                                        return (
                                            <label key={i} className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${optionClass}`}>
                                                <input type="radio" name={`q-${id}`} value={opt} onChange={() => handleAnswerChange(id, opt)} disabled={isChecked} className="w-5 h-5" />
                                                <span className="ml-4 text-base">{opt}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                                {!isChecked && <button onClick={() => checkAnswer(id)} className="mt-4 px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors">Kontrol Et</button>}
                            </div>
                        )}

                        {type === 'fill-in-the-blank' && (
                            <div>
                                <p className="text-lg mb-4">{content.sentence.replace('___', '______')}</p>
                                <input type="text" onChange={e => handleAnswerChange(id, e.target.value)} disabled={isChecked} className="px-4 py-2 border-2 border-gray-300 rounded-lg w-full max-w-md" placeholder="Cevabınızı yazın..." />
                                {!isChecked && <button onClick={() => checkAnswer(id)} className="mt-4 px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors">Kontrol Et</button>}
                                {isChecked && <span className={`block mt-3 font-semibold text-lg ${answers[id] === content.answer ? 'text-green-600' : 'text-red-600'}`}>{answers[id] === content.answer ? '✓ Doğru!' : `✗ Yanlış (Doğrusu: ${content.answer})`}</span>}
                            </div>
                        )}

                        {type === 'true-false' && (
                            <div>
                                <p className="font-semibold text-lg mb-4">{content.statement}</p>
                                <div className="flex space-x-4">
                                    <button onClick={() => handleAnswerChange(id, true)} className={`px-8 py-3 rounded-lg border-2 font-semibold transition-all ${answers[id] === true ? 'border-primary bg-primary text-white' : 'border-gray-300 hover:border-primary'}`} disabled={isChecked}>Doğru</button>
                                    <button onClick={() => handleAnswerChange(id, false)} className={`px-8 py-3 rounded-lg border-2 font-semibold transition-all ${answers[id] === false ? 'border-primary bg-primary text-white' : 'border-gray-300 hover:border-primary'}`} disabled={isChecked}>Yanlış</button>
                                </div>
                                {!isChecked && <button onClick={() => checkAnswer(id)} className="mt-4 px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors">Kontrol Et</button>}
                                {isChecked && <span className={`block mt-3 font-semibold text-lg ${answers[id] === content.answer ? 'text-green-600' : 'text-red-600'}`}>{answers[id] === content.answer ? '✓ Doğru!' : `✗ Yanlış (Doğrusu: ${content.answer ? 'Doğru' : 'Yanlış'})`}</span>}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

const PublicSharePage: React.FC<PublicSharePageProps> = ({ shareToken }) => {
    const [contentItem, setContentItem] = useState<ContentLibraryItem | null>(null);
    const [interactiveContent, setInteractiveContent] = useState<InteractiveContent | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const htmlIframeRef = React.useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        loadSharedContent();
    }, [shareToken]);

    const loadSharedContent = async () => {
        try {
            setIsLoading(true);
            setError(null);

            console.log('[PublicSharePage] Loading content for token:', shareToken);
            console.log('[PublicSharePage] Current URL:', window.location.href);

            const shareSnapshot = await db.collection('publicContentShares')
                .where('shareToken', '==', shareToken)
                .where('isActive', '==', true)
                .get();

            console.log('[PublicSharePage] Share snapshot result:', shareSnapshot);
            console.log('[PublicSharePage] Number of shares found:', shareSnapshot.docs?.length || 0);

            if (shareSnapshot.empty) {
                console.error('[PublicSharePage] No active share found for token:', shareToken);
                setError('Bu paylaşım linki bulunamadı veya artık aktif değil.');
                setIsLoading(false);
                return;
            }

            const shareData = shareSnapshot.docs[0].data();
            console.log('[PublicSharePage] Share data:', shareData);

            if (shareData.expiresAt && new Date(shareData.expiresAt) < new Date()) {
                console.error('[PublicSharePage] Share link expired:', shareData.expiresAt);
                setError('Bu paylaşım linkinin süresi dolmuş.');
                setIsLoading(false);
                return;
            }

            console.log('[PublicSharePage] Fetching content with ID:', shareData.contentId);
            const contentDoc = await db.collection('contentLibrary').doc(shareData.contentId).get();
            console.log('[PublicSharePage] Content doc exists:', contentDoc.exists);
            console.log('[PublicSharePage] Content doc data:', contentDoc.exists ? contentDoc.data() : null);

            if (!contentDoc.exists) {
                console.error('[PublicSharePage] Content not found for ID:', shareData.contentId);
                setError('İçerik bulunamadı.');
                setIsLoading(false);
                return;
            }

            const content = { id: contentDoc.id, ...contentDoc.data() } as ContentLibraryItem;
            console.log('[PublicSharePage] Content loaded successfully:', {
                id: content.id,
                title: content.title,
                fileType: content.fileType,
                fileUrl: content.fileUrl,
                hasInteractiveContent: !!content.interactiveContentId
            });
            setContentItem(content);

            try {
                await db.collection('publicContentShares').doc(shareSnapshot.docs[0].id).update({
                    viewCount: (shareData.viewCount || 0) + 1,
                    lastViewedAt: new Date().toISOString()
                });
                console.log('[PublicSharePage] View count updated successfully');
            } catch (updateError) {
                console.warn('[PublicSharePage] Failed to update view count (non-critical):', updateError);
            }

            if (content.fileType === ContentType.Interactive && content.interactiveContentId) {
                console.log('[PublicSharePage] Loading interactive content:', content.interactiveContentId);
                const interactiveDoc = await db.collection('interactiveContent').doc(content.interactiveContentId).get();
                if (interactiveDoc.exists) {
                    const interactive = { id: interactiveDoc.id, ...interactiveDoc.data() } as InteractiveContent;
                    console.log('[PublicSharePage] Interactive content loaded:', interactive);
                    setInteractiveContent(interactive);
                } else {
                    console.warn('[PublicSharePage] Interactive content not found:', content.interactiveContentId);
                }
            }

            setIsLoading(false);
            console.log('[PublicSharePage] Content loading completed successfully');
        } catch (error) {
            console.error('[PublicSharePage] Error loading shared content:', error);
            if (error && typeof error === 'object') {
                console.error('[PublicSharePage] Error details:', {
                    message: (error as any).message,
                    code: (error as any).code,
                    details: (error as any).details,
                    hint: (error as any).hint,
                    stack: (error as any).stack
                });
            }
            setError(`İçerik yüklenirken bir hata oluştu: ${(error as any)?.message || 'Bilinmeyen hata'}`);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (contentItem && contentItem.fileType === ContentType.HTML && contentItem.htmlContent) {
            const timer = setTimeout(() => {
                const iframe = htmlIframeRef.current;
                if (iframe) {
                    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                    if (iframeDoc) {
                        // Check if content is already a full HTML document
                        const isFullDocument = contentItem.htmlContent.trim().toLowerCase().startsWith('<!doctype') ||
                            contentItem.htmlContent.trim().toLowerCase().startsWith('<html');

                        let htmlToRender;

                        if (isFullDocument) {
                            // Content is already a full HTML document, use it as-is
                            htmlToRender = contentItem.htmlContent;
                        } else {
                            // Content is HTML fragment, wrap it with default styling
                            htmlToRender = `
                                <!DOCTYPE html>
                                <html>
                                <head>
                                    <meta charset="UTF-8">
                                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                    <base href="about:blank">
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
                                    <script>
                                        // Suppress 404 errors from relative paths in console
                                        window.addEventListener('error', function(e) {
                                            if (e.target.tagName === 'IMG' || e.target.tagName === 'LINK' || e.target.tagName === 'SCRIPT') {
                                                e.preventDefault();
                                                console.warn('Resource not found (suppressed):', e.target.src || e.target.href);
                                            }
                                        }, true);
                                    </script>
                                </head>
                                <body>
                                    ${contentItem.htmlContent}
                                </body>
                                </html>
                            `;
                        }

                        iframeDoc.open();
                        iframeDoc.write(htmlToRender);
                        iframeDoc.close();
                    }
                }
            }, 100);

            return () => clearTimeout(timer);
        }
    }, [contentItem]);

    const renderContent = () => {
        if (!contentItem) return null;

        switch (contentItem.fileType) {
            case ContentType.PDF:
                return (
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
                        <iframe src={contentItem.fileUrl} className="w-full h-full border-0" title={contentItem.title}></iframe>
                    </div>
                );
            case ContentType.Video:
                return (
                    <div className="bg-black rounded-xl shadow-lg overflow-hidden flex items-center justify-center" style={{ minHeight: '600px' }}>
                        <video controls src={contentItem.fileUrl} className="max-w-full max-h-full rounded-lg"></video>
                    </div>
                );
            case ContentType.Image:
                return (
                    <div className="bg-white rounded-xl shadow-lg p-8 flex items-center justify-center" style={{ minHeight: '600px' }}>
                        <img src={contentItem.fileUrl} alt={contentItem.title} className="max-w-full max-h-full object-contain rounded-lg shadow-md" />
                    </div>
                );
            case ContentType.HTML:
                return (
                    <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 flex flex-col" style={{ minHeight: '70vh' }}>
                        <iframe
                            ref={htmlIframeRef}
                            className="w-full border-0 rounded-xl"
                            style={{ minHeight: '70vh', flexGrow: 1 }}
                            title={contentItem.title}
                            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
                        />
                    </div>
                );
            case ContentType.Interactive:
                return (
                    <div className="bg-white rounded-xl shadow-lg p-8">
                        {interactiveContent ? <InteractiveContentRenderer interactiveContent={interactiveContent} /> : <p className="text-center text-gray-600">Etkileşimli içerik bulunamadı.</p>}
                    </div>
                );
            default:
                return (
                    <div className="bg-white rounded-xl shadow-lg p-8">
                        <p className="text-center text-gray-600">Bu içerik türü görüntülenemiyor.</p>
                    </div>
                );
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
                    <p className="text-xl text-gray-700 font-semibold">İçerik yükleniyor...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-red-600 mx-auto mb-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                    </svg>
                    <h2 className="text-2xl font-bold text-gray-800 mb-3">Erişim Hatası</h2>
                    <p className="text-gray-600">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/10 to-accent/10">
            <div className="bg-white shadow-md sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-dark rounded-lg flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-white">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-800">{contentItem?.title}</h1>
                                <p className="text-sm text-gray-600">Paylaşılan İçerik</p>
                            </div>
                        </div>
                        {contentItem && (
                            <div className="flex items-center space-x-2 text-sm">
                                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-semibold">{contentItem.subject}</span>
                                <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full font-semibold">{contentItem.grade}. Sınıf</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {renderContent()}
            </div>
        </div>
    );
};

export default PublicSharePage;
