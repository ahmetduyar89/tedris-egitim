import React, { useState } from 'react';
import { Subject, Flashcard } from '../types';
import { generateFlashcards } from '../services/optimizedAIService';
import { createNotification } from '../services/notificationService';
import { db } from '../services/dbAdapter';

interface CreateFlashcardModalProps {
  teacherId: string;
  studentId: string;
  onClose: () => void;
  onCreated: () => void;
}

const CreateFlashcardModal: React.FC<CreateFlashcardModalProps> = ({ teacherId, studentId, onClose, onCreated }) => {
  const [subject, setSubject] = useState<Subject>(Subject.Mathematics);
  const [grade, setGrade] = useState(5);
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedFlashcards, setGeneratedFlashcards] = useState<any[]>([]);
  const [manualMode, setManualMode] = useState(false);
  const [frontContent, setFrontContent] = useState('');
  const [backContent, setBackContent] = useState('');
  const [difficultyLevel, setDifficultyLevel] = useState(3);

  const handleGenerateWithAI = async () => {
    if (!topic.trim()) {
      alert('Lütfen bir konu girin.');
      return;
    }

    setIsGenerating(true);
    try {
      const flashcards = await generateFlashcards(topic, grade, subject, count);
      setGeneratedFlashcards(flashcards);
    } catch (error) {
      console.error('Error generating flashcards:', error);
      alert('Flashcard oluşturulurken bir hata oluştu.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveFlashcards = async () => {
    if (generatedFlashcards.length === 0) {
      alert('Önce flashcard oluşturun.');
      return;
    }

    try {
      const flashcardIds: string[] = [];

      for (const card of generatedFlashcards) {
        const flashcardRef = await db.collection('flashcards').add({
          teacher_id: teacherId,
          subject: subject,
          grade: grade,
          topic: topic,
          front_content: card.frontContent,
          back_content: card.backContent,
          difficulty_level: card.difficultyLevel,
          is_ai_generated: true
        });
        flashcardIds.push(flashcardRef.id);
      }

      await db.collection('spaced_repetition_schedule').add({
        student_id: studentId,
        flashcard_id: flashcardIds[0],
        ease_factor: 2.5,
        interval_days: 1,
        repetition_count: 0,
        next_review_date: new Date().toISOString().split('T')[0],
        mastery_level: 0
      });

      for (let i = 1; i < flashcardIds.length; i++) {
        await db.collection('spaced_repetition_schedule').add({
          student_id: studentId,
          flashcard_id: flashcardIds[i],
          ease_factor: 2.5,
          interval_days: 1,
          repetition_count: 0,
          next_review_date: new Date().toISOString().split('T')[0],
          mastery_level: 0
        });
      }

      await createNotification(
        studentId,
        `${flashcardIds.length} yeni flashcard '${topic}' konusunda sana atandı. Hemen tekrar etmeye başla!`,
        undefined,
        undefined
      );

      alert(`${flashcardIds.length} flashcard öğrenciye atandı!`);
      onCreated();
      onClose();
    } catch (error) {
      console.error('Error saving flashcards:', error);
      alert('Flashcard kaydedilirken bir hata oluştu.');
    }
  };

  const handleManualCreate = async () => {
    if (!frontContent.trim() || !backContent.trim() || !topic.trim()) {
      alert('Lütfen tüm alanları doldurun.');
      return;
    }

    try {
      const flashcardRef = await db.collection('flashcards').add({
        teacher_id: teacherId,
        subject: subject,
        grade: grade,
        topic: topic,
        front_content: frontContent,
        back_content: backContent,
        difficulty_level: difficultyLevel,
        is_ai_generated: false
      });

      await db.collection('spaced_repetition_schedule').add({
        student_id: studentId,
        flashcard_id: flashcardRef.id,
        ease_factor: 2.5,
        interval_days: 1,
        repetition_count: 0,
        next_review_date: new Date().toISOString().split('T')[0],
        mastery_level: 0
      });

      await createNotification(
        studentId,
        `1 yeni flashcard '${topic}' konusunda sana atandı. Hemen tekrar etmeye başla!`,
        undefined,
        undefined
      );

      alert('Flashcard başarıyla oluşturuldu ve öğrenciye atandı!');
      setFrontContent('');
      setBackContent('');
      onCreated();
    } catch (error) {
      console.error('Error creating manual flashcard:', error);
      alert('Flashcard oluşturulurken bir hata oluştu.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Flashcard Oluştur</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setManualMode(false)}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all ${!manualMode
                ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
            >
              AI ile Oluştur
            </button>
            <button
              onClick={() => setManualMode(true)}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all ${manualMode
                ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
            >
              Manuel Oluştur
            </button>
          </div>

          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ders</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value as Subject)}
                  className="w-full border border-gray-300 rounded-lg p-2"
                >
                  {Object.values(Subject).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sınıf</label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg p-2"
                >
                  {[4, 5, 6, 7, 8, 9, 10].map((g) => (
                    <option key={g} value={g}>{g === 4 ? 'İlkokul' : `${g}. Sınıf`}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Konu</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Örn: Isı ve Sıcaklık"
                  className="w-full border border-gray-300 rounded-lg p-2"
                />
              </div>
            </div>

            {!manualMode ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kart Sayısı</label>
                <input
                  type="number"
                  value={count}
                  onChange={(e) => setCount(parseInt(e.target.value))}
                  min={1}
                  max={20}
                  className="w-full border border-gray-300 rounded-lg p-2"
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ön Yüz (Soru/Kavram)</label>
                  <textarea
                    value={frontContent}
                    onChange={(e) => setFrontContent(e.target.value)}
                    placeholder="Soruyu veya kavramı girin"
                    className="w-full border border-gray-300 rounded-lg p-2"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Arka Yüz (Cevap/Açıklama)</label>
                  <textarea
                    value={backContent}
                    onChange={(e) => setBackContent(e.target.value)}
                    placeholder="Cevabı veya açıklamayı girin"
                    className="w-full border border-gray-300 rounded-lg p-2"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zorluk Seviyesi: {difficultyLevel}/5
                  </label>
                  <input
                    type="range"
                    value={difficultyLevel}
                    onChange={(e) => setDifficultyLevel(parseInt(e.target.value))}
                    min={1}
                    max={5}
                    className="w-full"
                  />
                </div>
              </>
            )}
          </div>

          {!manualMode && !isGenerating && generatedFlashcards.length === 0 && (
            <button
              onClick={handleGenerateWithAI}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-blue-600 transition-all"
            >
              AI ile {count} Flashcard Oluştur
            </button>
          )}

          {manualMode && (
            <button
              onClick={handleManualCreate}
              className="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white py-3 rounded-xl font-semibold hover:from-green-600 hover:to-teal-600 transition-all"
            >
              Flashcard Oluştur ve Ata
            </button>
          )}

          {isGenerating && (
            <div className="flex flex-col items-center justify-center py-8">
              <svg className="animate-spin h-12 w-12 text-purple-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-600">AI flashcard oluşturuyor...</p>
            </div>
          )}

          {generatedFlashcards.length > 0 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800">{generatedFlashcards.length} Flashcard Oluşturuldu</h3>
                <button
                  onClick={handleSaveFlashcards}
                  className="bg-success text-white px-6 py-2 rounded-xl font-semibold hover:bg-success/90 transition-all"
                >
                  Tümünü Kaydet ve Ata
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {generatedFlashcards.map((card, index) => (
                  <div key={index} className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-200">
                    <div className="mb-2">
                      <span className="text-xs font-semibold text-purple-700">Soru {index + 1}</span>
                      <span className="ml-2 text-xs text-gray-500">{'⭐'.repeat(card.difficultyLevel)}</span>
                    </div>
                    <div className="bg-white rounded-lg p-3 mb-2">
                      <p className="text-sm font-medium text-gray-800">{card.frontContent}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-xs text-gray-600">{card.backContent}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateFlashcardModal;
