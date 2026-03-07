import React, { useState } from 'react';
import { Calendar, Clock, MessageSquare, Plus, X, Save, Loader2 } from 'lucide-react';
import { CoachingActionItem, SessionType } from '../../types';
import { createSession, SESSION_TYPE_LABELS, MOOD_EMOJIS } from '../../services/coachingSessionService';

interface CoachingSessionFormProps {
  studentId: string;
  tutorId: string;
  studentName: string;
  onSaved: () => void;
  onCancel: () => void;
}

const CoachingSessionForm: React.FC<CoachingSessionFormProps> = ({
  studentId,
  tutorId,
  studentName,
  onSaved,
  onCancel,
}) => {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    sessionDate: new Date().toISOString().slice(0, 16),
    durationMinutes: 30,
    sessionType: 'regular' as SessionType,
    topicsDiscussed: [] as string[],
    actionItems: [] as CoachingActionItem[],
    studentMood: 3,
    coachNotes: '',
    studentFeedback: '',
    nextSessionDate: '',
  });
  const [newTopic, setNewTopic] = useState('');
  const [newAction, setNewAction] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await createSession({
        studentId,
        tutorId,
        sessionDate: new Date(form.sessionDate).toISOString(),
        durationMinutes: form.durationMinutes,
        sessionType: form.sessionType,
        topicsDiscussed: form.topicsDiscussed,
        actionItems: form.actionItems,
        studentMood: form.studentMood,
        coachNotes: form.coachNotes || undefined,
        studentFeedback: form.studentFeedback || undefined,
        nextSessionDate: form.nextSessionDate ? new Date(form.nextSessionDate).toISOString() : undefined,
      });
      onSaved();
    } catch (err) {
      console.error('Seans kaydetme hatası:', err);
      alert('Seans kaydedilirken hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  const addTopic = () => {
    if (!newTopic.trim()) return;
    setForm(prev => ({ ...prev, topicsDiscussed: [...prev.topicsDiscussed, newTopic.trim()] }));
    setNewTopic('');
  };

  const removeTopic = (index: number) => {
    setForm(prev => ({ ...prev, topicsDiscussed: prev.topicsDiscussed.filter((_, i) => i !== index) }));
  };

  const addAction = () => {
    if (!newAction.trim()) return;
    setForm(prev => ({
      ...prev,
      actionItems: [...prev.actionItems, { task: newAction.trim(), status: 'pending' }],
    }));
    setNewAction('');
  };

  const removeAction = (index: number) => {
    setForm(prev => ({ ...prev, actionItems: prev.actionItems.filter((_, i) => i !== index) }));
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-purple-500" />
          Yeni Koçluk Seansı - {studentName}
        </h3>
        <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            <Calendar className="w-4 h-4 inline mr-1" />Tarih & Saat
          </label>
          <input
            type="datetime-local"
            value={form.sessionDate}
            onChange={e => setForm(prev => ({ ...prev, sessionDate: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            <Clock className="w-4 h-4 inline mr-1" />Süre (dk)
          </label>
          <input
            type="number"
            min="5"
            max="180"
            value={form.durationMinutes}
            onChange={e => setForm(prev => ({ ...prev, durationMinutes: parseInt(e.target.value) || 30 }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Seans Tipi</label>
          <select
            value={form.sessionType}
            onChange={e => setForm(prev => ({ ...prev, sessionType: e.target.value as SessionType }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            {Object.entries(SESSION_TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Student Mood */}
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-2">Öğrenci Ruh Hali</label>
        <div className="flex gap-3">
          {MOOD_EMOJIS.map((emoji, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setForm(prev => ({ ...prev, studentMood: index + 1 }))}
              className={`text-3xl p-2 rounded-lg transition-all ${
                form.studentMood === index + 1
                  ? 'bg-purple-100 scale-125 ring-2 ring-purple-400'
                  : 'hover:bg-gray-100'
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Topics Discussed */}
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-2">Tartışılan Konular</label>
        <div className="flex gap-2 mb-2">
          <input
            value={newTopic}
            onChange={e => setNewTopic(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTopic())}
            placeholder="Konu ekle..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          />
          <button type="button" onClick={addTopic} className="px-3 py-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {form.topicsDiscussed.map((topic, i) => (
            <span key={i} className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm flex items-center gap-1">
              {topic}
              <button type="button" onClick={() => removeTopic(i)} className="hover:text-purple-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Action Items */}
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-2">Aksiyon Maddeleri</label>
        <div className="flex gap-2 mb-2">
          <input
            value={newAction}
            onChange={e => setNewAction(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addAction())}
            placeholder="Yapılacak iş ekle..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          />
          <button type="button" onClick={addAction} className="px-3 py-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-1">
          {form.actionItems.map((item, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
              <span className="text-sm flex-1">{item.task}</span>
              <button type="button" onClick={() => removeAction(i)} className="text-gray-400 hover:text-red-500">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Koç Notları</label>
          <textarea
            value={form.coachNotes}
            onChange={e => setForm(prev => ({ ...prev, coachNotes: e.target.value }))}
            placeholder="Seans notları..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 resize-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Öğrenci Geri Bildirimi</label>
          <textarea
            value={form.studentFeedback}
            onChange={e => setForm(prev => ({ ...prev, studentFeedback: e.target.value }))}
            placeholder="Öğrencinin söyledikleri..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 resize-none"
          />
        </div>
      </div>

      {/* Next Session */}
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">Sonraki Seans Tarihi</label>
        <input
          type="datetime-local"
          value={form.nextSessionDate}
          onChange={e => setForm(prev => ({ ...prev, nextSessionDate: e.target.value }))}
          className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-600 hover:text-gray-800">
          İptal
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Kaydet
        </button>
      </div>
    </form>
  );
};

export default CoachingSessionForm;
