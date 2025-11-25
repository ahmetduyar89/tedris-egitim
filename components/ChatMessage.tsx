import React from 'react';
import { ChatMessage } from '../types';

interface ChatMessageProps {
    message: ChatMessage;
}

const LoadingBubble: React.FC = () => (
    <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
    </div>
);

const ChatMessageComponent: React.FC<ChatMessageProps> = ({ message }) => {
    const isUser = message.sender === 'user';
    const bubbleClasses = isUser
        ? 'bg-primary text-white self-end rounded-l-2xl rounded-tr-2xl'
        : 'bg-gray-200 text-text-primary self-start rounded-r-2xl rounded-tl-2xl';

    return (
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-lg p-4 ${bubbleClasses}`}>
                {message.isLoading && <LoadingBubble />}
                {message.text && <p>{message.text}</p>}
                {message.imageUrl && (
                    <img src={message.imageUrl} alt="Student submission" className="rounded-lg max-w-xs" />
                )}
                {message.explanation && (
                    <div className="space-y-3">
                        <h3 className="font-bold text-lg text-primary">{message.explanation.topic}</h3>
                        <p>{message.explanation.explanation}</p>
                        <div className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
                            <p className="font-semibold">Örnek:</p>
                            <p className="italic">{message.explanation.example}</p>
                        </div>
                         <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg">
                            <p className="font-semibold">İpucu:</p>
                            <p className="italic">{message.explanation.hint}</p>
                        </div>
                    </div>
                )}
                {message.feedback && (
                    <div className={`p-3 border-l-4 rounded-r-lg ${message.feedback.isCorrect ? 'bg-green-50 border-green-400' : 'bg-red-50 border-red-400'}`}>
                         <h3 className="font-bold text-lg mb-2">{message.feedback.isCorrect ? '✅ Doğru!' : '❌ Tekrar Deneyelim'}</h3>
                         <p>{message.feedback.feedback}</p>
                    </div>
                )}
            </div>
            <p className="text-xs text-gray-400 mt-1 px-2">{new Date(message.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
    );
};

export default ChatMessageComponent;
