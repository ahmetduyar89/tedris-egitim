import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Student, Subject, QuestionType, Difficulty, Question, Test } from '../types';
import { CURRICULUM } from '../constants';
import { generateTestQuestions } from '../services/optimizedAIService';
import { db } from '../services/dbAdapter';
import { notifyTestAssigned } from '../services/multiChannelNotificationService';

interface TestCreationModalProps {
    student: Student;
    teacherId: string;
    onClose: () => void;
    onTestCreated: (newTest: Test) => void;
}

interface TopicSelection {
    id: number;
    subject: Subject;
    unit: string;
    count: number;
}

const TestCreationModal: React.FC<TestCreationModalProps> = ({ student, teacherId, onClose, onTestCreated }) => {
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [title, setTitle] = useState('');
    const [topics, setTopics] = useState<TopicSelection[]>([]);
    const [questionType, setQuestionType] = useState<QuestionType>(QuestionType.Mixed);
    const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.Medium);
    const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);

    useEffect(() => {
        const initialSubject = Subject.Mathematics;
        const initialUnits = CURRICULUM[initialSubject]?.[student.grade] || [];
        const initialUnit = initialUnits[0] || '';
        setTopics([{
            id: Date.now(),
            subject: initialSubject,
            unit: initialUnit,
            count: 5
        }]);
        setTitle(`${student.grade === 4 ? 'İlkokul' : `${student.grade}. Sınıf`} Karma Deneme`);
    }, [student.grade]);

    const handleTopicChange = (id: number, field: 'subject' | 'unit' | 'count', value: string | number) => {
        setTopics(prevTopics => {
            return prevTopics.map(topic => {
                if (topic.id === id) {
                    const updatedTopic = { ...topic };
                    if (field === 'subject') {
                        const newSubject = value as Subject;
                        updatedTopic.subject = newSubject;
                        const newUnits = CURRICULUM[newSubject]?.[student.grade] || [];
                        updatedTopic.unit = newUnits[0] || '';
                    } else if (field === 'unit') {
                        updatedTopic.unit = value as string;
                    } else if (field === 'count') {
                        const count = Number(value);
                        updatedTopic.count = count > 0 ? count : 1;
                    }
                    return updatedTopic;
                }
                return topic;
            });
        });
    };

    const handleAddTopic = () => {
        const lastTopic = topics[topics.length - 1];
        const newSubject = lastTopic?.subject || Subject.Mathematics;
        const newUnits = CURRICULUM[newSubject]?.[student.grade] || [];
        const newUnit = newUnits[0] || '';
        setTopics(prev => [...prev, {
            id: Date.now(),
            subject: newSubject,
            unit: newUnit,
            count: 5
        }]);
    };

    const handleRemoveTopic = (id: number) => {
        setTopics(prev => prev.filter(t => t.id !== id));
    };

    const totalQuestions = useMemo(() => {
        return topics.reduce((sum, topic) => sum + (topic.count || 0), 0);
    }, [topics]);

    const handleGenerateTest = useCallback(async () => {
        if (topics.some(t => !t.unit)) {
            setError('Lütfen tüm konular için bir ünite seçin.');
            return;
        }
        if (totalQuestions === 0) {
            setError('Lütfen en az bir soru ekleyin.');
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const topicsForApi = topics.map(({ subject, unit, count }) => ({ subject, unit, count }));
            const questions = await generateTestQuestions(
                student.grade,
                topicsForApi,
                questionType,
                difficulty
            );
            setGeneratedQuestions(questions);
            setStep(2);
        } catch (err: any) {
            setError(err.message || 'Bir hata oluştu.');
        } finally {
            setIsLoading(false);
        }
    }, [student.grade, topics, questionType, difficulty, totalQuestions]);

    const handleAssignTest = async () => {
        const testData: Omit<Test, 'id'> = {
            studentId: student.id,
            teacherId: teacherId,
            title: title || 'Karma Test',
            subject: topics[0]?.subject || Subject.Mathematics,
            unit: 'Karma Deneme',
            questions: generatedQuestions,
            duration: totalQuestions * 2,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            completed: false,
        };

        try {
            const docRef = await db.collection('tests').add(testData);

            // Send notification
            await notifyTestAssigned(
                student.id,
                testData.title,
                docRef.id,
                'test'
            );

            onTestCreated({ ...testData, id: docRef.id });
            onClose();
        } catch (error) {
            console.error("Error creating test in Firestore:", error);
            setError("Test oluşturulurken bir veritabanı hatası oluştu.");
        }
    };

    const handleQuestionTextChange = (id: string, newText: string) => {
        setGeneratedQuestions(prev => prev.map(q => q.id === id ? { ...q, text: newText } : q));
    };

    const handleOptionChange = (questionId: string, optionIndex: number, newText: string) => {
        setGeneratedQuestions(prev => prev.map(q => {
            if (q.id === questionId && q.options) {
                const oldText = q.options[optionIndex];
                const newOptions = [...q.options];
                newOptions[optionIndex] = newText;
                const newCorrectAnswer = q.correctAnswer === oldText ? newText : q.correctAnswer;
                return { ...q, options: newOptions, correctAnswer: newCorrectAnswer };
            }
            return q;
        }));
    };

    const handleCorrectAnswerChange = (questionId: string, newCorrectAnswer: string) => {
        setGeneratedQuestions(prev => prev.map(q => q.id === questionId ? { ...q, correctAnswer: newCorrectAnswer } : q));
    };

    const handleCorrectAnswerTextChange = (questionId: string, newText: string) => {
        setGeneratedQuestions(prev => prev.map(q => q.id === questionId ? { ...q, correctAnswer: newText } : q));
    };

    const deleteQuestion = (id: string) => {
        setGeneratedQuestions(prev => prev.filter(q => q.id !== id));
    };

    const groupedQuestions = useMemo(() => {
        return generatedQuestions.reduce((acc, q) => {
            const topicKey = q.topic || 'Diğer Konular';
            if (!acc[topicKey]) {
                acc[topicKey] = [];
            }
            acc[topicKey].push(q);
            return acc;
        }, {} as Record<string, Question[]>);
    }, [generatedQuestions]);

    const renderStep1 = () => (
        <>
            <h2 className="text-2xl font-bold font-poppins mb-4">AI Destekli Karma Test Oluştur</h2>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Test Başlığı</label>
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />
                </div>
                <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold mb-2">Konular ve Soru Sayıları</h3>
                    <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                        {topics.map((topic, index) => (
                            <div key={topic.id} className="grid grid-cols-12 gap-2 items-center p-2 bg-gray-50 rounded-lg">
                                <select value={topic.subject} onChange={e => handleTopicChange(topic.id, 'subject', e.target.value)} className="col-span-4 p-2 border border-gray-300 rounded-md text-sm">
                                    {Object.values(Subject).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <select value={topic.unit} onChange={e => handleTopicChange(topic.id, 'unit', e.target.value)} className="col-span-5 p-2 border border-gray-300 rounded-md text-sm">
                                    {(CURRICULUM[topic.subject]?.[student.grade] || []).map(u => <option key={u} value={u}>{u}</option>)}
                                </select>
                                <input type="number" value={topic.count} onChange={e => handleTopicChange(topic.id, 'count', e.target.value)} min="1" className="col-span-2 p-2 border border-gray-300 rounded-md text-center text-sm" />
                                <button onClick={() => handleRemoveTopic(topic.id)} disabled={topics.length <= 1} className="col-span-1 text-red-500 disabled:text-gray-300 hover:text-red-700">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mx-auto"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                                </button>
                            </div>
                        ))}
                    </div>
                    <button onClick={handleAddTopic} className="mt-3 text-sm font-semibold text-primary hover:underline">+ Konu Ekle</button>
                </div>
                <div className="grid grid-cols-2 gap-4 border-t pt-4">
                    <div>
                        <label htmlFor="questionType" className="block text-sm font-medium text-gray-700">Soru Tipi</label>
                        <select id="questionType" value={questionType} onChange={e => setQuestionType(e.target.value as QuestionType)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3">
                            {Object.values(QuestionType).map(qt => <option key={qt} value={qt}>{qt}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700">Zorluk Seviyesi</label>
                        <select id="difficulty" value={difficulty} onChange={e => setDifficulty(e.target.value as Difficulty)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3">
                            {Object.values(Difficulty).map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                </div>
            </div>
            {error && <p className="text-red-500 mt-4">{error}</p>}
            <div className="mt-6 flex justify-between items-center">
                <span className="font-bold text-lg">Toplam Soru: {totalQuestions}</span>
                <div className="flex space-x-3">
                    <button onClick={onClose} className="bg-gray-500 text-white px-4 py-2 rounded-xl hover:bg-gray-600">İptal</button>
                    <button onClick={handleGenerateTest} disabled={isLoading} className="bg-primary text-white px-4 py-2 rounded-xl disabled:bg-gray-400 flex items-center hover:bg-primary-dark">
                        {isLoading && <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                        {isLoading ? 'Oluşturuluyor...' : 'Test Oluştur'}
                    </button>
                </div>
            </div>
        </>
    );

    const renderStep2 = () => (
        <>
            <h2 className="text-2xl font-bold font-poppins mb-4">Test Önizleme ve Düzenleme</h2>
            <div className="space-y-6 max-h-[65vh] overflow-y-auto pr-2 p-2 bg-gray-50 rounded-lg">
                {Object.entries(groupedQuestions).map(([topic, questions]) => (
                    <div key={topic}>
                        <h3 className="font-bold text-primary bg-indigo-100 p-2 rounded-md sticky top-0">{topic}</h3>
                        <div className="space-y-4 mt-2">
                            {(questions as Question[]).map((q) => (
                                <div key={q.id} className="p-4 border rounded-xl bg-white space-y-3">
                                    <div className="flex justify-between items-start space-x-2">
                                        <textarea value={q.text} onChange={(e) => handleQuestionTextChange(q.id, e.target.value)} className="w-full font-semibold border-gray-200 rounded-lg p-2 text-base" rows={3} />
                                        <button onClick={() => deleteQuestion(q.id)} className="text-error hover:text-red-700 flex-shrink-0 p-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                                        </button>
                                    </div>
                                    {q.type === QuestionType.MultipleChoice && q.options && (
                                        <div className="space-y-2 pl-4">
                                            {q.options.map((option, index) => (
                                                <div key={index} className="flex items-center space-x-2">
                                                    <input
                                                        type="radio"
                                                        name={`correct-answer-${q.id}`}
                                                        checked={q.correctAnswer === option}
                                                        onChange={() => handleCorrectAnswerChange(q.id, option)}
                                                        className="h-4 w-4 text-primary focus:ring-primary"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={option}
                                                        onChange={(e) => handleOptionChange(q.id, index, e.target.value)}
                                                        className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {q.type === QuestionType.OpenEnded && (
                                        <div className="pl-4">
                                            <label className="text-xs font-semibold text-gray-500">Doğru Cevap</label>
                                            <textarea
                                                value={q.correctAnswer}
                                                onChange={(e) => handleCorrectAnswerTextChange(q.id, e.target.value)}
                                                className="w-full p-2 border border-gray-200 rounded-lg text-sm mt-1"
                                                rows={2}
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-6 flex justify-between items-center">
                <button onClick={() => setStep(1)} className="bg-gray-500 text-white px-4 py-2 rounded-xl hover:bg-gray-600">Geri Dön</button>
                <button onClick={handleAssignTest} className="bg-success text-white px-4 py-2 rounded-xl hover:bg-green-700">Testi Ata</button>
            </div>
        </>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-4xl">
                {step === 1 ? renderStep1() : renderStep2()}
            </div>
        </div>
    );
};

export default TestCreationModal;