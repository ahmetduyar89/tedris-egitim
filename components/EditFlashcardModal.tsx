import React, { useState } from 'react';
import { Flashcard } from '../types';

interface EditFlashcardModalProps {
  flashcard: Flashcard;
  onClose: () => void;
  onUpdate: (flashcardId: string, updates: Partial<Flashcard>) => void;
}

const EditFlashcardModal: React.FC<EditFlashcardModalProps> = ({ flashcard, onClose, onUpdate }) => {
  const [frontContent, setFrontContent] = useState(flashcard.front_content);
  const [backContent, setBackContent] = useState(flashcard.back_content);
  const [topic, setTopic] = useState(flashcard.topic);
  const [difficultyLevel, setDifficultyLevel] = useState(flashcard.difficulty_level);

  const handleSave = () => {
    if (!frontContent.trim() || !backContent.trim() || !topic.trim()) {
      alert('Lütfen tüm alanları doldurun.');
      return;
    }

    onUpdate(flashcard.id!, {
      front_content: frontContent,
      back_content: backContent,
      topic,
      difficulty_level: difficultyLevel
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-gradient-to-r from-purple-500 to-blue-500 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Flashcard Düzenle</h2>
            <button onClick={onClose} className="text-white hover:text-gray-200 text-2xl">&times;</button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Konu</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Örn: Isı ve Sıcaklık"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Ön Yüz (Soru)</label>
            <textarea
              value={frontContent}
              onChange={(e) => setFrontContent(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows={4}
              placeholder="Kartın ön yüzündeki içerik (soru veya kavram)"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Arka Yüz (Cevap)</label>
            <textarea
              value={backContent}
              onChange={(e) => setBackContent(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows={4}
              placeholder="Kartın arka yüzündeki içerik (cevap veya açıklama)"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Zorluk Seviyesi</label>
            <select
              value={difficultyLevel}
              onChange={(e) => setDifficultyLevel(e.target.value as 'kolay' | 'orta' | 'zor')}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="kolay">Kolay</option>
              <option value="orta">Orta</option>
              <option value="zor">Zor</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
            >
              İptal
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 font-semibold"
            >
              Kaydet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditFlashcardModal;
