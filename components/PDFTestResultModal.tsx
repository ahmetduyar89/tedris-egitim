import React from 'react';
import { PDFTest, PDFTestSubmission } from '../services/pdfTestService';
import OpticalFormAnswer from './OpticalFormAnswer';

interface PDFTestResultModalProps {
  test: PDFTest;
  submission: PDFTestSubmission;
  onClose: () => void;
}

const PDFTestResultModal: React.FC<PDFTestResultModalProps> = ({ test, submission, onClose }) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} dakika ${secs} saniye`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-6 rounded-t-2xl z-10">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">{test.title}</h2>
              <p className="text-sm opacity-90 mt-1">{test.subject} {test.unit && `- ${test.unit}`}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white bg-opacity-20 rounded-lg p-3">
              <div className="text-xs opacity-75 mb-1">Puan</div>
              <div className="text-2xl font-bold">{submission.scorePercentage?.toFixed(1)}%</div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-3">
              <div className="text-xs opacity-75 mb-1">Doğru</div>
              <div className="text-2xl font-bold text-green-300">{submission.correctCount}</div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-3">
              <div className="text-xs opacity-75 mb-1">Yanlış</div>
              <div className="text-2xl font-bold text-red-300">{submission.wrongCount}</div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-3">
              <div className="text-xs opacity-75 mb-1">Boş</div>
              <div className="text-2xl font-bold text-gray-300">{submission.emptyCount}</div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                  </svg>
                  Test Bilgileri
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Toplam Soru:</span>
                    <span className="font-semibold text-gray-800">{test.totalQuestions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Seçenek Sayısı:</span>
                    <span className="font-semibold text-gray-800">{test.optionsPerQuestion}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Test Süresi:</span>
                    <span className="font-semibold text-gray-800">{test.durationMinutes} dakika</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Harcanan Süre:</span>
                    <span className="font-semibold text-gray-800">{formatTime(submission.timeSpentSeconds)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                  Tarihler
                </h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600 block mb-1">Başlangıç:</span>
                    <span className="font-semibold text-gray-800">{formatDate(submission.startedAt)}</span>
                  </div>
                  {submission.submittedAt && (
                    <div>
                      <span className="text-gray-600 block mb-1">Teslim:</span>
                      <span className="font-semibold text-gray-800">{formatDate(submission.submittedAt)}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-600 block mb-1">Durum:</span>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      submission.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : submission.status === 'time_expired'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {submission.status === 'completed' ? 'Tamamlandı' : submission.status === 'time_expired' ? 'Süre Doldu' : 'Devam Ediyor'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Başarı Oranı
                </h3>
                <div className="relative pt-1">
                  <div className="flex mb-2 items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                        {submission.scorePercentage?.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-4 mb-4 text-xs flex rounded-full bg-blue-200">
                    <div
                      style={{ width: `${submission.scorePercentage}%` }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
                    ></div>
                  </div>
                </div>
                {submission.scorePercentage! >= 80 && (
                  <p className="text-sm text-green-700 font-semibold mt-2">Harika bir performans!</p>
                )}
                {submission.scorePercentage! >= 50 && submission.scorePercentage! < 80 && (
                  <p className="text-sm text-blue-700 font-semibold mt-2">İyi bir performans, biraz daha çalışarak daha iyi yapabilirsin!</p>
                )}
                {submission.scorePercentage! < 50 && (
                  <p className="text-sm text-yellow-700 font-semibold mt-2">Bu konuda daha fazla çalışma gerekiyor.</p>
                )}
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
              <OpticalFormAnswer
                totalQuestions={test.totalQuestions}
                optionsPerQuestion={test.optionsPerQuestion}
                answers={submission.studentAnswers}
                onAnswerChange={() => {}}
                readonly={true}
                correctAnswers={test.answerKey}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold transition-colors"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFTestResultModal;
