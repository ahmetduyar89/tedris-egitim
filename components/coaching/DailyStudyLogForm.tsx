import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, X, Save, Loader2, Clock, Smile, Zap } from 'lucide-react';
import { DailyStudyLog, StudyLogEntry, Subject } from '../../types';
import { getStudyLog, upsertStudyLog } from '../../services/studyLogService';

interface DailyStudyLogFormProps {
  studentId: string;
  date?: string;
  readOnly?: boolean;
  onSaved?: () => void;
}

const MOOD_LABELS = ['Kötü', 'Düşük', 'Normal', 'İyi', 'Harika'];
const ENERGY_LABELS = ['Çok Düşük', 'Düşük', 'Normal', 'Yüksek', 'Çok Yüksek'];

const DailyStudyLogForm: React.FC<DailyStudyLogFormProps> = ({
  studentId,
  date,
  readOnly = false,
  onSaved,
}) => {
  const today = date || new Date().toISOString().split('T')[0];
  const [log, setLog] = useState<Partial<DailyStudyLog>>({
    studentId,
    logDate: today,
    entries: [],
    mood: 3,
    energyLevel: 3,
    reflection: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(today);

  useEffect(() => {
    loadLog();
  }, [studentId, selectedDate]);

  const loadLog = async () => {
    try {
      setLoading(true);
      const existing = await getStudyLog(studentId, selectedDate);
      if (existing) {
        setLog(existing);
      } else {
        setLog({
          studentId,
          logDate: selectedDate,
          entries: [],
          mood: 3,
          energyLevel: 3,
          reflection: '',
        });
      }
    } catch (err) {
      console.error('Log yüklenirken hata:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await upsertStudyLog({
        studentId,
        logDate: selectedDate,
        entries: log.entries || [],
        mood: log.mood,
        energyLevel: log.energyLevel,
        reflection: log.reflection,
      });
      onSaved?.();
      alert('Çalışma logu kaydedildi!');
    } catch (err) {
      console.error('Kaydetme hatası:', err);
      alert('Kaydedilirken hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  const addEntry = () => {
    setLog(prev => ({
      ...prev,
      entries: [...(prev.entries || []), { subject: '', topic: '', durationMinutes: 30, type: 'study', notes: '' }],
    }));
  };

  const updateEntry = (index: number, updates: Partial<StudyLogEntry>) => {
    setLog(prev => ({
      ...prev,
      entries: (prev.entries || []).map((e, i) => i === index ? { ...e, ...updates } : e),
    }));
  };

  const removeEntry = (index: number) => {
    setLog(prev => ({
      ...prev,
      entries: (prev.entries || []).filter((_, i) => i !== index),
    }));
  };

  const totalMinutes = (log.entries || []).reduce((sum, e) => sum + (e.durationMinutes || 0), 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4 text-white">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Günlük Çalışma Logu
          </h3>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 bg-white/20 border border-white/30 rounded-lg text-white text-sm [color-scheme:dark]"
              disabled={readOnly}
            />
            <div className="text-right">
              <div className="text-xl font-bold">
                {totalHours > 0 ? `${totalHours}sa ` : ''}{remainingMinutes}dk
              </div>
              <div className="text-xs text-emerald-100">Toplam Çalışma</div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Study Entries */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-700">Çalışma Kayıtları</h4>
            {!readOnly && (
              <button
                onClick={addEntry}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100"
              >
                <Plus className="w-4 h-4" /> Ekle
              </button>
            )}
          </div>

          {(log.entries || []).length === 0 ? (
            <div className="text-center py-6 text-gray-400 text-sm">
              Henüz çalışma kaydı eklenmedi.
            </div>
          ) : (
            <div className="space-y-3">
              {(log.entries || []).map((entry, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg group">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Ders</label>
                      <select
                        value={entry.subject}
                        onChange={e => updateEntry(i, { subject: e.target.value })}
                        disabled={readOnly}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg"
                      >
                        <option value="">Seçiniz</option>
                        {Object.values(Subject).map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Konu</label>
                      <input
                        value={entry.topic || ''}
                        onChange={e => updateEntry(i, { topic: e.target.value })}
                        disabled={readOnly}
                        placeholder="Konu..."
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        <Clock className="w-3 h-3 inline" /> Süre (dk)
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="480"
                        step="5"
                        value={entry.durationMinutes}
                        onChange={e => updateEntry(i, { durationMinutes: parseInt(e.target.value) || 0 })}
                        disabled={readOnly}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Not</label>
                      <input
                        value={entry.notes || ''}
                        onChange={e => updateEntry(i, { notes: e.target.value })}
                        disabled={readOnly}
                        placeholder="Kısa not..."
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                  {!readOnly && (
                    <button
                      onClick={() => removeEntry(i)}
                      className="mt-5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mood & Energy */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-1 mb-2">
              <Smile className="w-4 h-4" /> Ruh Hali
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => !readOnly && setLog(prev => ({ ...prev, mood: val }))}
                  disabled={readOnly}
                  className={`flex-1 py-2 rounded-lg text-sm transition-all ${
                    log.mood === val
                      ? 'bg-emerald-500 text-white font-medium'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {MOOD_LABELS[val - 1]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-1 mb-2">
              <Zap className="w-4 h-4" /> Enerji Seviyesi
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => !readOnly && setLog(prev => ({ ...prev, energyLevel: val }))}
                  disabled={readOnly}
                  className={`flex-1 py-2 rounded-lg text-sm transition-all ${
                    log.energyLevel === val
                      ? 'bg-amber-500 text-white font-medium'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {ENERGY_LABELS[val - 1]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Reflection */}
        <div>
          <label className="text-sm font-semibold text-gray-700 mb-2 block">Günün Değerlendirmesi</label>
          <textarea
            value={log.reflection || ''}
            onChange={e => setLog(prev => ({ ...prev, reflection: e.target.value }))}
            disabled={readOnly}
            placeholder="Bugün nasıl geçti? Neler öğrendin? Hangi konularda zorlandın?"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 resize-none"
          />
        </div>

        {/* Tutor Comment (read-only for student) */}
        {log.tutorComment && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <span className="text-xs font-medium text-blue-600 uppercase">Koç Yorumu:</span>
            <p className="text-sm text-blue-800 mt-1">{log.tutorComment}</p>
          </div>
        )}

        {/* Save Button */}
        {!readOnly && (
          <div className="flex justify-end pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Kaydet
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyStudyLogForm;
