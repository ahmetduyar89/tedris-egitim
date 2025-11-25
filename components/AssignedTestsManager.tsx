import React, { useState, useEffect } from 'react';
import { QuestionBankAssignment, Student, QuestionBank } from '../types';
import { db } from '../services/dbAdapter';

interface AssignedTestsManagerProps {
  teacherId: string;
}

const AssignedTestsManager: React.FC<AssignedTestsManagerProps> = ({ teacherId }) => {
  const [assignments, setAssignments] = useState<QuestionBankAssignment[]>([]);
  const [students, setStudents] = useState<{ [id: string]: Student }>({});
  const [questionBanks, setQuestionBanks] = useState<{ [id: string]: QuestionBank }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAssignments();
  }, [teacherId]);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const snapshot = await db.collection('question_bank_assignments')
        .where('teacherId', '==', teacherId)
        .orderBy('assignedAt', 'desc')
        .get();

      const assignmentsList = snapshot.docs.map((doc: any) => {
        const data = doc.data();
        return {
          id: doc.id,
          questionBankId: data.questionBankId,
          studentId: data.studentId,
          teacherId: data.teacherId,
          assignedAt: data.assignedAt,
          applicationDate: data.applicationDate,
          timeLimitMinutes: data.timeLimitMinutes,
          startedAt: data.startedAt,
          completedAt: data.completedAt,
          answers: data.answers || {},
          score: data.score,
          totalCorrect: data.totalCorrect,
          totalQuestions: data.totalQuestions,
          status: data.status,
          aiFeedback: data.aiFeedback
        } as QuestionBankAssignment;
      });

      setAssignments(assignmentsList);

      const studentIds = Array.from(new Set(assignmentsList.map(a => a.studentId)));
      const studentsMap: { [id: string]: Student } = {};
      for (const studentId of studentIds) {
        const doc = await db.collection('students').doc(studentId).get();
        if (doc.exists) {
          const data = doc.data();
          studentsMap[studentId] = {
            id: doc.id,
            name: data.name,
            email: data.email,
            grade: data.grade,
            subjects: data.subjects || [],
            xp: data.xp || 0,
            level: data.level || 1,
            learningLoopStatus: data.learningLoopStatus
          };
        }
      }
      setStudents(studentsMap);

      const qbIds = Array.from(new Set(assignmentsList.map(a => a.questionBankId)));
      const qbMap: { [id: string]: QuestionBank } = {};
      for (const qbId of qbIds) {
        const doc = await db.collection('question_banks').doc(qbId).get();
        if (doc.exists) {
          const data = doc.data();
          qbMap[qbId] = {
            id: doc.id,
            teacherId: data.teacherId,
            title: data.title,
            subject: data.subject,
            grade: data.grade,
            unit: data.unit,
            topic: data.topic,
            difficultyLevel: data.difficultyLevel,
            questions: data.questions || [],
            totalQuestions: data.totalQuestions || 0,
            source: data.source,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
          };
        }
      }
      setQuestionBanks(qbMap);
    } catch (error) {
      console.error('Error loading assignments:', error);
      alert('Atanan testler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (assignmentId: string) => {
    if (!confirm('Bu atamayı silmek istediğinize emin misiniz?')) return;

    try {
      await db.collection('question_bank_assignments').doc(assignmentId).delete();
      setAssignments(prev => prev.filter(a => a.id !== assignmentId));
      alert('Atama başarıyla silindi.');
    } catch (error) {
      console.error('Error deleting assignment:', error);
      alert('Atama silinirken bir hata oluştu.');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      'Atandı': 'bg-blue-100 text-blue-800',
      'Devam Ediyor': 'bg-yellow-100 text-yellow-800',
      'Tamamlandı': 'bg-green-100 text-green-800'
    };
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="text-center py-12">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-gray-500 text-lg">Henüz atanmış test bulunmuyor.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {assignments.map(assignment => {
        const student = students[assignment.studentId];
        const qb = questionBanks[assignment.questionBankId];

        return (
          <div key={assignment.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  {qb?.title || 'Test'}
                </h3>
                <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {student?.name || 'Öğrenci'}
                  </span>
                  <span>•</span>
                  <span>{qb?.subject}</span>
                  <span>•</span>
                  <span>{qb?.grade}. Sınıf</span>
                  <span>•</span>
                  <span>{assignment.totalQuestions || qb?.totalQuestions || 0} Soru</span>
                  {assignment.timeLimitMinutes && (
                    <>
                      <span>•</span>
                      <span>{assignment.timeLimitMinutes} dakika</span>
                    </>
                  )}
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadge(assignment.status)}`}>
                {assignment.status}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
              <div>
                <p className="text-gray-500">Atanma Tarihi</p>
                <p className="font-semibold text-gray-800">
                  {new Date(assignment.assignedAt).toLocaleDateString('tr-TR')}
                </p>
              </div>
              {assignment.applicationDate && (
                <div>
                  <p className="text-gray-500">Uygulama Tarihi</p>
                  <p className="font-semibold text-gray-800">
                    {new Date(assignment.applicationDate).toLocaleDateString('tr-TR')}
                  </p>
                </div>
              )}
              {assignment.startedAt && (
                <div>
                  <p className="text-gray-500">Başlangıç</p>
                  <p className="font-semibold text-gray-800">
                    {new Date(assignment.startedAt).toLocaleDateString('tr-TR')}
                  </p>
                </div>
              )}
              {assignment.completedAt && (
                <div>
                  <p className="text-gray-500">Tamamlanma</p>
                  <p className="font-semibold text-gray-800">
                    {new Date(assignment.completedAt).toLocaleDateString('tr-TR')}
                  </p>
                </div>
              )}
            </div>

            {assignment.status === 'Tamamlandı' && assignment.score !== undefined && (
              <div className="mb-4 p-4 bg-green-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Puan:</span>
                  <span className="text-2xl font-bold text-green-600">
                    {assignment.score}%
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2 text-sm">
                  <span className="text-gray-600">Doğru Cevap:</span>
                  <span className="font-semibold text-gray-800">
                    {assignment.totalCorrect} / {assignment.totalQuestions}
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => handleDelete(assignment.id)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Sil
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AssignedTestsManager;
