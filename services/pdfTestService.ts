import { db, supabase } from './dbAdapter';
import { createNotification } from './notificationService';
import mistakeService from './mistakesService';

export interface PDFTest {
  id: string;
  teacherId: string;
  studentId: string;
  title: string;
  description: string;
  pdfUrl: string;
  totalQuestions: number;
  answerKey: Record<string, string>;
  optionsPerQuestion: 4 | 5;
  durationMinutes: number;
  dueDate?: string;
  subject: string;
  unit: string;
  createdAt: string;
}

export interface PDFTestSubmission {
  id: string;
  pdfTestId: string;
  studentId: string;
  studentAnswers: Record<string, string>;
  startedAt: string;
  submittedAt?: string;
  timeSpentSeconds: number;
  scorePercentage?: number;
  correctCount: number;
  wrongCount: number;
  emptyCount: number;
  status: 'started' | 'completed' | 'time_expired';
  createdAt: string;
  pdfTest?: PDFTest;
}

export const uploadPDFToStorage = async (file: File, teacherId: string): Promise<string> => {
  console.log('[pdfTestService] Starting PDF upload:', {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    teacherId
  });

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    console.error('[pdfTestService] No session found');
    throw new Error('Oturum bulunamadı');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('teacherId', teacherId);

  const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-pdf`;
  console.log('[pdfTestService] Uploading to:', apiUrl);

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: formData,
  });

  console.log('[pdfTestService] Upload response status:', response.status);

  if (!response.ok) {
    const errorData = await response.json();
    console.error('[pdfTestService] Upload failed:', errorData);
    throw new Error(`PDF yükleme hatası: ${errorData.error || 'Bilinmeyen hata'}`);
  }

  const { publicUrl } = await response.json();
  console.log('[pdfTestService] PDF uploaded successfully:', publicUrl);

  if (!publicUrl) {
    console.error('[pdfTestService] No public URL returned');
    throw new Error('PDF URL alınamadı');
  }

  return publicUrl;
};

export const createPDFTest = async (test: Omit<PDFTest, 'id' | 'createdAt'>): Promise<PDFTest> => {
  try {
    const testData = {
      teacher_id: test.teacherId,
      student_id: test.studentId,
      title: test.title,
      description: test.description || '',
      pdf_url: test.pdfUrl,
      total_questions: test.totalQuestions,
      answer_key: test.answerKey,
      options_per_question: test.optionsPerQuestion,
      duration_minutes: test.durationMinutes,
      due_date: test.dueDate || null,
      subject: test.subject || '',
      unit: test.unit || '',
    };

    const docRef = await db.collection('pdf_tests').add(testData);

    await createNotification(
      test.studentId,
      `'${test.title}' başlıklı yeni bir PDF test atandı.`,
      'test',
      docRef.id
    );

    return {
      id: docRef.id,
      ...test,
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error creating PDF test:', error);
    throw error;
  }
};

export const getPDFTestsForStudent = async (studentId: string): Promise<PDFTest[]> => {
  try {
    const snapshot = await db.collection('pdf_tests')
      .where('student_id', '==', studentId)
      .get();

    return snapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        teacherId: data.teacher_id || data.teacherId,
        studentId: data.student_id || data.studentId,
        title: data.title,
        description: data.description || '',
        pdfUrl: data.pdf_url || data.pdfUrl,
        totalQuestions: data.total_questions || data.totalQuestions,
        answerKey: data.answer_key || data.answerKey || {},
        optionsPerQuestion: data.options_per_question || data.optionsPerQuestion,
        durationMinutes: data.duration_minutes || data.durationMinutes,
        dueDate: data.due_date || data.dueDate,
        subject: data.subject || '',
        unit: data.unit || '',
        createdAt: data.created_at || data.createdAt,
      };
    });
  } catch (error) {
    console.error('Error fetching PDF tests:', error);
    throw error;
  }
};

export const getPDFTestsForTeacher = async (teacherId: string): Promise<PDFTest[]> => {
  try {
    const snapshot = await db.collection('pdf_tests')
      .where('teacher_id', '==', teacherId)
      .get();

    return snapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        teacherId: data.teacher_id || data.teacherId,
        studentId: data.student_id || data.studentId,
        title: data.title,
        description: data.description || '',
        pdfUrl: data.pdf_url || data.pdfUrl,
        totalQuestions: data.total_questions || data.totalQuestions,
        answerKey: data.answer_key || data.answerKey || {},
        optionsPerQuestion: data.options_per_question || data.optionsPerQuestion,
        durationMinutes: data.duration_minutes || data.durationMinutes,
        dueDate: data.due_date || data.dueDate,
        subject: data.subject || '',
        unit: data.unit || '',
        createdAt: data.created_at || data.createdAt,
      };
    });
  } catch (error) {
    console.error('Error fetching PDF tests for teacher:', error);
    throw error;
  }
};

export const getPDFTest = async (testId: string): Promise<PDFTest | null> => {
  try {
    console.log('[pdfTestService] Fetching PDF test:', testId);
    const doc = await db.collection('pdf_tests').doc(testId).get();

    if (!doc.exists) {
      console.warn('[pdfTestService] PDF test not found:', testId);
      return null;
    }

    const data = doc.data();
    console.log('[pdfTestService] PDF test data retrieved:', {
      id: doc.id,
      hasPdfUrl: !!(data.pdf_url || data.pdfUrl),
      pdfUrl: data.pdf_url || data.pdfUrl,
      totalQuestions: data.total_questions || data.totalQuestions
    });

    return {
      id: doc.id,
      teacherId: data.teacher_id || data.teacherId,
      studentId: data.student_id || data.studentId,
      title: data.title,
      description: data.description || '',
      pdfUrl: data.pdf_url || data.pdfUrl,
      totalQuestions: data.total_questions || data.totalQuestions,
      answerKey: data.answer_key || data.answerKey || {},
      optionsPerQuestion: data.options_per_question || data.optionsPerQuestion,
      durationMinutes: data.duration_minutes || data.durationMinutes,
      dueDate: data.due_date || data.dueDate,
      subject: data.subject || '',
      unit: data.unit || '',
      createdAt: data.created_at || data.createdAt,
    };
  } catch (error) {
    console.error('[pdfTestService] Error fetching PDF test:', error);
    throw error;
  }
};

export const startPDFTest = async (testId: string, studentId: string): Promise<PDFTestSubmission> => {
  try {
    const existingSnapshot = await db.collection('pdf_test_submissions')
      .where('pdf_test_id', '==', testId)
      .where('student_id', '==', studentId)
      .limit(1)
      .get();

    if (!existingSnapshot.empty) {
      const doc = existingSnapshot.docs[0];
      const data = doc.data();
      return {
        id: doc.id,
        pdfTestId: data.pdf_test_id || data.pdfTestId,
        studentId: data.student_id || data.studentId,
        studentAnswers: data.student_answers || data.studentAnswers || {},
        startedAt: data.started_at || data.startedAt,
        submittedAt: data.submitted_at || data.submittedAt,
        timeSpentSeconds: data.time_spent_seconds || data.timeSpentSeconds || 0,
        scorePercentage: data.score_percentage || data.scorePercentage,
        correctCount: data.correct_count || data.correctCount || 0,
        wrongCount: data.wrong_count || data.wrongCount || 0,
        emptyCount: data.empty_count || data.emptyCount || 0,
        status: data.status,
        createdAt: data.created_at || data.createdAt,
      };
    }

    const startedAt = new Date().toISOString();
    const validStatus: 'started' = 'started';

    const submissionData = {
      pdf_test_id: testId,
      student_id: studentId,
      student_answers: {},
      started_at: startedAt,
      time_spent_seconds: 0,
      correct_count: 0,
      wrong_count: 0,
      empty_count: 0,
      status: validStatus,
    };

    console.log('[pdfTestService] Creating submission with data:', submissionData);

    const docRef = await db.collection('pdf_test_submissions').add(submissionData);

    return {
      id: docRef.id,
      pdfTestId: testId,
      studentId: studentId,
      studentAnswers: {},
      startedAt: startedAt,
      timeSpentSeconds: 0,
      correctCount: 0,
      wrongCount: 0,
      emptyCount: 0,
      status: validStatus,
      createdAt: startedAt,
    };
  } catch (error: any) {
    if (error?.code === '23505') {
      console.log('[pdfTestService] Duplicate key detected, fetching existing submission');
      const existingSnapshot = await db.collection('pdf_test_submissions')
        .where('pdf_test_id', '==', testId)
        .where('student_id', '==', studentId)
        .limit(1)
        .get();

      if (!existingSnapshot.empty) {
        const doc = existingSnapshot.docs[0];
        const data = doc.data();
        return {
          id: doc.id,
          pdfTestId: data.pdf_test_id || data.pdfTestId,
          studentId: data.student_id || data.studentId,
          studentAnswers: data.student_answers || data.studentAnswers || {},
          startedAt: data.started_at || data.startedAt,
          submittedAt: data.submitted_at || data.submittedAt,
          timeSpentSeconds: data.time_spent_seconds || data.timeSpentSeconds || 0,
          scorePercentage: data.score_percentage || data.scorePercentage,
          correctCount: data.correct_count || data.correctCount || 0,
          wrongCount: data.wrong_count || data.wrongCount || 0,
          emptyCount: data.empty_count || data.emptyCount || 0,
          status: data.status,
          createdAt: data.created_at || data.createdAt,
        };
      }
    }
    console.error('Error starting PDF test:', error);
    throw error;
  }
};

export const savePDFTestProgress = async (
  submissionId: string,
  answers: Record<string, string>,
  timeSpentSeconds: number
): Promise<void> => {
  try {
    await db.collection('pdf_test_submissions').doc(submissionId).update({
      student_answers: answers,
      time_spent_seconds: timeSpentSeconds,
    });
  } catch (error) {
    console.error('Error saving PDF test progress:', error);
    throw error;
  }
};

export const submitPDFTest = async (
  submissionId: string,
  answers: Record<string, string>,
  timeSpentSeconds: number,
  status: 'completed' | 'time_expired',
  answerKey: Record<string, string>,
  totalQuestions: number
): Promise<PDFTestSubmission> => {
  try {
    let correctCount = 0;
    let wrongCount = 0;
    let emptyCount = 0;

    for (let i = 1; i <= totalQuestions; i++) {
      // ... (existing counting logic, same as before)
      const questionNum = i.toString();
      const studentAnswer = answers[questionNum];
      const correctAnswer = answerKey[questionNum];

      if (!studentAnswer || studentAnswer.trim() === '') {
        emptyCount++;
      } else if (studentAnswer.toUpperCase() === correctAnswer?.toUpperCase()) {
        correctCount++;
      } else {
        wrongCount++;
      }
    }

    const scorePercentage = totalQuestions > 0
      ? (correctCount / totalQuestions) * 100
      : 0;

    const updateData = {
      student_answers: answers,
      submitted_at: new Date().toISOString(),
      time_spent_seconds: timeSpentSeconds,
      score_percentage: scorePercentage,
      correct_count: correctCount,
      wrong_count: wrongCount,
      empty_count: emptyCount,
      status: status,
    };

    await db.collection('pdf_test_submissions').doc(submissionId).update(updateData);

    const doc = await db.collection('pdf_test_submissions').doc(submissionId).get();
    const data = doc.data();

    // --- Record Mistakes ---
    const pdfTestId = data.pdf_test_id || data.pdfTestId;
    const studentId = data.student_id || data.studentId;

    if (pdfTestId && studentId && wrongCount > 0) {
      // Fetch test details for context
      const testDoc = await db.collection('pdf_tests').doc(pdfTestId).get();
      if (testDoc.exists) {
        const testData = testDoc.data();
        const mistakesPromise = [];

        for (let i = 1; i <= totalQuestions; i++) {
          const qNum = i.toString();
          const sAns = answers[qNum];
          const cAns = answerKey[qNum];

          // If answered and wrong
          if (sAns && sAns.trim() !== '' && cAns && sAns.toUpperCase() !== cAns.toUpperCase()) {
            mistakesPromise.push(mistakeService.addMistake({
              studentId: studentId,
              questionId: `pdf-${pdfTestId}-${qNum}`,
              questionData: {
                text: `${testData.title || 'PDF Test'} - Soru ${qNum}`,
                type: 'multiple_choice',
                options: ['A', 'B', 'C', 'D', 'E'].slice(0, testData.options_per_question || 4),
                pdfUrl: testData.pdf_url || testData.pdfUrl,
                questionNumber: i
              },
              studentAnswer: sAns,
              correctAnswer: cAns,
              status: 'new',
              sourceType: 'test',
              sourceId: submissionId
            }));
          }
        }
        await Promise.all(mistakesPromise);
      }
    }
    // -----------------------

    return {
      id: doc.id,
      pdfTestId: data.pdf_test_id || data.pdfTestId,
      studentId: data.student_id || data.studentId,
      studentAnswers: data.student_answers || data.studentAnswers || {},
      startedAt: data.started_at || data.startedAt,
      submittedAt: data.submitted_at || data.submittedAt,
      timeSpentSeconds: data.time_spent_seconds || data.timeSpentSeconds,
      scorePercentage: data.score_percentage || data.scorePercentage,
      correctCount: data.correct_count || data.correctCount,
      wrongCount: data.wrong_count || data.wrongCount,
      emptyCount: data.empty_count || data.emptyCount,
      status: data.status,
      createdAt: data.created_at || data.createdAt,
    };
  } catch (error) {
    console.error('Error submitting PDF test:', error);
    throw error;
  }
};

export const getSubmissionForTest = async (
  testId: string,
  studentId: string
): Promise<PDFTestSubmission | null> => {
  try {
    const snapshot = await db.collection('pdf_test_submissions')
      .where('pdf_test_id', '==', testId)
      .where('student_id', '==', studentId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

    return {
      id: doc.id,
      pdfTestId: data.pdf_test_id || data.pdfTestId,
      studentId: data.student_id || data.studentId,
      studentAnswers: data.student_answers || data.studentAnswers || {},
      startedAt: data.started_at || data.startedAt,
      submittedAt: data.submitted_at || data.submittedAt,
      timeSpentSeconds: data.time_spent_seconds || data.timeSpentSeconds,
      scorePercentage: data.score_percentage || data.scorePercentage,
      correctCount: data.correct_count || data.correctCount,
      wrongCount: data.wrong_count || data.wrongCount,
      emptyCount: data.empty_count || data.emptyCount,
      status: data.status,
      createdAt: data.created_at || data.createdAt,
    };
  } catch (error) {
    console.error('Error fetching submission:', error);
    throw error;
  }
};

export const getSubmissionsForStudent = async (studentId: string): Promise<PDFTestSubmission[]> => {
  try {
    const snapshot = await db.collection('pdf_test_submissions')
      .where('student_id', '==', studentId)
      .get();

    const submissions = await Promise.all(
      snapshot.docs.map(async (doc: any) => {
        const data = doc.data();
        const pdfTestId = data.pdf_test_id || data.pdfTestId;

        if (!pdfTestId) {
          console.error('[pdfTestService] Missing pdfTestId for submission:', doc.id, data);
        }

        let pdfTest: PDFTest | undefined;

        if (pdfTestId) {
          const testDoc = await db.collection('pdf_tests').doc(pdfTestId).get();
          if (testDoc.exists) {
            const testData = testDoc.data();
            pdfTest = {
              id: testDoc.id,
              teacherId: testData.teacher_id || testData.teacherId,
              studentId: testData.student_id || testData.studentId,
              title: testData.title,
              description: testData.description || '',
              pdfUrl: testData.pdf_url || testData.pdfUrl,
              totalQuestions: testData.total_questions || testData.totalQuestions,
              answerKey: testData.answer_key || testData.answerKey || {},
              optionsPerQuestion: testData.options_per_question || testData.optionsPerQuestion,
              durationMinutes: testData.duration_minutes || testData.durationMinutes,
              dueDate: testData.due_date || testData.dueDate,
              subject: testData.subject || '',
              unit: testData.unit || '',
              createdAt: testData.created_at || testData.createdAt,
            };
          }
        } else {
          console.warn('[pdfTestService] Missing pdfTestId for submission:', doc.id);
        }

        return {
          id: doc.id,
          pdfTestId: pdfTestId,
          studentId: data.student_id || data.studentId,
          studentAnswers: data.student_answers || data.studentAnswers || {},
          startedAt: data.started_at || data.startedAt,
          submittedAt: data.submitted_at || data.submittedAt,
          timeSpentSeconds: data.time_spent_seconds || data.timeSpentSeconds,
          scorePercentage: data.score_percentage || data.scorePercentage,
          correctCount: data.correct_count || data.correctCount,
          wrongCount: data.wrong_count || data.wrongCount,
          emptyCount: data.empty_count || data.emptyCount,
          status: data.status,
          createdAt: data.created_at || data.createdAt,
          pdfTest,
        };
      })
    );

    return submissions;
  } catch (error) {
    console.error('Error fetching submissions for student:', error);
    throw error;
  }
};

export const deletePDFTest = async (testId: string): Promise<void> => {
  try {
    const submissionsSnapshot = await db.collection('pdf_test_submissions')
      .where('pdf_test_id', '==', testId)
      .get();

    for (const doc of submissionsSnapshot.docs) {
      await db.collection('pdf_test_submissions').doc(doc.id).delete();
    }

    await db.collection('pdf_tests').doc(testId).delete();
  } catch (error) {
    console.error('Error deleting PDF test:', error);
    throw error;
  }
};
