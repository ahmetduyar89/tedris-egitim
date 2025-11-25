import React, { useState } from 'react';
import { QuestionBankAssignment, QuestionBank } from '../types';

interface QuestionBankResultModalProps {
  assignment: QuestionBankAssignment & { questionBank?: QuestionBank };
  onClose: () => void;
  onGenerateAnalysis?: (assignmentId: string) => Promise<void>;
}

const QuestionBankResultModal: React.FC<QuestionBankResultModalProps> = ({ assignment, onClose, onGenerateAnalysis }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { questionBank, score, totalCorrect, totalQuestions, completedAt, aiFeedback } = assignment;

  const percentage = score || 0;
  const correctCount = totalCorrect || 0;
  const totalCount = totalQuestions || 0;

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 85) return 'text-green-600';
    if (percentage >= 70) return 'text-blue-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceLabel = (percentage: number) => {
    if (percentage >= 85) return 'Mükemmel';
    if (percentage >= 70) return 'İyi';
    if (percentage >= 50) return 'Orta';
    return 'Geliştirilmeli';
  };

  const handleGenerateAnalysis = async () => {
    if (!onGenerateAnalysis || isGenerating) return;

    setIsGenerating(true);
    try {
      await onGenerateAnalysis(assignment.id);
    } catch (error) {
      console.error('Error generating analysis:', error);
      alert('AI analizi oluşturulurken bir hata oluştu.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Test Sonuçları</h2>
              <p className="text-purple-100 mt-1">{questionBank?.title || 'Soru Bankası Testi'}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border-l-4 border-purple-500">
            <div className="text-center mb-6">
              <div className={`text-6xl font-bold ${getPerformanceColor(percentage)}`}>
                {percentage}
                <span className="text-3xl">/100</span>
              </div>
              <p className={`text-xl font-semibold mt-2 ${getPerformanceColor(percentage)}`}>
                {getPerformanceLabel(percentage)}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-2xl font-bold text-green-600">{correctCount}</div>
                <div className="text-sm text-gray-600">Doğru</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-2xl font-bold text-red-600">{totalCount - correctCount}</div>
                <div className="text-sm text-gray-600">Yanlış</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-2xl font-bold text-gray-700">{totalCount}</div>
                <div className="text-sm text-gray-600">Toplam</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Konu:</span>
                <span className="ml-2 font-semibold">{questionBank?.subject || '-'}</span>
              </div>
              <div>
                <span className="text-gray-600">Sınıf:</span>
                <span className="ml-2 font-semibold">{questionBank?.grade || '-'}. Sınıf</span>
              </div>
              <div>
                <span className="text-gray-600">Ünite:</span>
                <span className="ml-2 font-semibold">{questionBank?.unit || '-'}</span>
              </div>
              {completedAt && (
                <div>
                  <span className="text-gray-600">Tamamlanma:</span>
                  <span className="ml-2 font-semibold">
                    {new Date(completedAt).toLocaleDateString('tr-TR')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {aiFeedback && (
            <div className="space-y-4">
              {aiFeedback.overall && (
                <div className="bg-blue-50 rounded-xl p-4 border-l-4 border-blue-500">
                  <h3 className="font-bold text-blue-900 mb-2 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                    </svg>
                    Genel Değerlendirme
                  </h3>
                  <p className="text-gray-700">{aiFeedback.overall}</p>
                </div>
              )}

              {aiFeedback.strengths && aiFeedback.strengths.length > 0 && (
                <div className="bg-green-50 rounded-xl p-4 border-l-4 border-green-500">
                  <h3 className="font-bold text-green-900 mb-2 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Güçlü Yönler
                  </h3>
                  <ul className="space-y-1">
                    {aiFeedback.strengths.map((strength, idx) => (
                      <li key={idx} className="text-gray-700 flex items-start">
                        <span className="text-green-600 mr-2">✓</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {aiFeedback.weaknesses && aiFeedback.weaknesses.length > 0 && (
                <div className="bg-yellow-50 rounded-xl p-4 border-l-4 border-yellow-500">
                  <h3 className="font-bold text-yellow-900 mb-2 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                    Geliştirilmesi Gereken Alanlar
                  </h3>
                  <ul className="space-y-1">
                    {aiFeedback.weaknesses.map((weakness, idx) => (
                      <li key={idx} className="text-gray-700 flex items-start">
                        <span className="text-yellow-600 mr-2">⚠</span>
                        <span>{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {aiFeedback.recommendations && aiFeedback.recommendations.length > 0 && (
                <div className="bg-purple-50 rounded-xl p-4 border-l-4 border-purple-500">
                  <h3 className="font-bold text-purple-900 mb-2 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                    </svg>
                    Öneriler
                  </h3>
                  <ul className="space-y-1">
                    {aiFeedback.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-gray-700 flex items-start">
                        <span className="text-purple-600 mr-2">💡</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {!aiFeedback && onGenerateAnalysis && (
            <div className="bg-gray-50 rounded-xl p-6 text-center">
              <p className="text-gray-500 mb-4">Bu test için henüz AI analizi oluşturulmadı.</p>
              <button
                onClick={handleGenerateAnalysis}
                disabled={isGenerating}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mx-auto"
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    AI Analizi Oluşturuluyor...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                    </svg>
                    AI Analizi Oluştur
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-gray-50 p-4 rounded-b-2xl border-t">
          <button
            onClick={onClose}
            className="w-full bg-gray-600 text-white py-3 rounded-xl font-semibold hover:bg-gray-700 transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestionBankResultModal;
