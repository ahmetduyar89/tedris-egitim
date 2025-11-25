import React, { useState, useEffect, useCallback } from 'react';
import { User, QuestionBankAssignment, QuestionBankQuestion } from '../types';
import { db, supabase } from '../services/dbAdapter';
import { calculateScore } from '../services/questionBankService';

interface QuestionBankTestPageProps {
  user: User;
  assignmentId: string;
  onBack: () => void;
  onComplete: () => void;
}

const QuestionBankTestPage: React.FC<QuestionBankTestPageProps> = ({ user, assignmentId, onBack, onComplete }) => {
  const [assignment, setAssignment] = useState<QuestionBankAssignment | null>(null);
  const [questionBankTitle, setQuestionBankTitle] = useState<string>('Test');
  const [questions, setQuestions] = useState<QuestionBankQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [markedQuestions, setMarkedQuestions] = useState<Set<string>>(new Set());
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadAssignment();
  }, [assignmentId]);

  const loadAssignment = async () => {
    try {
      console.log('🔍 Assignment yükleniyor:', assignmentId);

      // Use direct Supabase query instead of dbAdapter
      const { data: assignmentDataRaw, error: assignmentError } = await supabase
        .from('question_bank_assignments')
        .select('*')
        .eq('id', assignmentId)
        .single();

      if (assignmentError || !assignmentDataRaw) {
        console.error('❌ Assignment bulunamadı:', assignmentId, assignmentError);
        alert('Test bulunamadı. Bu test silinmiş veya size atanmamış olabilir.');
        onBack();
        return;
      }

      console.log('✅ Assignment verisi:', assignmentDataRaw);

      const assignment: QuestionBankAssignment = {
        id: assignmentDataRaw.id,
        questionBankId: assignmentDataRaw.question_bank_id,
        studentId: assignmentDataRaw.student_id,
        teacherId: assignmentDataRaw.teacher_id,
        assignedAt: assignmentDataRaw.assigned_at,
        applicationDate: assignmentDataRaw.application_date,
        timeLimitMinutes: assignmentDataRaw.time_limit_minutes,
        startedAt: assignmentDataRaw.started_at,
        completedAt: assignmentDataRaw.completed_at,
        answers: assignmentDataRaw.answers || {},
        score: assignmentDataRaw.score,
        totalCorrect: assignmentDataRaw.total_correct,
        totalQuestions: assignmentDataRaw.total_questions,
        status: assignmentDataRaw.status,
        aiFeedback: assignmentDataRaw.ai_feedback
      };

      console.log('🔍 Soru bankası yükleniyor:', assignment.questionBankId);

      // Use direct Supabase query for question bank
      const { data: qbData, error: qbError } = await supabase
        .from('question_banks')
        .select('*')
        .eq('id', assignment.questionBankId)
        .single();

      if (qbError || !qbData) {
        console.error('❌ Soru bankası bulunamadı:', assignment.questionBankId, qbError);
        console.error('❌ Öğrenci erişim yetkisi olmayabilir veya soru bankası silinmiş olabilir');
        alert('Soru bankası bulunamadı. Lütfen öğretmeninizle iletişime geçin.');
        onBack();
        return;
      }

      console.log('✅ Soru bankası RAW verisi:', qbData);
      console.log('✅ Questions field type:', typeof qbData.questions);
      console.log('✅ Questions is array?:', Array.isArray(qbData.questions));
      console.log('✅ Questions keys (if object):', qbData.questions && typeof qbData.questions === 'object' ? Object.keys(qbData.questions) : 'N/A');
      console.log('✅ Soru bankası özet:', {
        title: qbData.title,
        totalQuestions: qbData.total_questions,
        questionsArrayLength: qbData.questions?.length,
        hasQuestionsArray: Array.isArray(qbData.questions),
        firstQuestionSample: qbData.questions?.[0]
      });

      if (!qbData.questions || !Array.isArray(qbData.questions)) {
        console.error('❌ SORU DİZİSİ BULUNAMADI veya ARRAY DEĞİL:', qbData);
        alert('Soru bankasında soru bulunamadı. Lütfen öğretmeninizle iletişime geçin.');
        onBack();
        return;
      }

      if (qbData.questions.length === 0) {
        console.error('❌ SORU DİZİSİ BOŞ');
        alert('Bu soru bankasında hiç soru bulunmuyor. Lütfen öğretmeninizle iletişime geçin.');
        onBack();
        return;
      }

      const questionsList = (qbData.questions || []).map((q: any, idx: number) => {
        console.log(`\n🔍 RAW SORU ${idx + 1} OBJESİ:`, JSON.stringify(q, null, 2));
        console.log(`Soru objesi key'leri:`, Object.keys(q));

        const question = q.question || q.questionText || q.text || q.content || '';

        if (!question || question.trim() === '') {
          console.error(`❌ SORU ${idx + 1} METNİ BULUNAMADI:`, q);
          console.error('Soru nesnesi:', JSON.stringify(q, null, 2));
          console.error('Tüm field değerleri:', {
            question: q.question,
            questionText: q.questionText,
            text: q.text,
            content: q.content,
            allKeys: Object.keys(q)
          });
        }

        const questionType = q.type || 'multiple_choice';
        const questionId = q.id || `q_${idx}_${Date.now()}`;

        console.log(`📝 Soru ${idx + 1} işleniyor:`, {
          id: questionId,
          originalType: q.type,
          finalType: questionType,
          hasQuestion: !!question,
          questionLength: question?.length || 0,
          questionPreview: question?.substring(0, 50) || 'BOŞ',
          hasOptions: Array.isArray(q.options) && q.options.length > 0
        });

        return {
          id: questionId,
          type: questionType,
          question: question || `Soru ${idx + 1} yüklenmedi`,
          difficulty: q.difficulty || 1,
          points: q.points || 5,
          explanation: q.explanation || '',
          options: Array.isArray(q.options) ? q.options : [],
          correct_answer: q.correct_answer || q.correctAnswer || '',
          left_items: q.left_items || q.leftItems || [],
          right_items: q.right_items || q.rightItems || [],
          topic: q.topic || qbData.topic || qbData.unit || 'Genel'
        };
      });

      console.log('✅ Toplam işlenen soru sayısı:', questionsList.length);
      const emptyQuestions = questionsList.filter(q => !q.question || q.question.trim() === '' || q.question.includes('yüklenmedi'));
      if (emptyQuestions.length > 0) {
        console.error(`❌ ${emptyQuestions.length} adet boş/hatalı soru bulundu:`, emptyQuestions);
        if (emptyQuestions.length === questionsList.length) {
          alert('HATA: Hiçbir sorunun metni yüklenemedi. Lütfen sayfayı yenileyip tekrar deneyin.');
          onBack();
          return;
        }
        alert(`Uyarı: ${emptyQuestions.length} soruda metin eksik. Bu soruları atlayabilirsiniz.`);
      }

      setAssignment(assignment);
      setQuestionBankTitle(qbData.title || 'Test');
      setQuestions(questionsList);
      setAnswers(assignment.answers);

      console.log('✅ State güncellendi:', {
        assignmentId: assignment.id,
        questionCount: questionsList.length,
        title: qbData.title,
        status: assignment.status
      });

      // Test zaten tamamlanmışsa geri dön
      if (assignment.status === 'Tamamlandı' || assignment.completedAt) {
        alert('Bu test zaten tamamlanmış. Sonuçları görmek için tamamlanan testler bölümünü kontrol edin.');
        onBack();
        return;
      }

      if (assignment.status === 'Atandı') {
        await db.collection('question_bank_assignments').doc(assignmentId).update({
          started_at: new Date().toISOString(),
          status: 'Devam Ediyor'
        });

        if (assignment.timeLimitMinutes) {
          setTimeRemaining(assignment.timeLimitMinutes * 60);
        }
      } else if (assignment.status === 'Devam Ediyor' && assignment.timeLimitMinutes && assignment.startedAt) {
        const startTime = new Date(assignment.startedAt).getTime();
        const currentTime = Date.now();
        const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
        const totalSeconds = assignment.timeLimitMinutes * 60;
        const remaining = totalSeconds - elapsedSeconds;

        if (remaining > 0) {
          setTimeRemaining(remaining);
        } else {
          handleSubmit(true);
        }
      }
    } catch (error) {
      console.error('❌ FATAL: Test yüklenirken kritik hata:', error);
      if (error instanceof Error) {
        console.error('Hata mesajı:', error.message);
        console.error('Hata stack:', error.stack);
      }
      alert('Test yüklenirken bir hata oluştu. Lütfen sayfayı yenileyip tekrar deneyin.\n\nEğer sorun devam ederse öğretmeninizle iletişime geçin.');
      onBack();
    }
  };

  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 1) {
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswer = (questionId: string, answer: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const toggleMark = (questionId: string) => {
    setMarkedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (!autoSubmit) {
      const unanswered = questions.filter(q => !answers[q.id]).length;
      if (unanswered > 0) {
        if (!confirm(`${unanswered} soru cevaplanmadı. Testi bitirmek istediğinize emin misiniz?`)) {
          return;
        }
      } else {
        if (!confirm('Testi bitirmek istediğinize emin misiniz?')) {
          return;
        }
      }
    }

    setIsSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        alert('Oturum bulunamadı. Lütfen tekrar giriş yapın.');
        onBack();
        return;
      }

      const formattedAnswers = questions.map(q => ({
        questionId: q.id,
        selectedAnswer: answers[q.id] || ''
      }));

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-question-bank-test`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            assignmentId: assignmentId,
            answers: formattedAnswers
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Test gönderilemedi';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();

      if (result.success) {
        const { score, correctCount, totalQuestions, percentage, updatedModules, masteryUpdated } = result.result;

        let alertMessage = `🎉 Test Tamamlandı!\n\n` +
          `📊 Puanınız: ${score}/100\n` +
          `✅ Doğru: ${correctCount}/${totalQuestions}\n` +
          `📈 Başarı Oranı: %${percentage}`;

        if (masteryUpdated && updatedModules && updatedModules.length > 0) {
          alertMessage += `\n\n📚 Yeterlilik Haritası Güncellendi:\n`;
          updatedModules.slice(0, 3).forEach((mod: any) => {
            const change = mod.newScore - mod.previousScore;
            const arrow = change > 0 ? '📈' : change < 0 ? '📉' : '➡️';
            alertMessage += `${arrow} ${mod.moduleName}: ${mod.previousScore}% → ${mod.newScore}%\n`;
          });

          if (updatedModules.length > 3) {
            alertMessage += `\n...ve ${updatedModules.length - 3} konu daha`;
          }

          alertMessage += `\n\n💡 Öğrenme Haritası sayfasında detayları görebilirsin!`;
        }

        alert(alertMessage);

        onComplete();
      }
    } catch (error: any) {
      console.error('Error submitting test:', error);
      const errorMessage = error?.message || 'Test gönderilirken bir hata oluştu';
      alert(`❌ Hata: ${errorMessage}\n\nLütfen tekrar deneyin veya öğretmeninizle iletişime geçin.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!assignment || questions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / questions.length) * 100;

  console.log('🎯 Render edilen soru:', {
    index: currentQuestionIndex,
    id: currentQuestion?.id,
    type: currentQuestion?.type,
    hasQuestion: !!currentQuestion?.question,
    hasOptions: Array.isArray(currentQuestion?.options) && currentQuestion.options.length > 0,
    questionText: currentQuestion?.question?.substring(0, 80)
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white text-center py-2 font-bold text-sm">
        TEST SAYFASI v2.1 - GÜNCEL KOD
      </div>
      <header className="bg-white shadow-md p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">{questionBankTitle}</h1>
          {timeRemaining !== null && (
            <div className={`text-xl font-bold ${timeRemaining < 300 ? 'text-red-600' : 'text-primary'}`}>
              ⏱️ {formatTime(timeRemaining)}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-gray-600">
              Soru {currentQuestionIndex + 1} / {questions.length}
            </span>
            <span className="text-sm font-semibold text-primary">
              {currentQuestion.points} Puan
            </span>
          </div>

          <div className="mb-2">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          <div className="mb-8">
            <div className="bg-blue-50 border-2 border-blue-300 p-6 rounded-xl mb-6 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="text-3xl">❓</span>
                <div className="flex-1">
                  {currentQuestion.question ? (
                    <p className="text-xl text-gray-900 font-bold leading-relaxed">
                      {currentQuestion.question}
                    </p>
                  ) : (
                    <p className="text-red-600 font-bold text-lg">
                      ⚠️ HATA: Soru metni bulunamadı! Lütfen öğretmeninizle iletişime geçin.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {currentQuestion.type === 'multiple_choice' && (
              <div className="space-y-3">
                {currentQuestion.options?.map((option, idx) => (
                  <label
                    key={idx}
                    className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${answers[currentQuestion.id] === option
                      ? 'border-primary bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                      }`}
                  >
                    <input
                      type="radio"
                      name={`q-${currentQuestion.id}`}
                      checked={answers[currentQuestion.id] === option}
                      onChange={() => handleAnswer(currentQuestion.id, option)}
                      className="w-5 h-5 text-primary"
                    />
                    <span className="text-gray-800">{option}</span>
                  </label>
                ))}
              </div>
            )}

            {currentQuestion.type === 'true_false' && (
              <div className="space-y-3">
                {['Doğru', 'Yanlış'].map(option => (
                  <label
                    key={option}
                    className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${answers[currentQuestion.id] === option
                      ? 'border-primary bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                      }`}
                  >
                    <input
                      type="radio"
                      name={`q-${currentQuestion.id}`}
                      checked={answers[currentQuestion.id] === option}
                      onChange={() => handleAnswer(currentQuestion.id, option)}
                      className="w-5 h-5 text-primary"
                    />
                    <span className="text-gray-800">{option}</span>
                  </label>
                ))}
              </div>
            )}

            {currentQuestion.type === 'open_ended' && (
              <textarea
                value={answers[currentQuestion.id] || ''}
                onChange={e => handleAnswer(currentQuestion.id, e.target.value)}
                rows={8}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="Cevabınızı buraya yazın..."
              />
            )}

            {currentQuestion.type === 'matching' && (
              <div className="space-y-4">
                {currentQuestion.left_items?.map((leftItem, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <div className="flex-1 p-3 bg-blue-50 rounded-lg font-semibold text-gray-800">
                      {leftItem}
                    </div>
                    <span className="text-gray-400">↔</span>
                    <select
                      value={answers[currentQuestion.id]?.[leftItem] || ''}
                      onChange={e => {
                        const newPairs = { ...(answers[currentQuestion.id] || {}), [leftItem]: e.target.value };
                        handleAnswer(currentQuestion.id, newPairs);
                      }}
                      className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Seçiniz...</option>
                      {currentQuestion.right_items?.map((rightItem, ridx) => (
                        <option key={ridx} value={rightItem}>{rightItem}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-4 pt-6 border-t">
            <button
              onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
              className="px-6 py-2 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ← Önceki
            </button>

            <button
              onClick={() => toggleMark(currentQuestion.id)}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${markedQuestions.has(currentQuestion.id)
                ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-400'
                : 'bg-gray-100 text-gray-600 border-2 border-gray-300 hover:bg-gray-200'
                }`}
            >
              {markedQuestions.has(currentQuestion.id) ? '🚩 İşaretli' : 'İşaretle'}
            </button>

            {currentQuestionIndex < questions.length - 1 ? (
              <button
                onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                className="px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark"
              >
                Sonraki →
              </button>
            ) : (
              <button
                onClick={() => handleSubmit()}
                disabled={isSubmitting}
                className="px-6 py-2 bg-accent text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Gönderiliyor...' : 'Testi Bitir'}
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Soru Haritası</h3>
          <div className="grid grid-cols-10 gap-2">
            {questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestionIndex(idx)}
                className={`aspect-square rounded-lg font-semibold text-sm transition-all ${idx === currentQuestionIndex
                  ? 'bg-primary text-white ring-2 ring-primary ring-offset-2'
                  : answers[q.id]
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : markedQuestions.has(q.id)
                      ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 rounded"></div>
              <span className="text-gray-600">Cevaplandı ({answeredCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-100 rounded"></div>
              <span className="text-gray-600">İşaretli ({markedQuestions.size})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-100 rounded"></div>
              <span className="text-gray-600">Cevaplanmadı ({questions.length - answeredCount})</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default QuestionBankTestPage;
