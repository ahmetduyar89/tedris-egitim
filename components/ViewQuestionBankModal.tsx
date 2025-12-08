import React, { useState } from 'react';
import { QuestionBank, QuestionBankQuestion } from '../types';

interface ViewQuestionBankModalProps {
  questionBank: QuestionBank;
  onClose: () => void;
}

const ViewQuestionBankModal: React.FC<ViewQuestionBankModalProps> = ({ questionBank, onClose }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const currentQuestion = questionBank.questions[currentQuestionIndex];
  const difficultyLabels = ['Çok Kolay', 'Kolay', 'Orta', 'Zor', 'Çok Zor'];

  const renderQuestion = (question: QuestionBankQuestion) => {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-lg font-semibold text-gray-800">{question.question}</p>
        </div>

        {question.type === 'multiple_choice' && (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700 mb-2">Şıklar:</p>
            {question.options?.map((option, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border-2 ${option === question.correct_answer
                    ? 'bg-green-50 border-green-500'
                    : 'bg-gray-50 border-gray-300'
                  }`}
              >
                <span className="font-semibold">{String.fromCharCode(65 + idx)})</span> {option}
                {option === question.correct_answer && (
                  <span className="ml-2 text-green-600 font-bold">✓ Doğru Cevap</span>
                )}
              </div>
            ))}
          </div>
        )}

        {question.type === 'true_false' && (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700 mb-2">Cevap:</p>
            <div
              className={`p-3 rounded-lg border-2 ${question.correct_answer === 'Doğru'
                  ? 'bg-green-50 border-green-500'
                  : 'bg-red-50 border-red-500'
                }`}
            >
              <span className="font-bold">{question.correct_answer}</span>
            </div>
          </div>
        )}

        {question.type === 'open_ended' && (
          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Örnek Cevap:</p>
              <div className="p-3 bg-green-50 border-2 border-green-500 rounded-lg">
                <p className="text-gray-800">{question.model_answer}</p>
              </div>
            </div>

            {question.rubric && question.rubric.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Değerlendirme Kriterleri:</p>
                <ul className="list-disc list-inside space-y-1 p-3 bg-blue-50 rounded-lg">
                  {question.rubric.map((criterion, idx) => (
                    <li key={idx} className="text-gray-700">{criterion}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {question.type === 'matching' && (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700 mb-2">Doğru Eşleştirmeler:</p>
            {question.left_items?.map((leftItem, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-green-50 border-2 border-green-500 rounded-lg">
                <div className="flex-1 font-semibold text-gray-800">{leftItem}</div>
                <span className="text-green-600 font-bold">↔</span>
                <div className="flex-1 font-semibold text-gray-800">
                  {question.correct_pairs?.[leftItem]}
                </div>
              </div>
            ))}
          </div>
        )}

        {question.explanation && (
          <div className="p-3 bg-yellow-50 border-2 border-yellow-400 rounded-lg">
            <p className="text-sm font-semibold text-gray-700 mb-1">Açıklama:</p>
            <p className="text-gray-700">{question.explanation}</p>
          </div>
        )}
      </div>
    );
  };

  const getQuestionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      multiple_choice: 'Çoktan Seçmeli',
      true_false: 'Doğru/Yanlış',
      open_ended: 'Açık Uçlu',
      matching: 'Eşleştirme'
    };
    return labels[type] || type;
  };

  const totalPoints = questionBank.questions.reduce((sum, q) => sum + q.points, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{questionBank.title}</h2>
              <div className="text-sm text-gray-600">
                {questionBank.subject} • {questionBank.grade}. Sınıf • {questionBank.unit}
                {questionBank.topic && ` • ${questionBank.topic}`}
              </div>
            </div>
            <button
              onClick={onClose}
              className="ml-4 text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-semibold">
              {questionBank.totalQuestions} Soru
            </span>
            <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full font-semibold">
              {totalPoints} Puan
            </span>
            <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full font-semibold">
              {difficultyLabels[questionBank.difficultyLevel - 1]}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">
                Soru {currentQuestionIndex + 1} / {questionBank.questions.length}
              </h3>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-600">
                  {getQuestionTypeLabel(currentQuestion.type)}
                </span>
                <span className="px-3 py-1 bg-primary text-white rounded-full text-sm font-bold">
                  {currentQuestion.points} Puan
                </span>
              </div>
            </div>

            {renderQuestion(currentQuestion)}
          </div>

          <div className="border-t pt-4 mt-6">
            <h4 className="text-sm font-bold text-gray-700 mb-3">Tüm Sorular:</h4>
            <div className="grid grid-cols-10 gap-2">
              {questionBank.questions.map((q, idx) => (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`aspect-square rounded-lg font-semibold text-sm transition-all ${idx === currentQuestionIndex
                      ? 'bg-primary text-white ring-2 ring-primary ring-offset-2'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  title={getQuestionTypeLabel(q.type)}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-between">
          <button
            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
            className="px-6 py-2 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← Önceki
          </button>

          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300"
          >
            Kapat
          </button>

          <button
            onClick={() => setCurrentQuestionIndex(prev => Math.min(questionBank.questions.length - 1, prev + 1))}
            disabled={currentQuestionIndex === questionBank.questions.length - 1}
            className="px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Sonraki →
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewQuestionBankModal;
