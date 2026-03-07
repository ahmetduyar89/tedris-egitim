import React, { useState, useEffect } from 'react';
import { RotateCcw, Plus, Trash2, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';
import { CoachingHabit, HabitFrequency } from '../../types';
import { getHabitsByStudent, createHabit, updateHabit, deleteHabit } from '../../services/coachingHabitService';

interface CoachingHabitManagerProps {
  studentId: string;
  tutorId: string;
  studentName: string;
}

const FREQUENCY_LABELS: Record<HabitFrequency, string> = {
  daily: 'Her Gün',
  weekdays: 'Hafta İçi',
  weekly: 'Haftalık',
};

const CoachingHabitManager: React.FC<CoachingHabitManagerProps> = ({
  studentId,
  tutorId,
  studentName,
}) => {
  const [habits, setHabits] = useState<CoachingHabit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    habitName: '',
    description: '',
    frequency: 'daily' as HabitFrequency,
    targetCount: 1,
  });

  useEffect(() => {
    loadHabits();
  }, [studentId]);

  const loadHabits = async () => {
    try {
      setLoading(true);
      const data = await getHabitsByStudent(studentId, false);
      setHabits(data);
    } catch (err) {
      console.error('Alışkanlıklar yüklenirken hata:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.habitName.trim()) return;
    try {
      await createHabit({
        studentId,
        tutorId,
        habitName: form.habitName,
        description: form.description || undefined,
        frequency: form.frequency,
        targetCount: form.targetCount,
      });
      setForm({ habitName: '', description: '', frequency: 'daily', targetCount: 1 });
      setShowForm(false);
      loadHabits();
    } catch (err) {
      console.error('Alışkanlık oluşturma hatası:', err);
    }
  };

  const handleToggleActive = async (habit: CoachingHabit) => {
    try {
      await updateHabit(habit.id, { isActive: !habit.isActive });
      loadHabits();
    } catch (err) {
      console.error('Durum değiştirme hatası:', err);
    }
  };

  const handleDelete = async (habitId: string) => {
    if (!confirm('Bu alışkanlığı silmek istediğinize emin misiniz?')) return;
    try {
      await deleteHabit(habitId);
      loadHabits();
    } catch (err) {
      console.error('Silme hatası:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <RotateCcw className="w-5 h-5 text-orange-500" />
          Alışkanlık Yönetimi - {studentName}
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
        >
          <Plus className="w-4 h-4" /> Yeni Alışkanlık
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Alışkanlık Adı *</label>
              <input
                value={form.habitName}
                onChange={e => setForm(prev => ({ ...prev, habitName: e.target.value }))}
                placeholder="Örn: Her gün 30 dk kitap oku"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Sıklık</label>
              <select
                value={form.frequency}
                onChange={e => setForm(prev => ({ ...prev, frequency: e.target.value as HabitFrequency }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                {Object.entries(FREQUENCY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-600 mb-1">Açıklama</label>
              <input
                value={form.description}
                onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Kısa açıklama..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-600">İptal</button>
            <button type="submit" className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">Oluştur</button>
          </div>
        </form>
      )}

      {habits.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <RotateCcw className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p>Henüz alışkanlık tanımlanmamış.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {habits.map(habit => (
            <div key={habit.id} className={`flex items-center gap-3 p-4 bg-white rounded-xl border transition-all ${
              habit.isActive ? 'border-gray-200' : 'border-gray-100 opacity-60'
            }`}>
              <div className="flex-1">
                <div className="font-medium text-gray-800">{habit.habitName}</div>
                {habit.description && <div className="text-sm text-gray-500">{habit.description}</div>}
                <div className="text-xs text-gray-400 mt-1">
                  {FREQUENCY_LABELS[habit.frequency]}
                </div>
              </div>
              <button
                onClick={() => handleToggleActive(habit)}
                className="text-gray-400 hover:text-gray-600"
                title={habit.isActive ? 'Devre dışı bırak' : 'Aktifleştir'}
              >
                {habit.isActive ? (
                  <ToggleRight className="w-6 h-6 text-green-500" />
                ) : (
                  <ToggleLeft className="w-6 h-6" />
                )}
              </button>
              <button
                onClick={() => handleDelete(habit.id)}
                className="text-gray-400 hover:text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CoachingHabitManager;
