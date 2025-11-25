import React, { useState, useEffect } from 'react';
import { User, QuestionBank, Student } from '../types';
import { db } from '../services/dbAdapter';
import CreateQuestionBankModal from '../components/CreateQuestionBankModal';
import AssignQuestionBankModal from '../components/AssignQuestionBankModal';
import ViewQuestionBankModal from '../components/ViewQuestionBankModal';
import AssignedTestsManager from '../components/AssignedTestsManager';

interface QuestionBankPageProps {
  user: User;
  onBack: () => void;
  onLogout: () => void;
}

const QuestionBankPage: React.FC<QuestionBankPageProps> = ({ user, onBack, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'banks' | 'assignments'>('banks');
  const [questionBanks, setQuestionBanks] = useState<QuestionBank[]>([]);
  const [filteredBanks, setFilteredBanks] = useState<QuestionBank[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [assigningBank, setAssigningBank] = useState<QuestionBank | null>(null);
  const [viewingBank, setViewingBank] = useState<QuestionBank | null>(null);
  const [filterSubject, setFilterSubject] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [filterUnit, setFilterUnit] = useState('');

  const loadQuestionBanks = async () => {
    try {
      const snapshot = await db.collection('question_banks')
        .where('teacherId', '==', user.id)
        .get();

      const banks = snapshot.docs.map((doc: any) => {
        const data = doc.data();
        const questions = data.questions || [];
        return {
          id: doc.id,
          teacherId: data.teacherId,
          title: data.title,
          subject: data.subject,
          grade: data.grade,
          unit: data.unit,
          topic: data.topic,
          difficultyLevel: data.difficultyLevel,
          questions: questions,
          totalQuestions: data.totalQuestions || questions.length,
          source: data.source,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        } as QuestionBank;
      });

      banks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setQuestionBanks(banks);
      setFilteredBanks(banks);
    } catch (error) {
      console.error('Error loading question banks:', error);
    }
  };

  const loadStudents = async () => {
    try {
      const snapshot = await db.collection('students').where('tutorId', '==', user.id).get();
      const studentsList = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      }) as Student);
      setStudents(studentsList);
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  useEffect(() => {
    loadQuestionBanks();
    loadStudents();
  }, [user.id]);

  useEffect(() => {
    let filtered = questionBanks;

    if (filterSubject) {
      filtered = filtered.filter(b => b.subject === filterSubject);
    }
    if (filterGrade) {
      filtered = filtered.filter(b => b.grade === Number(filterGrade));
    }
    if (filterUnit) {
      filtered = filtered.filter(b => b.unit.toLowerCase().includes(filterUnit.toLowerCase()));
    }

    setFilteredBanks(filtered);
  }, [filterSubject, filterGrade, filterUnit, questionBanks]);

  const handleDelete = async (id: string) => {
    if (!confirm('Bu soru bankasını silmek istediğinizden emin misiniz?')) return;

    try {
      await db.collection('question_banks').doc(id).delete();
      loadQuestionBanks();
    } catch (error) {
      console.error('Error deleting question bank:', error);
      alert('Soru bankası silinemedi.');
    }
  };

  const difficultyLabels = ['Çok Kolay', 'Kolay', 'Orta', 'Zor', 'Çok Zor'];
  const sourceLabels = {
    ai_generated: 'AI Üretimi',
    pdf_import: 'PDF İçe Aktarma',
    manual: 'Manuel Oluşturma'
  };

  const subjects = Array.from(new Set(questionBanks.map(b => b.subject)));
  const grades = Array.from(new Set(questionBanks.map(b => b.grade))).sort((a, b) => a - b);

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <h1 className="text-3xl font-bold text-gray-800">📚 Soru Bankası</h1>
            {activeTab === 'banks' && (
              <button
                onClick={() => setIsCreating(true)}
                className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-all flex items-center gap-2"
              >
                <span className="text-xl">+</span> Yeni Soru Bankası
              </button>
            )}
          </div>

          <div className="mb-6">
            <div className="flex bg-gray-100 rounded-full p-1">
              <button
                onClick={() => setActiveTab('banks')}
                className={`flex-1 py-2 px-4 rounded-full font-semibold transition-colors ${
                  activeTab === 'banks' ? 'bg-primary text-white shadow' : 'text-gray-600'
                }`}
              >
                Soru Bankaları
              </button>
              <button
                onClick={() => setActiveTab('assignments')}
                className={`flex-1 py-2 px-4 rounded-full font-semibold transition-colors ${
                  activeTab === 'assignments' ? 'bg-primary text-white shadow' : 'text-gray-600'
                }`}
              >
                Atanan Testler
              </button>
            </div>
          </div>

          {activeTab === 'banks' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <select
                value={filterSubject}
                onChange={e => setFilterSubject(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
              >
                <option value="">Tüm Dersler</option>
                {subjects.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              <select
                value={filterGrade}
                onChange={e => setFilterGrade(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
              >
                <option value="">Tüm Sınıflar</option>
                {grades.map(g => (
                  <option key={g} value={g}>{g}. Sınıf</option>
                ))}
              </select>

              <input
                type="text"
                value={filterUnit}
                onChange={e => setFilterUnit(e.target.value)}
                placeholder="Ünite Ara..."
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
              />

              <button
                onClick={() => {
                  setFilterSubject('');
                  setFilterGrade('');
                  setFilterUnit('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50"
              >
                Filtreleri Temizle
              </button>
            </div>
          )}
        </div>

        {activeTab === 'assignments' ? (
          <AssignedTestsManager teacherId={user.id} />
        ) : filteredBanks.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              {questionBanks.length === 0 ? 'Henüz Soru Bankası Yok' : 'Sonuç Bulunamadı'}
            </h3>
            <p className="text-gray-600 mb-6">
              {questionBanks.length === 0
                ? 'AI ile hızlıca soru bankası oluşturabilir veya PDF test yükleyebilirsiniz.'
                : 'Farklı filtreler deneyebilirsiniz.'}
            </p>
            {questionBanks.length === 0 && (
              <button
                onClick={() => setIsCreating(true)}
                className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark"
              >
                Hemen Oluştur
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBanks.map(bank => (
              <div key={bank.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-800 mb-2">{bank.title}</h3>
                      <p className="text-sm text-gray-600">
                        {bank.subject} • {bank.grade}. Sınıf • {bank.unit}
                      </p>
                      {bank.topic && (
                        <p className="text-sm text-gray-500 mt-1">Konu: {bank.topic}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <span className="font-semibold text-primary">{bank.totalQuestions} Soru</span>
                    <span>•</span>
                    <span>{difficultyLabels[bank.difficultyLevel - 1]}</span>
                  </div>

                  <div className="text-xs text-gray-500 mb-4">
                    {sourceLabels[bank.source]} • {new Date(bank.createdAt).toLocaleDateString('tr-TR')}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setViewingBank(bank)}
                      className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg font-semibold hover:bg-blue-100 transition-colors text-sm"
                    >
                      Görüntüle
                    </button>
                    <button
                      onClick={() => setAssigningBank(bank)}
                      className="px-3 py-2 bg-green-50 text-green-600 rounded-lg font-semibold hover:bg-green-100 transition-colors text-sm"
                    >
                      Öğrenciye Ata
                    </button>
                    <button
                      onClick={() => handleDelete(bank.id)}
                      className="px-3 py-2 bg-red-50 text-red-600 rounded-lg font-semibold hover:bg-red-100 transition-colors text-sm"
                    >
                      Sil
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {isCreating && (
        <CreateQuestionBankModal
          teacherId={user.id}
          onClose={() => setIsCreating(false)}
          onCreated={loadQuestionBanks}
        />
      )}

      {assigningBank && (
        <AssignQuestionBankModal
          questionBank={assigningBank}
          students={students}
          user={user}
          onClose={() => setAssigningBank(null)}
          onAssigned={() => {
            setAssigningBank(null);
            loadQuestionBanks();
          }}
        />
      )}

      {viewingBank && (
        <ViewQuestionBankModal
          questionBank={viewingBank}
          onClose={() => setViewingBank(null)}
        />
      )}
    </div>
  );
};

export default QuestionBankPage;
