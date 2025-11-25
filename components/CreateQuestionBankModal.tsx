import React, { useState } from 'react';
import { Subject, Question } from '../types';
import { generateQuestionBank, QuestionBankConfig } from '../services/questionBankService';
import { db } from '../services/dbAdapter';

interface CreateQuestionBankModalProps {
  teacherId: string;
  onClose: () => void;
  onCreated: () => void;
}

const CreateQuestionBankModal: React.FC<CreateQuestionBankModalProps> = ({ teacherId, onClose, onCreated }) => {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState<Subject>(Subject.Mathematics);
  const [grade, setGrade] = useState(9);
  const [unit, setUnit] = useState('');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState(3);

  const [multipleChoiceCount, setMultipleChoiceCount] = useState(10);
  const [trueFalseCount, setTrueFalseCount] = useState(5);
  const [openEndedCount, setOpenEndedCount] = useState(0);
  const [matchingCount, setMatchingCount] = useState(0);

  const [enableMultipleChoice, setEnableMultipleChoice] = useState(true);
  const [enableTrueFalse, setEnableTrueFalse] = useState(true);
  const [enableOpenEnded, setEnableOpenEnded] = useState(false);
  const [enableMatching, setEnableMatching] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);

  const totalQuestions =
    (enableMultipleChoice ? multipleChoiceCount : 0) +
    (enableTrueFalse ? trueFalseCount : 0) +
    (enableOpenEnded ? openEndedCount : 0) +
    (enableMatching ? matchingCount : 0);

  const handleGenerate = async () => {
    if (!title.trim() || !unit.trim()) {
      alert('Lütfen başlık ve ünite giriniz.');
      return;
    }

    if (totalQuestions === 0) {
      alert('Lütfen en az bir soru tipi seçin ve sayı belirtin.');
      return;
    }

    setIsGenerating(true);

    try {
      const config: QuestionBankConfig = {
        subject,
        grade,
        unit,
        topic: topic.trim() || undefined,
        difficulty,
        questionCounts: {
          multiple_choice: enableMultipleChoice ? multipleChoiceCount : 0,
          true_false: enableTrueFalse ? trueFalseCount : 0,
          open_ended: enableOpenEnded ? openEndedCount : 0,
          matching: enableMatching ? matchingCount : 0,
        }
      };

      const questions = await generateQuestionBank(config);

      await db.collection('question_banks').add({
        teacher_id: teacherId,
        title: title.trim(),
        subject,
        grade,
        unit: unit.trim(),
        topic: topic.trim() || null,
        difficulty_level: difficulty,
        questions,
        total_questions: questions.length,
        source: 'ai_generated',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      alert(`✅ ${questions.length} soruluk soru bankası başarıyla oluşturuldu!`);
      onCreated();
      onClose();
    } catch (error) {
      console.error('Error creating question bank:', error);
      alert('Soru bankası oluşturulamadı. Lütfen tekrar deneyin.');
    } finally {
      setIsGenerating(false);
    }
  };

  const difficultyLabels = ['Çok Kolay', 'Kolay', 'Orta', 'Zor', 'Çok Zor'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">✨ AI ile Soru Bankası Oluştur</h2>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Başlık</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Örn: 10. Sınıf Matematik - Trigonometri"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Ders</label>
              <select
                value={subject}
                onChange={e => setSubject(e.target.value as Subject)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value={Subject.Mathematics}>Matematik</option>
                <option value={Subject.Physics}>Fizik</option>
                <option value={Subject.Chemistry}>Kimya</option>
                <option value={Subject.Biology}>Biyoloji</option>
                <option value={Subject.Turkish}>Türkçe</option>
                <option value={Subject.English}>İngilizce</option>
                <option value={Subject.History}>Tarih</option>
                <option value={Subject.Geography}>Coğrafya</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Sınıf</label>
              <select
                value={grade}
                onChange={e => setGrade(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                {[5, 6, 7, 8, 9, 10, 11, 12].map(g => (
                  <option key={g} value={g}>{g}. Sınıf</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Ünite</label>
            <input
              type="text"
              value={unit}
              onChange={e => setUnit(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Örn: Trigonometri"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Konu (Opsiyonel)</label>
            <input
              type="text"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Örn: Sinüs ve Kosinüs"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Zorluk Seviyesi: <span className="text-primary">{difficultyLabels[difficulty - 1]}</span>
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map(level => (
                <button
                  key={level}
                  onClick={() => setDifficulty(level)}
                  className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                    difficulty === level
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Soru Tipleri ve Sayıları</h3>

            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  checked={enableMultipleChoice}
                  onChange={e => setEnableMultipleChoice(e.target.checked)}
                  className="w-5 h-5 text-primary"
                />
                <label className="flex-1 font-semibold text-gray-700">Çoktan Seçmeli</label>
                <input
                  type="number"
                  min="0"
                  value={multipleChoiceCount}
                  onChange={e => setMultipleChoiceCount(Number(e.target.value))}
                  disabled={!enableMultipleChoice}
                  className="w-20 px-3 py-1 border border-gray-300 rounded-lg text-center disabled:bg-gray-100"
                />
                <span className="text-gray-600">soru</span>
              </div>

              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  checked={enableTrueFalse}
                  onChange={e => setEnableTrueFalse(e.target.checked)}
                  className="w-5 h-5 text-primary"
                />
                <label className="flex-1 font-semibold text-gray-700">Doğru/Yanlış</label>
                <input
                  type="number"
                  min="0"
                  value={trueFalseCount}
                  onChange={e => setTrueFalseCount(Number(e.target.value))}
                  disabled={!enableTrueFalse}
                  className="w-20 px-3 py-1 border border-gray-300 rounded-lg text-center disabled:bg-gray-100"
                />
                <span className="text-gray-600">soru</span>
              </div>

              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  checked={enableOpenEnded}
                  onChange={e => setEnableOpenEnded(e.target.checked)}
                  className="w-5 h-5 text-primary"
                />
                <label className="flex-1 font-semibold text-gray-700">Açık Uçlu</label>
                <input
                  type="number"
                  min="0"
                  value={openEndedCount}
                  onChange={e => setOpenEndedCount(Number(e.target.value))}
                  disabled={!enableOpenEnded}
                  className="w-20 px-3 py-1 border border-gray-300 rounded-lg text-center disabled:bg-gray-100"
                />
                <span className="text-gray-600">soru</span>
              </div>

              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  checked={enableMatching}
                  onChange={e => setEnableMatching(e.target.checked)}
                  className="w-5 h-5 text-primary"
                />
                <label className="flex-1 font-semibold text-gray-700">Eşleştirme</label>
                <input
                  type="number"
                  min="0"
                  value={matchingCount}
                  onChange={e => setMatchingCount(Number(e.target.value))}
                  disabled={!enableMatching}
                  className="w-20 px-3 py-1 border border-gray-300 rounded-lg text-center disabled:bg-gray-100"
                />
                <span className="text-gray-600">soru</span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-semibold text-blue-800">
                Toplam: <span className="text-xl">{totalQuestions}</span> Soru
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="px-6 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            İptal
          </button>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Oluşturuluyor...
              </>
            ) : (
              <>🤖 AI ile Oluştur</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateQuestionBankModal;
