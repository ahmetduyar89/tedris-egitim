import React, { useState } from 'react';
import { QuestionBank, Student, User } from '../types';
import { db, supabase } from '../services/dbAdapter';

interface AssignQuestionBankModalProps {
  questionBank: QuestionBank;
  students: Student[];
  user: User;
  onClose: () => void;
  onAssigned: () => void;
}

const AssignQuestionBankModal: React.FC<AssignQuestionBankModalProps> = ({
  questionBank,
  students,
  user,
  onClose,
  onAssigned
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [applicationDate, setApplicationDate] = useState('');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(45);
  const [hasTimeLimit, setHasTimeLimit] = useState(true);
  const [notes, setNotes] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  const handleAssign = async () => {
    if (!selectedStudentId) {
      alert('Lütfen bir öğrenci seçiniz.');
      return;
    }

    if (!applicationDate) {
      alert('Lütfen uygulama tarihi belirleyiniz.');
      return;
    }

    setIsAssigning(true);

    try {
      const assignmentResult = await db.collection('question_bank_assignments').add({
        question_bank_id: questionBank.id,
        student_id: selectedStudentId,
        teacher_id: user.id,
        assigned_at: new Date().toISOString(),
        application_date: new Date(applicationDate).toISOString(),
        time_limit_minutes: hasTimeLimit ? timeLimitMinutes : null,
        started_at: null,
        completed_at: null,
        answers: {},
        score: null,
        total_correct: 0,
        total_questions: questionBank.totalQuestions,
        status: 'Atandı',
        ai_feedback: null,
        notes: notes || null
      });

      // Extract the actual ID string from the result
      const assignmentId = typeof assignmentResult === 'string' ? assignmentResult : assignmentResult.id;
      console.log('✅ Assignment created with ID:', assignmentId);

      const selectedStudent = students.find(s => s.id === selectedStudentId);

      const programSnapshot = await db.collection('weekly_programs').where('student_id', '==', selectedStudentId).limit(1).get();
      if (!programSnapshot.empty) {
        const programDoc = programSnapshot.docs[0];
        const program = programDoc.data();
        const appDate = new Date(applicationDate);
        const dayOfWeek = appDate.getDay();
        const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
        const targetDayName = dayNames[dayOfWeek];

        const updatedDays = program.days.map((day: any) => {
          if (day.day === targetDayName) {
            const newTask = {
              id: `qb_${assignmentId}`,
              title: questionBank.title,
              type: 'Test',
              status: 'Bekliyor',
              xpReward: Math.min(questionBank.totalQuestions * 5, 100),
              dueTime: '23:59',
              subject: questionBank.subject,
              metadata: {
                questionBankAssignmentId: assignmentId,  // ✅ Now it's a string!
                questionBankId: questionBank.id,
                totalQuestions: questionBank.totalQuestions,
                timeLimit: hasTimeLimit ? timeLimitMinutes : null
              }
            };
            return {
              ...day,
              tasks: [...(day.tasks || []), newTask]
            };
          }
          return day;
        });

        await db.collection('weekly_programs').doc(programDoc.id).update({
          days: updatedDays
        });
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.access_token) {
          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-notification`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                recipient_id: selectedStudentId,
                message: `Yeni test atandı: ${questionBank.title} (${new Date(applicationDate).toLocaleDateString('tr-TR')})`,
                entity_type: 'question_bank_assignment',
                entity_id: assignmentId
              })
            }
          );

          if (!response.ok) {
            const error = await response.json();
            console.error('❌ Failed to send notification:', error);
          } else {
            console.log('✅ Notification sent successfully!');
          }
        }
      } catch (notificationError) {
        console.error('❌ Failed to send notification:', notificationError);
      }

      alert(`✅ Test başarıyla ${selectedStudent?.name}'e atandı!`);
      onAssigned();
      onClose();
    } catch (error) {
      console.error('Error assigning question bank:', error);
      alert('Test atanamadı. Lütfen tekrar deneyin.');
    } finally {
      setIsAssigning(false);
    }
  };

  const totalPoints = 100;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Soru Bankasını Öğrenciye Ata</h2>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-bold text-gray-800 mb-2">{questionBank.title}</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>{questionBank.subject} • {questionBank.grade === 4 ? 'İlkokul' : `${questionBank.grade}. Sınıf`} • {questionBank.unit}</p>
              <p className="font-semibold text-primary">
                {questionBank.totalQuestions} Soru • {totalPoints} Puan
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Öğrenci Seç</label>
            <select
              value={selectedStudentId}
              onChange={e => setSelectedStudentId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
            >
              <option value="">Öğrenci seçiniz...</option>
              {students.map(student => (
                <option key={student.id} value={student.id}>
                  {student.name} ({student.grade === 4 ? 'İlkokul' : `${student.grade}. Sınıf`})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Uygulama Tarihi</label>
            <input
              type="date"
              value={applicationDate}
              onChange={e => setApplicationDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-gray-500 mt-1">Test seçilen günün haftalık programına eklenecektir.</p>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-3">
              <input
                type="checkbox"
                checked={hasTimeLimit}
                onChange={e => setHasTimeLimit(e.target.checked)}
                className="w-5 h-5 text-primary"
              />
              <label className="font-semibold text-gray-700">Süre sınırı olsun</label>
            </div>

            {hasTimeLimit && (
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="5"
                  step="5"
                  value={timeLimitMinutes}
                  onChange={e => setTimeLimitMinutes(Number(e.target.value))}
                  className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary text-center"
                />
                <span className="text-gray-700">dakika</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Notlar (Opsiyonel)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
              placeholder="Öğrenciye özel notlar..."
            />
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isAssigning}
            className="px-6 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            İptal
          </button>
          <button
            onClick={handleAssign}
            disabled={isAssigning}
            className="px-6 py-2 bg-accent text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isAssigning ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Atanıyor...
              </>
            ) : (
              'Öğrenciye Ata'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignQuestionBankModal;
