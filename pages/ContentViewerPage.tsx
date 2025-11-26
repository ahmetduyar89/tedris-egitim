import React, { useState, useEffect } from 'react';
import { ContentLibraryItem, ContentType, InteractiveContent, User } from '../types';
import { db } from '../services/dbAdapter';

interface ContentViewerPageProps {
    contentId: string;
    user: User;
    onBack: () => void;
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
                    <div key={id} className="p-4 bg-gray-50 rounded-lg border">
                        {type === 'text' && <div className="prose" dangerouslySetInnerHTML={{ __html: content.text.replace(/\n/g, '<br/>') }} />}

                        {type === 'mcq' && (
                            <div>
                                <p className="font-semibold mb-3">{content.question}</p>
                                <div className="space-y-2">
                                    {content.options.map((opt: string, i: number) => {
                                        const isCorrect = opt === content.answer;
                                        const isSelected = answers[id] === opt;
                                        let optionClass = "border-gray-300 bg-white hover:bg-gray-100";
                                        if (isChecked) {
                                            if (isCorrect) optionClass = "border-success bg-green-50";
                                            else if (isSelected) optionClass = "border-error bg-red-50";
                                        }
                                        return (
                                            <label key={i} className={`flex items-center p-3 border rounded-lg cursor-pointer ${optionClass}`}>
                                                <input type="radio" name={`q-${id}`} value={opt} onChange={() => handleAnswerChange(id, opt)} disabled={isChecked} />
                                                <span className="ml-3">{opt}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                                {!isChecked && <button onClick={() => checkAnswer(id)} className="mt-3 text-sm bg-primary text-white px-3 py-1 rounded-md">Kontrol Et</button>}
                            </div>
                        )}

                        {type === 'fill-in-the-blank' && (
                            <div>
                                <p className="mb-3">{content.sentence.replace('___', '______')}</p>
                                <input type="text" onChange={e => handleAnswerChange(id, e.target.value)} disabled={isChecked} className="p-2 border rounded-md" />
                                {!isChecked && <button onClick={() => checkAnswer(id)} className="ml-2 text-sm bg-primary text-white px-3 py-1 rounded-md">Kontrol Et</button>}
                                {isChecked && <span className={`ml-2 font-semibold ${answers[id] === content.answer ? 'text-success' : 'text-error'}`}>{answers[id] === content.answer ? 'Doğru!' : `Yanlış (Doğrusu: ${content.answer})`}</span>}
                            </div>
                        )}

                        {type === 'true-false' && (
                            <div>
                                <p className="font-semibold mb-3">{content.statement}</p>
                                <div className="flex space-x-4">
                                    <button onClick={() => handleAnswerChange(id, true)} className={`p-2 rounded-lg border-2 ${answers[id] === true ? 'border-primary' : ''}`}>Doğru</button>
                                    <button onClick={() => handleAnswerChange(id, false)} className={`p-2 rounded-lg border-2 ${answers[id] === false ? 'border-primary' : ''}`}>Yanlış</button>
                                </div>
                                {!isChecked && <button onClick={() => checkAnswer(id)} className="mt-3 text-sm bg-primary text-white px-3 py-1 rounded-md">Kontrol Et</button>}
                                {isChecked && <span className={`ml-2 font-semibold ${answers[id] === content.answer ? 'text-success' : 'text-error'}`}>{answers[id] === content.answer ? 'Doğru!' : `Yanlış (Doğrusu: ${content.answer ? 'Doğru' : 'Yanlış'})`}</span>}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

const ContentViewerPage: React.FC<ContentViewerPageProps> = ({ contentId, user, onBack }) => {
    const [contentItem, setContentItem] = useState<ContentLibraryItem | null>(null);
    const [interactiveContent, setInteractiveContent] = useState<InteractiveContent | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const htmlIframeRef = React.useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        loadContent();
    }, [contentId]);

    const loadContent = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const contentDoc = await db.collection('contentLibrary').doc(contentId).get();

            if (!contentDoc.exists) {
                setError('İçerik bulunamadı.');
                setIsLoading(false);
                return;
            }

            const content = { id: contentDoc.id, ...contentDoc.data() } as ContentLibraryItem;
            setContentItem(content);

            if (content.fileType === ContentType.Interactive && content.interactiveContentId) {
                const interactiveDoc = await db.collection('interactiveContent').doc(content.interactiveContentId).get();
                if (interactiveDoc.exists) {
                    setInteractiveContent({ id: interactiveDoc.id, ...interactiveDoc.data() } as InteractiveContent);
                }
            }

            setIsLoading(false);
        } catch (error) {
            console.error('Error loading content:', error);
            setError('İçerik yüklenirken bir hata oluştu.');
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

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-600">İçerik yükleniyor...</p>
                </div>
            </div>
        );
    }

    if (error || !contentItem) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <p className="text-error mb-4">{error || 'İçerik bulunamadı'}</p>
                    <button onClick={onBack} className="px-4 py-2 bg-primary text-white rounded-lg">
                        Geri Dön
                    </button>
                </div>
            </div>
        );
    }

    const renderContent = () => {
        switch (contentItem.fileType) {
            case ContentType.PDF:
                return (
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden" style={{ height: 'calc(100vh - 120px)' }}>
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
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden" style={{ height: 'calc(100vh - 120px)' }}>
                        <iframe
                            ref={htmlIframeRef}
                            className="w-full h-full border-0"
                            title={contentItem.title}
                            sandbox="allow-scripts allow-same-origin allow-forms"
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

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <div className="flex-shrink-0 flex justify-between items-center px-6 py-4 border-b bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={onBack}
                        className="w-10 h-10 rounded-full hover:bg-white/20 transition-colors flex items-center justify-center"
                        title="Geri Dön"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        </svg>
                    </button>
                    <h2 className="text-xl sm:text-2xl font-bold">{contentItem.title}</h2>
                    {contentItem.fileType && (
                        <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                            {contentItem.fileType}
                        </span>
                    )}
                </div>
            </div>
            <div className="flex-grow overflow-y-auto bg-gray-50 p-6">
                <div className="max-w-7xl mx-auto">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default ContentViewerPage;
