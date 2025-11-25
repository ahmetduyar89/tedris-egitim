import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Test, QuestionType, Student, Notification, TestResultSummary, Question, WeeklyProgram, Task } from '../types';
import { generateTestAnalysis, generateCompletionTasks } from '../services/geminiService';
import { createNotification } from '../services/notificationService';
import { db } from '../services/dbAdapter';
import { masteryScoreService } from '../services/masteryScoreService';
import { adaptivePlanService } from '../services/adaptivePlanService';

// A custom confirmation modal to replace window.confirm
interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Onayla',
  cancelText = 'İptal',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md m-4">
        <div className="flex items-start">
          <div className="mr-4 flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
            <svg className="h-6 w-6 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 className="text-2xl font-bold font-poppins text-text-primary">{title}</h3>
            <p className="mt-2 text-text-secondary">{message}</p>
          </div>
        </div>
        <div className="mt-8 flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-gray-500 text-white font-semibold hover:bg-gray-600 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-colors"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

// A custom modal for displaying submission errors
interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
}

const ErrorModal: React.FC<ErrorModalProps> = ({ isOpen, onClose, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md m-4">
        <div className="flex items-start">
          <div className="mr-4 flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-2xl font-bold font-poppins text-text-primary">{title}</h3>
            <p className="mt-2 text-text-secondary">{message}</p>
          </div>
        </div>
        <div className="mt-8 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-colors"
          >
            Anladım
          </button>
        </div>
      </div>
    </div>
  );
};

interface TestTakingPageProps {
  test: Test;
  onComplete: () => void;
}

const TestTakingPage: React.FC<TestTakingPageProps> = ({ test, onComplete }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResult, setTestResult] = useState<TestResultSummary | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const isTestCompleted = test.completed === true;

  const currentQuestion = useMemo(() => test.questions[currentQuestionIndex], [test, currentQuestionIndex]);
  const allQuestionsAnswered = useMemo(() => {
    return test.questions.every(q => answers[q.id] && answers[q.id].trim() !== '');
  }, [answers, test.questions]);
  
  useEffect(() => {
    if (isTestCompleted) {
      const completedAnswers: Record<string, string> = {};
      test.questions.forEach(q => {
        if (q.studentAnswer) {
          completedAnswers[q.id] = q.studentAnswer;
        }
      });
      setAnswers(completedAnswers);

      if (test.analysis?.summary) {
        setTestResult(test.analysis.summary);
      }
    } else {
      const savedProgress = localStorage.getItem(`test-progress-${test.id}`);
      if (savedProgress) {
        setAnswers(JSON.parse(savedProgress));
      }
    }
  }, [test.id, isTestCompleted]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Object.keys(answers).length > 0 && !testResult) {
        localStorage.setItem(`test-progress-${test.id}`, JSON.stringify(answers));
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [answers, test.id, testResult]);

  const finishTest = useCallback(async () => {
    setIsSubmitting(true);
    setSubmissionError(null);

    const questionsWithAnswers: Question[] = test.questions.map(q => {
      const studentAnswer = answers[q.id] || "Cevaplanmadı";
      const isCorrect = studentAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
      return { ...q, studentAnswer, isCorrect };
    });
    
    const correct = questionsWithAnswers.filter(q => q.isCorrect).length;
    const total = test.questions.length;
    const wrong = total - correct;
    const scorePercent = total > 0 ? Math.round((correct / total) * 100) : 0;
    const studentSummary: TestResultSummary = { correct, wrong, scorePercent };

    const submittedTest: Test = {
      ...test,
      completed: true,
      questions: questionsWithAnswers,
      score: scorePercent,
      submissionDate: new Date().toISOString(),
    };

    try {
      const analysisReport = await generateTestAnalysis(test.subject, test.unit, questionsWithAnswers);
      submittedTest.analysis = analysisReport;
      submittedTest.questions = analysisReport.questionEvaluations;

      // Recalculate score after AI evaluation (for open-ended questions)
      const aiCorrectCount = analysisReport.questionEvaluations.filter(q => q.isCorrect).length;
      const aiScorePercent = total > 0 ? Math.round((aiCorrectCount / total) * 100) : 0;
      submittedTest.score = aiScorePercent;
      submittedTest.analysis.summary.correct = aiCorrectCount;
      submittedTest.analysis.summary.wrong = total - aiCorrectCount;
      submittedTest.analysis.summary.scorePercent = aiScorePercent;

      const weakTopics = analysisReport.analysis.weakTopics;
      if (weakTopics && weakTopics.length > 0) {
        const allCompletionTasks: Task[] = (await Promise.all(
          weakTopics.map(topic => generateCompletionTasks(topic, test.subject).catch(e => {
            console.error(`Failed to generate tasks for topic ${topic}:`, e);
            return []; // Return empty array on error for a specific topic
          }))
        )).flat();
        
        if (allCompletionTasks.length > 0) {
          const programQuery = await db.collection('weeklyPrograms').where('studentId', '==', submittedTest.studentId).limit(1).get();
          let studentProgram: WeeklyProgram | null = null;
          let programId: string | null = null;

          if (!programQuery.empty) {
              const doc = programQuery.docs[0];
              programId = doc.id;
              studentProgram = { id: doc.id, ...doc.data() } as WeeklyProgram;
          }

          if (!studentProgram) {
              studentProgram = {
                  id: '', // Firestore will generate this
                  studentId: submittedTest.studentId, week: 1,
                  days: Array.from({ length: 7 }, (_, i) => ({ day: ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'][i], tasks: [] }))
              };
          }
          
          const today = new Date().getDay();
          const dayMap = [6, 0, 1, 2, 3, 4, 5];
          const todayIndex = dayMap[today];

          allCompletionTasks.forEach((task, i) => {
              const targetDayIndex = (todayIndex + 1 + i) % 7;
              if (!studentProgram!.days[targetDayIndex].tasks) {
                  studentProgram!.days[targetDayIndex].tasks = [];
              }
              studentProgram!.days[targetDayIndex].tasks.push(task);
          });

          if (programId) {
              await db.collection('weeklyPrograms').doc(programId).update({ days: studentProgram.days });
          } else {
              const { id, ...programData } = studentProgram;
              await db.collection('weeklyPrograms').add(programData);
          }
        }
      }
    } catch (analysisError) {
      console.error("Failed to generate AI analysis:", analysisError);
    }
    
    try {
      await db.collection('tests').doc(test.id).update({
        completed: submittedTest.completed,
        questions: submittedTest.questions,
        score: submittedTest.score,
        submissionDate: submittedTest.submissionDate,
        analysis: submittedTest.analysis
      });

      const studentDoc = await db.collection('students').doc(submittedTest.studentId).get();
      if (studentDoc.exists) {
        const student = studentDoc.data() as Student;

        await createNotification(
            submittedTest.studentId,
            `✅ "${submittedTest.title}" testini tamamladınız! Puanınız: ${submittedTest.score}%`,
            'test_completed',
            submittedTest.id
        );

        if (student?.tutorId) {
            await createNotification(
                student.tutorId,
                `📊 ${student.name}, "${submittedTest.title}" testini tamamladı. Puan: ${submittedTest.score}%`,
                'submission',
                submittedTest.id
            );
        }
      }

      // Update testResult with AI-evaluated score if available
      const finalTestResult = submittedTest.analysis?.summary || studentSummary;
      setTestResult(finalTestResult);
      localStorage.removeItem(`test-progress-${test.id}`);

      if (submittedTest.analysis?.topicBreakdown) {
        try {
          const topicScores = submittedTest.analysis.topicBreakdown.map(topic => ({
            topicName: topic.topic,
            correct: topic.correct,
            wrong: topic.wrong,
          }));

          await masteryScoreService.updateMasteryScoresFromTest(
            submittedTest.studentId,
            submittedTest.id,
            topicScores
          );

          const shouldRegenerate = await adaptivePlanService.shouldRegeneratePlan(submittedTest.studentId);
          if (shouldRegenerate.shouldRegenerate) {
            await adaptivePlanService.generateAdaptivePlan(
              submittedTest.studentId,
              scorePercent < 50 ? 'test_failed' : 'milestone_reached'
            );
          }
        } catch (masteryError) {
          console.error("Failed to update mastery scores:", masteryError);
        }
      }

    } catch (storageError) {
      console.error("Failed to save test results:", storageError);
      setSubmissionError("Sonuçlar kaydedilemedi. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.");
    } finally {
      setIsSubmitting(false);
    }
  }, [answers, test]);

  const confirmAndSubmit = () => {
    setIsConfirmModalOpen(true);
  };
  
  const handleConfirmSubmit = () => {
    setIsConfirmModalOpen(false);
    finishTest();
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const goToNext = () => currentQuestionIndex < test.questions.length - 1 && setCurrentQuestionIndex(prev => prev + 1);
  const goToPrevious = () => currentQuestionIndex > 0 && setCurrentQuestionIndex(prev => prev - 1);

  const getSubmitButtonClass = () => {
    if (isSubmitting) return 'bg-gray-400 cursor-not-allowed';
    return allQuestionsAnswered ? 'bg-success hover:bg-green-700' : 'bg-primary hover:bg-primary-dark';
  };
  
  const renderResults = () => (
    <div className="bg-white p-10 rounded-2xl shadow-2xl text-center w-full max-w-2xl animate-fade-in">
        <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
            </div>
            <h2 className="text-4xl font-bold font-poppins text-text-primary mb-2">Test Tamamlandı!</h2>
            <p className="text-lg text-text-secondary">Sonuçların öğretmenine başarıyla gönderildi.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-3">
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <span className="text-sm font-medium text-green-700 mb-1">Doğru Cevap</span>
                    <span className="text-3xl font-bold text-green-600">{testResult!.correct}</span>
                </div>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl border border-red-200">
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mb-3">
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <span className="text-sm font-medium text-red-700 mb-1">Yanlış Cevap</span>
                    <span className="text-3xl font-bold text-red-600">{testResult!.wrong}</span>
                </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-3">
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                        </svg>
                    </div>
                    <span className="text-sm font-medium text-blue-700 mb-1">Başarı Oranı</span>
                    <span className="text-3xl font-bold text-blue-600">{testResult!.scorePercent}%</span>
                </div>
            </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">
                Toplam <strong>{testResult!.correct + testResult!.wrong}</strong> sorudan <strong>{testResult!.correct}</strong> tanesini doğru cevapladın!
            </p>
        </div>
    </div>
  );

  const renderTest = () => (
     <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg w-full max-w-3xl">
        <p className="text-sm text-gray-500 mb-2">Soru {currentQuestionIndex + 1} / {test.questions.length}</p>
        <h2 className="text-xl font-semibold font-poppins mb-6 whitespace-pre-wrap">{currentQuestion.text}</h2>
        <div className="space-y-4">
          {currentQuestion.type === QuestionType.MultipleChoice && currentQuestion.options ? (
            currentQuestion.options.map((option, index) => (
              <label key={index} className={`flex items-center p-4 border rounded-xl transition-colors ${isTestCompleted ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:bg-gray-50 has-[:checked]:bg-indigo-50 has-[:checked]:border-primary'}`}>
                <input
                  type="radio"
                  name={currentQuestion.id}
                  value={option}
                  checked={answers[currentQuestion.id] === option}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                  disabled={isTestCompleted}
                  className="h-5 w-5 text-primary focus:ring-primary disabled:cursor-not-allowed"
                />
                <span className="ml-3 text-gray-800">{option}</span>
              </label>
            ))
          ) : (
            <textarea
              value={answers[currentQuestion.id] || ''}
              onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
              disabled={isTestCompleted}
              rows={5}
              className="w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder={isTestCompleted ? "Test tamamlandı - değişiklik yapılamaz" : "Cevabınızı buraya yazın..."}
            />
          )}
        </div>
      </div>
  );

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="bg-white shadow-md p-4 flex-shrink-0">
        <div className="flex justify-between items-center">
          <h1 className="text-xl md:text-2xl font-bold font-poppins text-text-primary">{test.title}</h1>
          {testResult && <span className="font-semibold text-success">Test Tamamlandı</span>}
        </div>
        {isTestCompleted && !testResult && (
          <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start space-x-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-blue-600 flex-shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-900">Bu testi zaten tamamladınız!</p>
              <p className="text-xs text-blue-700 mt-1">Cevaplarınızı inceleyebilirsiniz ancak değişiklik yapamazsınız.</p>
            </div>
          </div>
        )}
      </header>

      <main className="flex-grow p-4 md:p-8 flex items-center justify-center overflow-y-auto mb-32 md:mb-24">
        {testResult ? renderResults() : renderTest()}
      </main>

      <footer className="bg-white shadow-inner p-4 flex flex-col md:flex-row justify-between items-center gap-4 flex-shrink-0 fixed bottom-0 left-0 w-full border-t">
        {testResult ? (
          <div className="w-full flex justify-center">
            <button
              onClick={onComplete}
              className="bg-primary text-white px-8 py-3 rounded-xl font-bold text-lg hover:bg-primary-dark transition-colors"
            >
              Panele Dön
            </button>
          </div>
        ) : (
          <>
            <div className="w-full md:w-auto flex gap-4">
              <button onClick={goToPrevious} disabled={currentQuestionIndex === 0 || isSubmitting} className="flex-1 md:flex-none bg-gray-500 text-white px-6 py-2 rounded-xl disabled:bg-gray-300 hover:bg-gray-600 transition-colors">
                Önceki
              </button>
              <button onClick={goToNext} disabled={currentQuestionIndex === test.questions.length - 1 || isSubmitting} className="flex-1 md:flex-none bg-primary text-white px-6 py-2 rounded-xl hover:bg-primary-dark transition-colors disabled:bg-gray-300">
                Sonraki
              </button>
            </div>
            <button
              onClick={confirmAndSubmit}
              disabled={isSubmitting || isTestCompleted}
              className={`w-full md:w-auto text-white px-6 py-3 rounded-xl transition-colors disabled:cursor-not-allowed flex items-center justify-center font-bold text-lg min-w-[180px] ${getSubmitButtonClass()}`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Gönderiliyor...
                </>
              ) : 'Testi Bitir'}
            </button>
          </>
        )}
      </footer>

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmSubmit}
        title="Testi Bitir"
        message={
          !allQuestionsAnswered
            ? "Bazı soruları boş bıraktın. Yine de testi bitirmek istiyor musun?"
            : "Testi bitirmek istediğinden emin misin? Cevaplarını değiştiremeyeceksin."
        }
        confirmText="Evet, Bitir"
        cancelText="Hayır, Devam Et"
      />

      <ErrorModal
        isOpen={!!submissionError}
        onClose={() => setSubmissionError(null)}
        title="Gönderim Hatası"
        message={submissionError || ""}
      />
    </div>
  );
};

export default TestTakingPage;