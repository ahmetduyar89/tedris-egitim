import React, { useState, useRef, useEffect } from 'react';
import { Student, ChatMessage } from '../types';
import { explainTopic, checkAnswer } from '../services/optimizedAIService';
import ChatMessageComponent from '../components/ChatMessage';

interface AIAssistantPageProps {
    student: Student;
    onBack: () => void;
}

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
    });
};

const AIAssistantPage: React.FC<AIAssistantPageProps> = ({ student, onBack }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [inputImage, setInputImage] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        // Greet the user with a welcome message
        setMessages([{
            id: 'welcome-msg',
            sender: 'ai',
            text: `Merhaba ${student.name}! Ben senin kişisel AI Asistanın. Anlamadığın bir konuyu sorabilir veya çözdüğün bir sorunun fotoğrafını atarak kontrol etmemi isteyebilirsin.`,
            timestamp: new Date().toISOString()
        }]);
    }, [student.name]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!inputText.trim() && !inputImage) || isLoading) return;

        setIsLoading(true);
        const userMessageId = `msg-${Date.now()}`;
        const aiMessageId = `msg-${Date.now() + 1}`;
        const timestamp = new Date().toISOString();

        const userMessage: ChatMessage = {
            id: userMessageId,
            sender: 'user',
            text: inputText,
            imageUrl: inputImage ? URL.createObjectURL(inputImage) : undefined,
            timestamp,
        };

        const aiLoadingMessage: ChatMessage = {
            id: aiMessageId,
            sender: 'ai',
            isLoading: true,
            timestamp,
        };

        setMessages(prev => [...prev, userMessage, aiLoadingMessage]);
        setInputText('');
        setInputImage(null);
        if (fileInputRef.current) fileInputRef.current.value = '';

        try {
            let aiResponse: Partial<ChatMessage> = {};
            // Simple heuristic to decide which AI function to call
            if (inputImage || inputText.toLowerCase().includes('doğru mu') || inputText.toLowerCase().includes('çözdüm')) {
                const imageBase64 = inputImage ? await fileToBase64(inputImage) : undefined;

                let questionForAi = inputText;
                // If the user only uploaded an image without text, create a clear instruction for the AI.
                if (inputImage && !inputText.trim()) {
                    questionForAi = "Lütfen bu resimdeki çözümün doğruluğunu kontrol et ve geri bildirimde bulun.";
                }

                const feedbackData = await checkAnswer(questionForAi, inputText, imageBase64);
                aiResponse = { feedback: { isCorrect: feedbackData.isCorrect, feedback: feedbackData.feedback } };
            } else {
                const explanationData = await explainTopic(inputText, student.grade);
                aiResponse = { explanation: explanationData };
            }

            const aiResponseMessage: ChatMessage = {
                id: aiMessageId,
                sender: 'ai',
                timestamp: new Date().toISOString(),
                ...aiResponse
            };

            setMessages(prev => prev.map(msg => msg.id === aiMessageId ? aiResponseMessage : msg));

        } catch (error) {
            console.error("AI Assistant error:", error);
            const aiErrorMessage: ChatMessage = {
                id: aiMessageId,
                sender: 'ai',
                text: 'Üzgünüm, bir hata oluştu. Lütfen tekrar dene.',
                timestamp: new Date().toISOString(),
            };
            setMessages(prev => prev.map(msg => msg.id === aiMessageId ? aiErrorMessage : msg));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-background">
            <header className="bg-card-background shadow-md p-4 flex justify-between items-center z-10">
                <div className="flex items-center space-x-3">
                    <button onClick={onBack} className="text-primary hover:text-primary-dark">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
                    </button>
                    <h1 className="text-xl font-bold text-text-primary">AI Asistan</h1>
                </div>
                <div className="text-sm font-semibold text-accent">Online</div>
            </header>

            <main className="flex-grow p-4 overflow-y-auto">
                <div className="max-w-3xl mx-auto space-y-6">
                    {messages.map(msg => <ChatMessageComponent key={msg.id} message={msg} />)}
                    <div ref={chatEndRef} />
                </div>
            </main>

            <footer className="bg-card-background p-4 border-t sticky bottom-0">
                <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto flex items-center space-x-3">
                    <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={e => setInputImage(e.target.files ? e.target.files[0] : null)} className="hidden" />
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-600"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>
                    </button>
                    <div className="flex-grow relative">
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder={inputImage ? `${inputImage.name} eklendi. Sorunu yaz...` : "Bir konu sor veya çözümünü kontrol et..."}
                            className="w-full p-3 pr-12 border border-gray-300 rounded-full shadow-sm"
                        />
                        {inputImage && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs bg-blue-100 text-primary px-2 py-1 rounded-full">{inputImage.name}</span>}
                    </div>
                    <button type="submit" disabled={isLoading} className="p-3 bg-primary rounded-full text-white hover:bg-primary-dark disabled:bg-gray-400 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" /></svg>
                    </button>
                </form>
            </footer>
        </div>
    );
};

export default AIAssistantPage;