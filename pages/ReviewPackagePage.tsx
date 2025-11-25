import React, { useState } from 'react';
import { ReviewPackage, Task, ReviewPackageItemType } from '../types';

interface ReviewPackagePageProps {
    reviewPackage: ReviewPackage;
    task: Task;
    onComplete: () => void;
}

const stepIcons = {
    [ReviewPackageItemType.Introduction]: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.311a15.045 15.045 0 0 1-4.5 0M12 2.25v4.5m-3.25.3-1.5 1.5m10.5-1.5-1.5 1.5m-8.5 6.5-1.5 1.5m10.5-1.5-1.5 1.5m-8.5 6.5-1.5 1.5m10.5-1.5-1.5 1.5M12 6.75a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Z" /></svg>,
    [ReviewPackageItemType.KeyConcepts]: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>,
    [ReviewPackageItemType.InteractiveQuiz]: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" /></svg>,
    [ReviewPackageItemType.Summary]: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9a9.75 9.75 0 0 0 9 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M18.375 16.5c-1.437-1.29-3.262-2.25-5.375-2.25-2.113 0-3.938.96-5.375 2.25M12 14.25v-3.75m-3.75 3.75v-3.75m7.5 3.75v-3.75M9 14.25v-6.75a3 3 0 0 1 6 0v6.75M12 3.75a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-1.5 0V4.5a.75.75 0 0 1 .75-.75Zm-3.75 0a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-1.5 0V4.5a.75.75 0 0 1 .75-.75Zm7.5 0a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-1.5 0V4.5a.75.75 0 0 1 .75-.75Z" /></svg>,
};
const stepLabels = {
    [ReviewPackageItemType.Introduction]: 'Giriş',
    [ReviewPackageItemType.KeyConcepts]: 'Anahtar Kavramlar',
    [ReviewPackageItemType.InteractiveQuiz]: 'Mini Sınav',
    [ReviewPackageItemType.Summary]: 'Özet',
};

const QuizComponent = ({ content }: { content: any }) => {
    const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string | null>>({});
    const [showFeedback, setShowFeedback] = useState<Record<number, boolean>>({});

    const handleSelectAnswer = (qIndex: number, option: string) => {
        if (showFeedback[qIndex]) return;
        setSelectedAnswers(prev => ({ ...prev, [qIndex]: option }));
    };

    const handleCheckAnswer = (qIndex: number) => {
        setShowFeedback(prev => ({ ...prev, [qIndex]: true }));
    };

    return (
        <div className="space-y-6">
            {content.questions?.map((q: any, qIndex: number) => {
                const isAnswered = showFeedback[qIndex];
                const isCorrect = isAnswered && selectedAnswers[qIndex] === q.correctAnswer;
                return (
                    <div key={qIndex} className="p-4 bg-gray-50 rounded-lg">
                        <p className="font-semibold mb-3">{q.question}</p>
                        <div className="space-y-2">
                            {q.options.map((opt: string, optIndex: number) => {
                                let optionClass = "border-gray-300 bg-white hover:bg-gray-100";
                                if (isAnswered) {
                                    if (opt === q.correctAnswer) {
                                        optionClass = "border-success bg-green-50";
                                    } else if (opt === selectedAnswers[qIndex]) {
                                        optionClass = "border-error bg-red-50";
                                    }
                                }
                                return (
                                    <label key={optIndex} className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${optionClass}`}>
                                        <input type="radio" name={`q-${qIndex}`} value={opt} checked={selectedAnswers[qIndex] === opt} onChange={() => handleSelectAnswer(qIndex, opt)} className="h-5 w-5 text-primary focus:ring-primary" disabled={isAnswered}/>
                                        <span className="ml-3">{opt}</span>
                                    </label>
                                );
                            })}
                        </div>
                        {!isAnswered ? (
                            <button onClick={() => handleCheckAnswer(qIndex)} disabled={!selectedAnswers[qIndex]} className="mt-4 bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:bg-gray-400">Cevabı Kontrol Et</button>
                        ) : (
                            <div className={`mt-4 p-3 rounded-lg text-sm ${isCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
                                <p className="font-bold">{isCorrect ? 'Harika, doğru cevap!' : 'Doğru değil, ama sorun değil!'}</p>
                                <p>{q.explanation}</p>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};


const ReviewPackagePage: React.FC<ReviewPackagePageProps> = ({ reviewPackage, task, onComplete }) => {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isCompleted, setIsCompleted] = useState(false);

    const steps = reviewPackage.items;
    const currentStep = steps[currentStepIndex];
    const progressPercentage = ((currentStepIndex + 1) / steps.length) * 100;

    const goToNext = () => currentStepIndex < steps.length - 1 && setCurrentStepIndex(prev => prev + 1);
    const goToPrevious = () => currentStepIndex > 0 && setCurrentStepIndex(prev => prev - 1);
    const finishPackage = () => setIsCompleted(true);


    if (isCompleted) {
        return (
             <div className="flex flex-col h-screen bg-background items-center justify-center text-center p-4 animate-fade-in">
                <div className="text-8xl mb-4">🎉</div>
                <h1 className="text-4xl font-bold font-poppins text-success mb-2">Harika İş!</h1>
                <p className="text-xl text-text-secondary mb-8">"{reviewPackage.topic}" konusunu başarıyla tekrar ettin.</p>
                <button onClick={onComplete} className="bg-primary text-white font-bold py-3 px-8 rounded-xl hover:bg-primary-dark transition-colors text-lg">Panele Dön</button>
            </div>
        );
    }
    
    const renderContent = () => {
        const { type, content } = currentStep;
        return (
             <div className="bg-card-background p-8 rounded-2xl shadow-lg w-full max-w-4xl animate-fade-in-up">
                <div className="flex items-center space-x-4 text-primary mb-6">
                    {stepIcons[type]}
                    <h2 className="text-3xl font-bold font-poppins">{stepLabels[type]}</h2>
                </div>
                <div className="text-text-primary text-lg leading-relaxed">
                    {type === ReviewPackageItemType.Introduction && (
                        <>
                            <h3 className="text-2xl font-bold mb-3">{content.title}</h3>
                            <p className="italic text-text-secondary">"{content.analogy}"</p>
                        </>
                    )}
                    {type === ReviewPackageItemType.KeyConcepts && (
                        <div className="space-y-4">
                            {content.concepts.map((c: any, i: number) => (
                                <div key={i} className="p-4 bg-indigo-50/50 rounded-lg">
                                    <h4 className="font-bold text-primary">{c.concept}</h4>
                                    <p className="text-base mt-1">{c.explanation}</p>
                                </div>
                            ))}
                        </div>
                    )}
                    {type === ReviewPackageItemType.InteractiveQuiz && <QuizComponent content={content} />}
                    {type === ReviewPackageItemType.Summary && (
                         <>
                            <p className="mb-4">{content.summary_text}</p>
                            <p className="font-semibold text-primary p-4 bg-indigo-50 rounded-lg">"{content.encouragement}"</p>
                        </>
                    )}
                </div>
             </div>
        );
    };

    return (
        <div className="flex flex-col h-screen bg-background">
            <header className="bg-card-background shadow-md p-4 flex-shrink-0 z-10">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-xl font-bold text-text-primary mb-3">Konu Tekrarı: {reviewPackage.topic}</h1>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-success h-2.5 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
                    </div>
                </div>
            </header>

            <main className="flex-grow p-4 md:p-8 flex items-center justify-center overflow-y-auto">
                {renderContent()}
            </main>

            <footer className="bg-card-background shadow-inner p-4 flex justify-between items-center flex-shrink-0 z-10">
                <button onClick={goToPrevious} disabled={currentStepIndex === 0} className="bg-gray-500 text-white px-8 py-3 rounded-xl font-semibold disabled:bg-gray-300 hover:bg-gray-600 transition-colors">
                    Geri
                </button>
                {currentStepIndex === steps.length - 1 ? (
                    <button onClick={finishPackage} className="bg-success text-white px-8 py-3 rounded-xl font-semibold hover:bg-green-600 transition-colors">
                        Bitir
                    </button>
                ) : (
                    <button onClick={goToNext} className="bg-primary text-white px-8 py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors">
                        İlerle
                    </button>
                )}
            </footer>
        </div>
    );
};

export default ReviewPackagePage;