import React, { useState, useEffect } from 'react';
import { diagnosisTestService, DiagnosisQuestion, DiagnosisTestResult } from '../services/diagnosisTestService';
import { adaptivePlanService } from '../services/adaptivePlanService';

interface DiagnosisTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  subject: string;
  grade: number;
}

const DiagnosisTestModal: React.FC<DiagnosisTestModalProps> = ({
  isOpen,
  onClose,
  studentId,
  subject,
  grade,
}) => {
  const [questions, setQuestions] = useState<DiagnosisQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<DiagnosisTestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      generateTest();
    }
  }, [isOpen, studentId, subject, grade]);

  const generateTest = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const testQuestions = await diagnosisTestService.generateDiagnosisTest(studentId, subject, grade, 3);
      setQuestions(testQuestions);
      setCurrentIndex(0);
      setAnswers({});
      setResult(null);
    } catch (error) {
      console.error('Error generating diagnosis test:', error);
      const errorMessage = error instanceof Error ? error.message : 'Tanı testi oluşturulurken beklenmeyen bir hata oluştu';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSelect = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    const unansweredCount = questions.filter(q => !answers[q.id]).length;

    if (unansweredCount > 0) {
      const confirm = window.confirm(
        `${unansweredCount} soru cevaplanmadı. Yine de göndermek istiyor musunuz?`
      );
      if (!confirm) return;
    }

    setIsSubmitting(true);
    try {
      const testResult = await diagnosisTestService.submitDiagnosisTest(studentId, questions, answers);
      setResult(testResult);

      await adaptivePlanService.generateAdaptivePlan(studentId, 'initial_diagnosis', 7);
    } catch (error) {
      console.error('Error submitting diagnosis test:', error);
      alert('Test gönderilirken hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setQuestions([]);
    setAnswers({});
    setResult(null);
    setCurrentIndex(0);
    setError(null);
    onClose();
  };

  const handleRetry = () => {
    setError(null);
    generateTest();
  };

  if (!isOpen) return null;

  const currentQuestion = questions[currentIndex];
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;
  const allAnswered = questions.every(q => answers[q.id]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-primary to-accent p-6 text-white rounded-t-2xl">
          <h2 className="text-2xl font-bold">🔍 Tanı Testi</h2>
          <p className="text-sm mt-1 opacity-90">
            Bu test, senin güçlü ve zayıf yönlerini belirleyerek özel bir öğrenme planı oluşturmamıza yardımcı olacak.
          </p>
        </div>

        {isLoading && (
          <div className="p-10 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-text-secondary">Test oluşturuluyor...</p>
          </div>
        )}

        {error && (
          <div className="p-6">
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-medium text-red-800 mb-2">Hata Oluştu</h3>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleRetry}
                className="flex-1 px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors"
              >
                Tekrar Dene
              </button>
              <button
                onClick={handleClose}
                className="flex-1 px-6 py-3 bg-gray-300 text-text-primary rounded-lg font-semibold hover:bg-gray-400 transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        )}

        {!isLoading && !result && questions.length > 0 && (
          <>
            <div className="p-6">
              <div className="mb-6">
                <div className="flex justify-between text-sm text-text-secondary mb-2">
                  <span>Soru {currentIndex + 1} / {questions.length}</span>
                  <span>{Math.round(progress)}% Tamamlandı</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl mb-4">
                <div className="text-xs text-primary font-semibold mb-1">
                  {currentQuestion.moduleName} ({currentQuestion.moduleCode})
                </div>
                <div className="text-xs text-text-secondary">
                  Zorluk: {'⭐'.repeat(currentQuestion.difficulty)}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                  {currentQuestion.question}
                </h3>

                <div className="space-y-3">
                  {currentQuestion.options.map((option, idx) => {
                    const optionKey = option.charAt(0);
                    const isSelected = answers[currentQuestion.id] === optionKey;

                    return (
                      <button
                        key={idx}
                        onClick={() => handleAnswerSelect(currentQuestion.id, optionKey)}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/10 shadow-md'
                            : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
                        }`}
                      >
                        <span className="font-semibold">{option}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-border">
                <button
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                  className={`px-6 py-2 rounded-lg font-semibold ${
                    currentIndex === 0
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-300 text-text-primary hover:bg-gray-400'
                  }`}
                >
                  ← Önceki
                </button>

                {currentIndex < questions.length - 1 ? (
                  <button
                    onClick={handleNext}
                    className="px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark"
                  >
                    Sonraki →
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className={`px-6 py-2 rounded-lg font-semibold ${
                      isSubmitting
                        ? 'bg-gray-400 cursor-not-allowed text-white'
                        : allAnswered
                        ? 'bg-success text-white hover:bg-green-700'
                        : 'bg-accent text-white hover:bg-yellow-600'
                    }`}
                  >
                    {isSubmitting ? 'Değerlendiriliyor...' : 'Testi Bitir'}
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {result && (
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="inline-block bg-gradient-to-r from-primary to-accent text-white rounded-full px-8 py-4 mb-4">
                <div className="text-4xl font-bold">{result.score}%</div>
                <div className="text-sm opacity-90">Toplam Puan</div>
              </div>
              <p className="text-lg text-text-primary font-semibold">
                {result.correctAnswers} / {result.totalQuestions} Doğru Cevap
              </p>
            </div>

            <div className="bg-primary/5 p-4 rounded-xl mb-6">
              <h3 className="font-bold text-primary mb-3">📊 Modül Bazlı Sonuçlar</h3>
              <div className="space-y-3">
                {result.moduleResults.map((moduleResult, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-lg border border-border">
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="font-semibold text-text-primary">{moduleResult.moduleName}</div>
                        <div className="text-xs text-text-secondary">
                          {moduleResult.correct} / {moduleResult.total} doğru
                        </div>
                      </div>
                      <div className={`text-xl font-bold ${
                        moduleResult.masteryScore >= 0.7 ? 'text-success' :
                        moduleResult.masteryScore >= 0.5 ? 'text-accent' : 'text-secondary'
                      }`}>
                        {Math.round(moduleResult.masteryScore * 100)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-success/10 p-4 rounded-xl border border-success/20 mb-6">
              <p className="text-sm text-text-primary">
                ✅ Harika! Tanı testi tamamlandı. Senin için özel bir öğrenme planı oluşturuldu.
                Zayıf konularını güçlendirmek için hazırlanmış görevleri görebilirsin.
              </p>
            </div>

            <button
              onClick={handleClose}
              className="w-full px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark"
            >
              Tamam, Planımı Göreyim
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiagnosisTestModal;
