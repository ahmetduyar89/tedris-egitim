import React from 'react';

interface OpticalFormAnswerProps {
  totalQuestions: number;
  optionsPerQuestion: 4 | 5;
  answers: Record<string, string>;
  onAnswerChange: (questionNum: number, answer: string) => void;
  readonly?: boolean;
  correctAnswers?: Record<string, string>;
}

const OpticalFormAnswer: React.FC<OpticalFormAnswerProps> = ({
  totalQuestions,
  optionsPerQuestion,
  answers,
  onAnswerChange,
  readonly = false,
  correctAnswers,
}) => {
  const getOptions = () => {
    return optionsPerQuestion === 4 ? ['A', 'B', 'C', 'D'] : ['A', 'B', 'C', 'D', 'E'];
  };

  const options = getOptions();

  const isAnswered = (questionNum: number) => {
    return !!answers[questionNum.toString()];
  };

  const isCorrect = (questionNum: number) => {
    if (!correctAnswers) return null;
    const studentAnswer = answers[questionNum.toString()];
    const correctAnswer = correctAnswers[questionNum.toString()];
    if (!studentAnswer) return null;
    return studentAnswer.toUpperCase() === correctAnswer?.toUpperCase();
  };

  const getQuestionBackgroundColor = (questionNum: number) => {
    if (!correctAnswers) {
      return isAnswered(questionNum) ? 'bg-green-50' : 'bg-white';
    }

    const correct = isCorrect(questionNum);
    if (correct === null) return 'bg-gray-50';
    return correct ? 'bg-green-50' : 'bg-red-50';
  };

  const getQuestionBorderColor = (questionNum: number) => {
    if (!correctAnswers) {
      return isAnswered(questionNum) ? 'border-green-300' : 'border-gray-200';
    }

    const correct = isCorrect(questionNum);
    if (correct === null) return 'border-gray-300';
    return correct ? 'border-green-400' : 'border-red-400';
  };

  const getOptionStyle = (questionNum: number, option: string) => {
    const isSelected = answers[questionNum.toString()] === option;

    if (!correctAnswers) {
      if (isSelected) {
        return 'bg-blue-600 text-white border-blue-700 shadow-md transform scale-105';
      }
      return 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400';
    }

    const correctAnswer = correctAnswers[questionNum.toString()];
    const isCorrectOption = option === correctAnswer;

    if (isSelected && isCorrectOption) {
      return 'bg-green-600 text-white border-green-700 shadow-md';
    }
    if (isSelected && !isCorrectOption) {
      return 'bg-red-600 text-white border-red-700 shadow-md';
    }
    if (!isSelected && isCorrectOption) {
      return 'bg-green-100 text-green-800 border-green-400 ring-2 ring-green-300';
    }

    return 'bg-white text-gray-400 border-gray-200';
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-4 rounded-t-xl shadow-lg">
        <h3 className="text-lg font-bold flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 mr-2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
          </svg>
          Optik Form
        </h3>
        <p className="text-sm opacity-90 mt-1">
          {readonly ? 'Cevap Anahtarı ve Sonuçlar' : 'Cevaplarınızı işaretleyin'}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {Array.from({ length: totalQuestions }, (_, i) => i + 1).map((questionNum) => {
          const studentAnswer = answers[questionNum.toString()];
          const correctAnswer = correctAnswers?.[questionNum.toString()];
          const correct = isCorrect(questionNum);

          return (
            <div
              key={questionNum}
              className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${getQuestionBackgroundColor(questionNum)} ${getQuestionBorderColor(questionNum)}`}
            >
              <div className="flex items-center space-x-3 min-w-0 flex-shrink-0">
                <span className="font-bold text-gray-700 text-sm w-8 text-center flex-shrink-0">
                  {questionNum}
                </span>
                {correctAnswers && (
                  <div className="flex-shrink-0">
                    {correct === true && (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-green-600">
                        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                      </svg>
                    )}
                    {correct === false && (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-red-600">
                        <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z" clipRule="evenodd" />
                      </svg>
                    )}
                    {correct === null && studentAnswer && (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-gray-400">
                        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                )}
              </div>

              <div className="flex space-x-1 flex-shrink-0">
                {options.map((option) => (
                  <button
                    key={option}
                    onClick={() => !readonly && onAnswerChange(questionNum, option)}
                    disabled={readonly}
                    className={`w-10 h-10 rounded-lg font-bold text-sm border-2 transition-all ${getOptionStyle(questionNum, option)} ${
                      readonly ? 'cursor-default' : 'cursor-pointer active:scale-95'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {!readonly && (
        <div className="p-4 bg-white border-t border-gray-200 rounded-b-xl shadow-inner">
          <div className="flex items-center justify-between text-sm">
            <div className="flex space-x-4">
              <div className="flex items-center">
                <div className="w-4 h-4 rounded bg-green-500 mr-2"></div>
                <span className="text-gray-600">Cevaplanan: {Object.keys(answers).filter(k => answers[k]).length}</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded bg-gray-300 mr-2"></div>
                <span className="text-gray-600">Boş: {totalQuestions - Object.keys(answers).filter(k => answers[k]).length}</span>
              </div>
            </div>
            <span className="font-bold text-gray-700">Toplam: {totalQuestions}</span>
          </div>
        </div>
      )}

      {readonly && correctAnswers && (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-t border-blue-200 rounded-b-xl">
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Doğru</span>
                <span className="font-bold text-green-600 text-lg">
                  {Object.keys(answers).filter(k => answers[k] && answers[k].toUpperCase() === correctAnswers[k]?.toUpperCase()).length}
                </span>
              </div>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Yanlış</span>
                <span className="font-bold text-red-600 text-lg">
                  {Object.keys(answers).filter(k => answers[k] && answers[k].toUpperCase() !== correctAnswers[k]?.toUpperCase()).length}
                </span>
              </div>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Boş</span>
                <span className="font-bold text-gray-600 text-lg">
                  {totalQuestions - Object.keys(answers).filter(k => answers[k]).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpticalFormAnswer;
