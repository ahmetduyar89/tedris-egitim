import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import OpticalFormAnswer from '../components/OpticalFormAnswer';
import {
  PDFTest,
  getPDFTest,
  startPDFTest,
  savePDFTestProgress,
  submitPDFTest,
  getSubmissionForTest,
  PDFTestSubmission
} from '../services/pdfTestService';


interface PDFTestTakingPageProps {
  user: User;
  testId: string;
  onBack: () => void;
  onComplete: () => void;
}

const PDFTestTakingPage: React.FC<PDFTestTakingPageProps> = ({ user, testId, onBack, onComplete }) => {
  const [test, setTest] = useState<PDFTest | null>(null);
  const [submission, setSubmission] = useState<PDFTestSubmission | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | null>(null);
  const hasLoadedRef = useRef(false);
  const isLoadingDataRef = useRef(false);
  const [pdfLoadError, setPdfLoadError] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (hasLoadedRef.current || isLoadingDataRef.current) {
      return;
    }

    hasLoadedRef.current = true;
    loadTestData();

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (submission?.status === 'started') {
        e.preventDefault();
        e.returnValue = 'Test devam ediyor. Sayfadan çıkmak istediğinizden emin misiniz?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const loadTestData = async () => {
    if (isLoadingDataRef.current) {
      return;
    }

    isLoadingDataRef.current = true;

    try {
      console.log('[PDFTestTakingPage] Loading test:', testId);
      const testData = await getPDFTest(testId);
      if (!testData) {
        alert('Test bulunamadı.');
        onBack();
        return;
      }

      console.log('[PDFTestTakingPage] Test data loaded:', {
        id: testData.id,
        title: testData.title,
        totalQuestions: testData.totalQuestions,
        durationMinutes: testData.durationMinutes,
        optionsPerQuestion: testData.optionsPerQuestion,
        pdfUrl: testData.pdfUrl ? 'exists' : 'missing',
        fullPdfUrl: testData.pdfUrl
      });

      if (!testData.pdfUrl) {
        console.error('[PDFTestTakingPage] No PDF URL found in test data');
        setPdfLoadError(true);
      }

      setTest(testData);

      let submissionData = await getSubmissionForTest(testId, user.id);

      if (!submissionData) {
        submissionData = await startPDFTest(testId, user.id);
      }

      if (submissionData.status !== 'started') {
        alert('Bu test zaten tamamlanmış.');
        onBack();
        return;
      }

      setSubmission(submissionData);
      setAnswers(submissionData.studentAnswers || {});

      const durationMinutes = testData.durationMinutes || 0;
      const startTime = new Date(submissionData.startedAt).getTime();
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - startTime) / 1000);
      const remainingSeconds = Math.max(0, (durationMinutes * 60) - elapsedSeconds);

      console.log('[PDFTestTakingPage] Timer calculation:', {
        durationMinutes,
        startTime: submissionData.startedAt,
        elapsedSeconds,
        remainingSeconds
      });

      setTimeRemaining(remainingSeconds);
      setIsLoading(false);

      if (remainingSeconds > 0) {
        startTimer(remainingSeconds);
      } else {
        handleTimeExpired();
      }
    } catch (error) {
      console.error('Test yükleme hatası:', error);
      alert('Test yüklenirken bir hata oluştu.');
      onBack();
    } finally {
      isLoadingDataRef.current = false;
    }
  };

  const startTimer = (initialTime: number) => {
    let currentTime = initialTime;

    intervalRef.current = setInterval(() => {
      currentTime--;
      setTimeRemaining(currentTime);

      if (currentTime <= 0) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        handleTimeExpired();
      }
    }, 1000);
  };

  const handleTimeExpired = async () => {
    if (!submission || !test) return;

    setIsSubmitting(true);
    try {
      const startTime = new Date(submission.startedAt).getTime();
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);

      await submitPDFTest(
        submission.id,
        answers,
        timeSpent,
        'time_expired',
        test.answerKey,
        test.totalQuestions
      );

      alert('Süre doldu! Testiniz otomatik olarak kaydedildi.');
      onComplete();
    } catch (error) {
      console.error('Test gönderme hatası:', error);
      alert('Test gönderilirken bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAnswerChange = async (questionNum: number, answer: string) => {
    const newAnswers = { ...answers, [questionNum.toString()]: answer };
    setAnswers(newAnswers);

    if (submission) {
      setAutoSaveStatus('saving');
      try {
        const startTime = new Date(submission.startedAt).getTime();
        const timeSpent = Math.floor((Date.now() - startTime) / 1000);
        await savePDFTestProgress(submission.id, newAnswers, timeSpent);
        setAutoSaveStatus('saved');
        setTimeout(() => setAutoSaveStatus(null), 2000);
      } catch (error) {
        console.error('Otomatik kaydetme hatası:', error);
        setAutoSaveStatus(null);
      }
    }
  };

  const handleSubmit = () => {
    const unansweredCount = test!.totalQuestions - Object.keys(answers).filter(k => answers[k]).length;
    if (unansweredCount > 0) {
      setShowConfirmModal(true);
    } else {
      confirmSubmit();
    }
  };

  const confirmSubmit = async () => {
    if (!submission || !test) return;

    setShowConfirmModal(false);
    setIsSubmitting(true);

    try {
      const startTime = new Date(submission.startedAt).getTime();
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);

      await submitPDFTest(
        submission.id,
        answers,
        timeSpent,
        'completed',
        test.answerKey,
        test.totalQuestions
      );



      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      alert('Test başarıyla teslim edildi!');
      onComplete();
    } catch (error) {
      console.error('Test gönderme hatası:', error);
      alert('Test gönderilirken bir hata oluştu.');
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) {
      return '00:00';
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (!timeRemaining || isNaN(timeRemaining)) return 'text-gray-600';
    if (timeRemaining > 300) return 'text-green-600';
    if (timeRemaining > 60) return 'text-yellow-600';
    return 'text-red-600 animate-pulse';
  };

  if (isLoading || !test || !submission) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Test yükleniyor...</p>
        </div>
      </div>
    );
  }

  const unansweredCount = test.totalQuestions - Object.keys(answers).filter(k => answers[k]).length;

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <header className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{test.title}</h1>
              <p className="text-sm opacity-90 mt-1">{test.subject} {test.unit && `- ${test.unit}`}</p>
            </div>

            <div className="flex items-center space-x-6">
              {autoSaveStatus && (
                <div className="flex items-center text-sm bg-white bg-opacity-20 px-3 py-1 rounded-lg">
                  {autoSaveStatus === 'saving' ? (
                    <>
                      <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Kaydediliyor...</span>
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 mr-2">
                        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                      </svg>
                      <span>Kaydedildi</span>
                    </>
                  )}
                </div>
              )}

              <div className="bg-white bg-opacity-20 px-4 py-2 rounded-lg">
                <div className="flex items-center space-x-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  <span className={`text-xl font-bold ${getTimerColor()}`}>
                    {formatTime(timeRemaining)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col lg:flex-row max-w-[2000px] mx-auto w-full p-2 md:p-4 gap-2 md:gap-4 h-full">
          {/* PDF Viewer - Takes more space on desktop */}
          <div className="flex-1 lg:flex-[2] bg-white rounded-xl shadow-lg overflow-hidden flex flex-col min-h-0">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-red-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
                <h3 className="font-bold text-gray-800">Test Dokümanı</h3>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold">{test.totalQuestions} Soru</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const iframe = iframeRef.current;
                    if (iframe) {
                      if (document.fullscreenElement) {
                        document.exitFullscreen();
                      } else {
                        iframe.requestFullscreen();
                      }
                    }
                  }}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                  title="Tam Ekran"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                  </svg>
                </button>
                {test.pdfUrl && (
                  <a
                    href={test.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    title="Yeni Sekmede Aç"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-auto relative bg-gray-50">
              {test.pdfUrl && !pdfLoadError ? (
                <>
                  {pdfLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600 font-semibold text-lg">PDF yükleniyor...</p>
                        <p className="text-gray-500 text-sm mt-2">Bu birkaç saniye sürebilir</p>
                      </div>
                    </div>
                  )}
                  <iframe
                    ref={iframeRef}
                    src={`${test.pdfUrl}#view=FitH&toolbar=1&navpanes=0`}
                    className="w-full h-full border-0 min-h-[600px]"
                    title="Test PDF"
                    onLoad={() => {
                      console.log('[PDFTestTakingPage] PDF loaded successfully');
                      setPdfLoading(false);
                      setPdfLoadError(false);
                    }}
                    onError={() => {
                      console.error('[PDFTestTakingPage] PDF failed to load');
                      setPdfLoading(false);
                      setPdfLoadError(true);
                    }}
                  />
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 p-6">
                  <div className="text-center max-w-md">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-20 h-20 mx-auto mb-4 text-red-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                    </svg>
                    <p className="font-bold text-gray-800 mb-2 text-lg">PDF Yüklenemedi</p>
                    <p className="text-sm text-gray-600 mb-4">
                      Test PDF dosyası şu anda görüntülenemiyor. Lütfen öğretmeninizle iletişime geçin.
                    </p>
                    {test.pdfUrl && (
                      <a
                        href={test.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold shadow-md"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 mr-2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                        PDF'i İndir
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Answer Sheet - Compact on desktop */}
          <div className="w-full lg:w-[400px] xl:w-[450px] bg-white rounded-xl shadow-lg overflow-hidden flex flex-col min-h-[400px] lg:min-h-0">
            {test.totalQuestions > 0 ? (
              <OpticalFormAnswer
                totalQuestions={test.totalQuestions}
                optionsPerQuestion={test.optionsPerQuestion}
                answers={answers}
                onAnswerChange={handleAnswerChange}
                readonly={false}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 p-6">
                <div className="text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mx-auto mb-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
                  </svg>
                  <p className="font-semibold">Soru sayısı tanımlanmamış</p>
                  <p className="text-sm mt-2">Test oluşturulurken soru sayısı belirtilmemiş</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="px-6 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 font-semibold transition-colors"
              disabled={isSubmitting}
            >
              Vazgeç
            </button>

            <div className="flex items-center space-x-4">
              {unansweredCount > 0 && (
                <span className="text-yellow-600 font-semibold text-sm">
                  {unansweredCount} soru boş bırakıldı
                </span>
              )}
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 font-bold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Gönderiliyor...' : 'Testi Tamamla'}
              </button>
            </div>
          </div>
        </div>
      </footer>

      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-yellow-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
              </div>
            </div>

            <h3 className="text-xl font-bold text-gray-800 text-center mb-2">Boş Sorular Var</h3>
            <p className="text-gray-600 text-center mb-6">
              {unansweredCount} soru boş bırakıldı. Yine de testi teslim etmek istiyor musunuz?
            </p>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 font-semibold transition-colors"
              >
                İptal
              </button>
              <button
                onClick={confirmSubmit}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold transition-colors"
              >
                Teslim Et
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFTestTakingPage;
