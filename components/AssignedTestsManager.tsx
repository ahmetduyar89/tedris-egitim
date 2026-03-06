import React, { useState, useEffect } from 'react';
import { QuestionBankAssignment, Student, QuestionBank } from '../types';
import { db } from '../services/dbAdapter';
import ConfirmationModal from './ConfirmationModal';

interface AssignedTestsManagerProps {
  teacherId: string;
}

const AssignedTestsManager: React.FC<AssignedTestsManagerProps> = ({ teacherId }) => {
  const [assignments, setAssignments] = useState<QuestionBankAssignment[]>([]);
  const [students, setStudents] = useState<{ [id: string]: Student }>({});
  const [questionBanks, setQuestionBanks] = useState<{ [id: string]: QuestionBank }>({});
  const [loading, setLoading] = useState(true);
  const [assignmentToDelete, setAssignmentToDelete] = useState<string | null>(null);

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
            grade: data.grade,
            tutorId: data.tutorId || data.tutor_id, // Handle both cases just in case
            xp: data.xp || 0,
            level: data.level || 1,
            learningLoopStatus: data.learningLoopStatus,
            badges: [], // Initialize required property
            progressReports: [] // Initialize required property
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

  const handleDelete = (assignmentId: string) => {
    setAssignmentToDelete(assignmentId);
  };

  const confirmDelete = async () => {
    if (!assignmentToDelete) return;

    try {
      await db.collection('question_bank_assignments').doc(assignmentToDelete).delete();
      setAssignments(prev => prev.filter(a => a.id !== assignmentToDelete));
      setAssignmentToDelete(null);
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
    <div className="overflow-x-auto bg-white rounded-xl shadow border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test / Konu</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Öğrenci</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ders / Sınıf</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Puan</th>
            <th scope="col" className="relative px-6 py-3">
              <span className="sr-only">İşlemler</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {assignments.map(assignment => {
            const student = students[assignment.studentId];
            const qb = questionBanks[assignment.questionBankId];

            return (
              <tr key={assignment.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <div className="text-sm font-medium text-gray-900">{qb?.title || 'Bilinmeyen Test'}</div>
                    <div className="text-xs text-gray-500">{qb?.unit || '-'}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="text-sm font-medium text-gray-900">{student?.name || 'Bilinmeyen Öğrenci'}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{qb?.subject}</div>
                  <div className="text-xs text-gray-500">{qb?.grade}. Sınıf</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{new Date(assignment.assignedAt).toLocaleDateString('tr-TR')}</div>
                  {assignment.completedAt && (
                    <div className="text-xs text-gray-500">Tamamlandı: {new Date(assignment.completedAt).toLocaleDateString('tr-TR')}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(assignment.status)}`}>
                    {assignment.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {assignment.status === 'Tamamlandı' && assignment.score !== undefined ? (
                    <span className="font-bold text-gray-900">{assignment.score}%</span>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleDelete(assignment.id)}
                    className="text-red-600 hover:text-red-900 transition-colors p-2 rounded-full hover:bg-red-50"
                    title="Sil"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <ConfirmationModal
        isOpen={!!assignmentToDelete}
        title="Atamayı Sil"
        message="Bu atamayı silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
        onConfirm={confirmDelete}
        onCancel={() => setAssignmentToDelete(null)}
      />
    </div>
  );
};

export default AssignedTestsManager;
