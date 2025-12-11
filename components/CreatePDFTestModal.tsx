import React, { useState } from 'react';
import { Student, Subject } from '../types';
import { createPDFTest, uploadPDFToStorage } from '../services/pdfTestService';

interface CreatePDFTestModalProps {
  student: Student;
  teacherId: string;
  onClose: () => void;
  onCreated: () => void;
}

const CreatePDFTestModal: React.FC<CreatePDFTestModalProps> = ({ student, teacherId, onClose, onCreated }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState<Subject>(Subject.Mathematics);
  const [unit, setUnit] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [totalQuestions, setTotalQuestions] = useState<number>(20);
  const [optionsPerQuestion, setOptionsPerQuestion] = useState<4 | 5>(5);
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [dueDate, setDueDate] = useState('');
  const [answerKey, setAnswerKey] = useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [sendWhatsApp, setSendWhatsApp] = useState(true);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf') {
        setPdfFile(file);
      } else {
        alert('Lütfen sadece PDF dosyası yükleyin.');
      }
    }
  };

  const handleAnswerChange = (questionNum: number, answer: string) => {
    setAnswerKey(prev => ({
      ...prev,
      [questionNum.toString()]: answer.toUpperCase()
    }));
  };

  const handleNextStep = () => {
    if (!title.trim()) {
      alert('Lütfen test başlığı girin.');
      return;
    }
    if (!pdfFile) {
      alert('Lütfen PDF dosyası yükleyin.');
      return;
    }
    if (totalQuestions < 1 || totalQuestions > 200) {
      alert('Soru sayısı 1 ile 200 arasında olmalıdır.');
      return;
    }
    if (durationMinutes < 1) {
      alert('Süre en az 1 dakika olmalıdır.');
      return;
    }

    const initialAnswerKey: Record<string, string> = {};
    for (let i = 1; i <= totalQuestions; i++) {
      initialAnswerKey[i.toString()] = '';
    }
    setAnswerKey(initialAnswerKey);
    setCurrentStep(2);
  };

  const handleSubmit = async () => {
    for (let i = 1; i <= totalQuestions; i++) {
      const answer = answerKey[i.toString()];
      if (!answer || answer.trim() === '') {
        alert(`Lütfen ${i}. sorunun cevabını girin.`);
        return;
      }
      const options = optionsPerQuestion === 4 ? ['A', 'B', 'C', 'D'] : ['A', 'B', 'C', 'D', 'E'];
      if (!options.includes(answer.toUpperCase())) {
        alert(`${i}. sorunun cevabı geçersiz. Lütfen ${options.join(', ')} seçeneklerinden birini girin.`);
        return;
      }
    }

    setIsUploading(true);
    try {
      const pdfUrl = await uploadPDFToStorage(pdfFile!, teacherId);

      await createPDFTest({
        teacherId,
        studentId: student.id,
        title,
        description,
        pdfUrl,
        totalQuestions,
        answerKey,
        optionsPerQuestion,
        durationMinutes,
        dueDate: dueDate || undefined,
        subject,
        unit,
        sendWhatsApp // Yeni parametre
      });

      onCreated();
      onClose();
    } catch (error) {
      console.error('PDF test oluşturma hatası:', error);
      alert('Test oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsUploading(false);
    }
  };

  const getOptions = () => {
    return optionsPerQuestion === 4 ? ['A', 'B', 'C', 'D'] : ['A', 'B', 'C', 'D', 'E'];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-6 rounded-t-2xl z-10">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">PDF Test Oluştur</h2>
              <p className="text-sm opacity-90 mt-1">{student.name} için</p>
            </div>
            <button onClick={onClose} className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex items-center justify-center mt-6 space-x-4">
            <div className={`flex items-center ${currentStep >= 1 ? 'text-white' : 'text-white text-opacity-50'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${currentStep >= 1 ? 'bg-white text-blue-600' : 'bg-white bg-opacity-30'}`}>1</div>
              <span className="ml-2 font-semibold">Test Bilgileri</span>
            </div>
            <div className="flex-1 h-0.5 bg-white bg-opacity-30"></div>
            <div className={`flex items-center ${currentStep >= 2 ? 'text-white' : 'text-white text-opacity-50'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${currentStep >= 2 ? 'bg-white text-blue-600' : 'bg-white bg-opacity-30'}`}>2</div>
              <span className="ml-2 font-semibold">Cevap Anahtarı</span>
            </div>
          </div>
        </div>

        <div className="p-6">
          {currentStep === 1 ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Test Başlığı *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Örn: Matematik Konu Testi"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Açıklama</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Test hakkında açıklama..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Ders *</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value as Subject)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={Subject.Mathematics}>Matematik</option>
                    <option value={Subject.Science}>Fen Bilimleri</option>
                    <option value={Subject.Turkish}>Türkçe</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Konu</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Örn: Kesirler"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">PDF Dosyası Yükle *</label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-500 transition-colors">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    id="pdf-upload"
                  />
                  <label htmlFor="pdf-upload" className="cursor-pointer">
                    <div className="flex flex-col items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-gray-400 mb-2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                      </svg>
                      {pdfFile ? (
                        <p className="text-green-600 font-semibold">{pdfFile.name}</p>
                      ) : (
                        <>
                          <p className="text-gray-600 font-semibold">PDF dosyanızı seçin</p>
                          <p className="text-sm text-gray-400 mt-1">veya sürükleyip bırakın</p>
                        </>
                      )}
                    </div>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Toplam Soru Sayısı *</label>
                  <input
                    type="number"
                    value={totalQuestions}
                    onChange={(e) => setTotalQuestions(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1"
                    max="200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Seçenek Sayısı *</label>
                  <select
                    value={optionsPerQuestion}
                    onChange={(e) => setOptionsPerQuestion(parseInt(e.target.value) as 4 | 5)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={4}>4 Seçenek (A-D)</option>
                    <option value={5}>5 Seçenek (A-E)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Süre (Dakika) *</label>
                  <input
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Son Teslim Tarihi</label>
                <input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="flex items-center space-x-2 cursor-pointer bg-green-50 p-3 rounded-xl border border-green-100">
                  <input
                    type="checkbox"
                    checked={sendWhatsApp}
                    onChange={(e) => setSendWhatsApp(e.target.checked)}
                    className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                  />
                  <div className="flex flex-col">
                    <span className="text-gray-800 font-medium flex items-center">
                      <span className="text-xl mr-2">📱</span>
                      WhatsApp Bildirimi Gönder
                    </span>
                    <span className="text-xs text-gray-500">Öğrenciye ve veliye WhatsApp üzerinden bilgilendirme yapılır.</span>
                  </div>
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={onClose}
                  className="px-6 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 font-semibold transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handleNextStep}
                  className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold transition-colors"
                >
                  Devam Et
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-800">
                  <strong>Not:</strong> Her soru için doğru cevabı {getOptions().join(', ')} seçeneklerinden biri olarak girin.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-96 overflow-y-auto p-2">
                {Array.from({ length: totalQuestions }, (_, i) => i + 1).map((questionNum) => (
                  <div key={questionNum} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <label className="block text-xs font-semibold text-gray-600 mb-2">Soru {questionNum}</label>
                    <div className="flex space-x-1">
                      {getOptions().map((option) => (
                        <button
                          key={option}
                          onClick={() => handleAnswerChange(questionNum, option)}
                          className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${answerKey[questionNum.toString()] === option
                              ? 'bg-blue-600 text-white shadow-lg'
                              : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100'
                            }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-6 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 font-semibold transition-colors"
                >
                  Geri
                </button>
                <div className="flex space-x-3">
                  <button
                    onClick={onClose}
                    className="px-6 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 font-semibold transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isUploading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isUploading ? 'Oluşturuluyor...' : 'Testi Oluştur'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreatePDFTestModal;
