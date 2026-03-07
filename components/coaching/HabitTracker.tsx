import React, { useState, useEffect } from 'react';
import { Check, Flame, Loader2, RotateCcw } from 'lucide-react';
import { CoachingHabit, CoachingHabitLog } from '../../types';
import { getHabitLogsForDate, toggleHabitLog, getHabitStreak } from '../../services/coachingHabitService';

interface HabitTrackerProps {
  studentId: string;
  date?: string;
  readOnly?: boolean;
}

const HabitTracker: React.FC<HabitTrackerProps> = ({
  studentId,
  date,
  readOnly = false,
}) => {
  const today = date || new Date().toISOString().split('T')[0];
  const [habits, setHabits] = useState<(CoachingHabitLog & { habit: CoachingHabit })[]>([]);
  const [streaks, setStreaks] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [studentId, today]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getHabitLogsForDate(studentId, today);
      setHabits(data);

      const streakMap: Record<string, number> = {};
      for (const item of data) {
        streakMap[item.habitId] = await getHabitStreak(item.habitId);
      }
      setStreaks(streakMap);
    } catch (err) {
      console.error('Alışkanlıklar yüklenirken hata:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (habitId: string, currentCompleted: boolean) => {
    if (readOnly) return;
    try {
      await toggleHabitLog(habitId, today, !currentCompleted);
      loadData();
    } catch (err) {
      console.error('Toggle hatası:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
      </div>
    );
  }

  if (habits.length === 0) {
    return (
      <div className="text-center py-6 text-gray-400 text-sm">
        <RotateCcw className="w-8 h-8 mx-auto mb-2 opacity-50" />
        Henüz alışkanlık atanmamış.
      </div>
    );
  }

  const completedCount = habits.filter(h => h.completed).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-500" />
          Günlük Alışkanlıklar
        </h4>
        <span className="text-xs text-gray-400">
          {completedCount}/{habits.length} tamamlandı
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-gray-200 rounded-full">
        <div
          className="h-2 bg-orange-500 rounded-full transition-all"
          style={{ width: `${habits.length > 0 ? (completedCount / habits.length) * 100 : 0}%` }}
        />
      </div>

      {/* Habit List */}
      <div className="space-y-2">
        {habits.map(item => (
          <div
            key={item.habitId}
            onClick={() => handleToggle(item.habitId, item.completed)}
            className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
              readOnly ? '' : 'cursor-pointer'
            } ${
              item.completed
                ? 'bg-orange-50 border-orange-200'
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
              item.completed
                ? 'bg-orange-500 border-orange-500'
                : 'border-gray-300'
            }`}>
              {item.completed && <Check className="w-4 h-4 text-white" />}
            </div>
            <div className="flex-1">
              <div className={`text-sm font-medium ${item.completed ? 'text-orange-700' : 'text-gray-700'}`}>
                {item.habit.habitName}
              </div>
              {item.habit.description && (
                <div className="text-xs text-gray-400">{item.habit.description}</div>
              )}
            </div>
            {streaks[item.habitId] > 0 && (
              <div className="flex items-center gap-1 text-xs text-orange-500 font-medium">
                <Flame className="w-3 h-3" />
                {streaks[item.habitId]}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default HabitTracker;
