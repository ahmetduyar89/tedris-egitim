import React, { useMemo, useState } from 'react';
import { WeeklyProgram, Task, TaskStatus, Subject, Assignment } from '../types';
import { db } from '../services/dbAdapter';

interface EditableWeeklyScheduleProps {
  program: WeeklyProgram;
  assignments?: Assignment[];
  onProgramUpdate: (program: WeeklyProgram) => void;
  focusDay?: string; // e.g. 'Pazartesi'
}

const subjectConfig: { [key in Subject]?: { borderColor: string; textColor: string; bgColor: string; icon: React.ReactNode } } = {
  [Subject.Mathematics]: {
    borderColor: 'border-secondary',
    textColor: 'text-secondary',
    bgColor: 'bg-red-50',
    icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008Zm0 3h.008v.008H8.25v-.008Zm0 3h.008v.008H8.25v-.008Zm3-6h.008v.008H11.25v-.008Zm0 3h.008v.008H11.25v-.008Zm0 3h.008v.008H11.25v-.008Zm3-6h.008v.008H14.25v-.008Zm0 3h.008v.008H14.25v-.008Zm0 3h.008v.008H14.25v-.008ZM6 21a2.25 2.25 0 0 1-2.25-2.25V15a2.25 2.25 0 0 1 2.25-2.25h12A2.25 2.25 0 0 1 20.25 15v3.75a2.25 2.25 0 0 1-2.25 2.25H6Z" /></svg>
  },
  [Subject.Science]: {
    borderColor: 'border-primary',
    textColor: 'text-primary',
    bgColor: 'bg-primary/10',
    icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M14.25 10.5a8.85 8.85 0 0 1 6.3 2.653M3.75 10.5a8.85 8.85 0 0 0 6.3 2.653M10.5 3.75a8.85 8.85 0 0 1 6.3 2.653M3.75 3.75a8.85 8.85 0 0 0 6.3 2.653M10.5 20.25a8.85 8.85 0 0 0-6.3-2.653M20.25 20.25a8.85 8.85 0 0 1-6.3-2.653M14.25 10.5l-3.75 3.75-3.75-3.75M10.5 3.75v16.5" /></svg>
  },
  [Subject.Turkish]: {
    borderColor: 'border-accent',
    textColor: 'text-accent',
    bgColor: 'bg-amber-50',
    icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" /></svg>
  },
};
const defaultConfig = {
  borderColor: 'border-gray-400',
  textColor: 'text-gray-500',
  bgColor: 'bg-gray-50',
  icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" /></svg>
};

const EditableWeeklySchedule: React.FC<EditableWeeklyScheduleProps> = ({ program, assignments, onProgramUpdate, focusDay }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDayForAdd, setSelectedDayForAdd] = useState<number>(0);
  const [addForm, setAddForm] = useState<Partial<Task>>({});
  const [editingTask, setEditingTask] = useState<{ dayIndex: number; taskIndex: number } | null>(null);
  const [editForm, setEditForm] = useState<Partial<Task>>({});

  const dayNames = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

  const displayProgram = useMemo(() => {
    if (!program) return null;

    // Deep clone to avoid mutating props and to serve as base for display
    // We NO LONGER merge assignments automatically. Teacher manages everything manually.
    const p = { ...program, days: program.days.map(d => ({ ...d, tasks: [...d.tasks] })) };

    return p;
  }, [program]);

  const { weeklyTotal, completedCount, completionPercentage } = useMemo(() => {
    let totalTasks = 0;
    let completedTasks = 0;

    // Use displayProgram so stats reflect what is shown
    ((displayProgram || program).days || []).forEach(day => {
      const tasks = day.tasks || [];
      tasks.forEach(task => {
        totalTasks++;
        if (task.status === TaskStatus.Completed) {
          completedTasks++;
        }
      });
    });

    const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    return { weeklyTotal: totalTasks, completedCount: completedTasks, completionPercentage: percentage };
  }, [displayProgram, program]);

  const deleteTask = async (dayIndex: number, taskIndex: number) => {
    if (!confirm('Bu görevi silmek istediğinize emin misiniz?')) return;

    try {
      // Create a deep copy of the days to avoid mutating props
      const updatedDays = program.days.map((day, dIndex) => {
        if (dIndex === dayIndex) {
          return {
            ...day,
            tasks: day.tasks.filter((_, tIndex) => tIndex !== taskIndex)
          };
        }
        return day;
      });

      await db.collection('weeklyPrograms').doc(program.id).update({
        days: updatedDays
      });

      onProgramUpdate({ ...program, days: updatedDays });
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Görev silinirken bir hata oluştu.');
    }
  };

  const startEdit = (dayIndex: number, taskIndex: number) => {
    const originalTask = program.days[dayIndex].tasks[taskIndex];
    if (!originalTask) return;

    setEditingTask({ dayIndex, taskIndex });
    setEditForm({ ...originalTask });
  };

  const saveEdit = async () => {
    if (!editingTask) return;

    try {
      const updatedDays = program.days.map((day, dIndex) => {
        if (dIndex === editingTask.dayIndex) {
          return {
            ...day,
            tasks: day.tasks.map((task, tIndex) => {
              if (tIndex === editingTask.taskIndex) {
                return { ...task, ...editForm };
              }
              return task;
            })
          };
        }
        return day;
      });

      await db.collection('weeklyPrograms').doc(program.id).update({
        days: updatedDays
      });

      onProgramUpdate({ ...program, days: updatedDays });
      setEditingTask(null);
      setEditForm({});
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Görev güncellenirken bir hata oluştu.');
    }
  };

  const addTask = async () => {
    if (!addForm.title || !addForm.type || !addForm.subject) {
      alert('Lütfen tüm gerekli alanları doldurun.');
      return;
    }

    try {
      const newTask: Task = {
        id: `task_${Date.now()}`,
        type: addForm.type as string,
        title: addForm.title,
        description: addForm.title || '',
        subject: addForm.subject as Subject,
        duration: addForm.duration || 30,
        status: 'Atandı' as any,
        metadata: addForm.metadata || {}
      };

      const updatedDays = program.days.map((day, dIndex) => {
        if (dIndex === selectedDayForAdd) {
          return {
            ...day,
            tasks: [...day.tasks, newTask]
          };
        }
        return day;
      });

      await db.collection('weeklyPrograms').doc(program.id).update({
        days: updatedDays
      });

      onProgramUpdate({ ...program, days: updatedDays });
      setShowAddModal(false);
      setAddForm({});
    } catch (error) {
      console.error('Error adding task:', error);
      alert('Görev eklenirken bir hata oluştu.');
    }
  };

  const updateTaskStatus = async (dayIndex: number, taskIndex: number, newStatus: TaskStatus, e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      const updatedDays = program.days.map((day, dIndex) => {
        if (dIndex === dayIndex) {
          return {
            ...day,
            tasks: day.tasks.map((task, tIndex) => {
              if (tIndex === taskIndex) {
                // Toggle logic if same status clicked (case-insensitive check)
                const currentStatus = (task.status || '').toLowerCase();
                const targetStatus = (newStatus as string).toLowerCase();

                // If clicking the same status, revert to 'Assigned' (toggle off)
                const finalStatus = currentStatus === targetStatus ? TaskStatus.Assigned : newStatus;
                return { ...task, status: finalStatus };
              }
              return task;
            })
          };
        }
        return day;
      });

      await db.collection('weeklyPrograms').doc(program.id).update({
        days: updatedDays
      });

      onProgramUpdate({ ...program, days: updatedDays });
    } catch (error) {
      console.error('Error updating task status:', error);
      alert('Durum güncellenirken bir hata oluştu.');
    }
  };

  const TaskCard: React.FC<{ task: Task; dayIndex: number; taskIndex: number }> = ({ task, dayIndex, taskIndex }) => {
    const config = subjectConfig[task.subject as Subject] || defaultConfig;

    // Status checks
    // Handle both enum values and potential string variants just in case
    const status = task.status ? (task.status as string).toLowerCase() : '';
    const isCompleted = status === 'tamamlandı' || status === 'completed';
    const isFailed = status === 'yapılmadı' || status === 'failed' || status === 'yapilmadi';

    const isEditing = editingTask?.dayIndex === dayIndex && editingTask?.taskIndex === taskIndex;

    let borderClass = config.borderColor;
    let bgColorClass = config.bgColor;

    if (isCompleted) {
      borderClass = 'border-green-500';
      bgColorClass = 'bg-green-50';
    } else if (isFailed) {
      borderClass = 'border-red-500';
      bgColorClass = 'bg-red-50';
    }

    if (isEditing) {
      return (
        <div className="p-4 rounded-xl bg-blue-50 border-2 border-primary shadow-sm mb-2">
          {/* Edit form implementation remains same */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Görev Başlığı</label>
                <input
                  type="text"
                  value={editForm.title || ''}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Ders</label>
                <input
                  type="text"
                  value={editForm.subject || ''}
                  onChange={(e) => setEditForm({ ...editForm, subject: e.target.value as Subject })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Görev Tipi</label>
              <select
                value={editForm.type || ''}
                onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary"
              >
                <option value="Konu Anlatımı">Konu Anlatımı</option>
                <option value="Alıştırma">Alıştırma</option>
                <option value="Test">Test</option>
                <option value="Ödev">Ödev</option>
                <option value="Tekrar">Tekrar</option>
              </select>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={saveEdit}
                className="flex-1 px-3 py-2 text-sm bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark"
              >
                Kaydet
              </button>
              <button
                onClick={() => { setEditingTask(null); setEditForm({}); }}
                className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      );
    }

    const displayTitle = task.title || task.description || 'Başlıksız Görev';
    const displayType = task.type || '';

    return (
      <div className={`p-4 rounded-xl transition-all shadow-sm ${bgColorClass} mb-2 relative group-task border-l-4 ${borderClass}`}>
        <div className="flex items-start justify-between gap-3">

          {/* Status Buttons */}
          <div className="flex flex-col gap-1 mt-0.5">
            {/* Approve Button (Check) */}
            <button
              onClick={(e) => updateTaskStatus(dayIndex, taskIndex, TaskStatus.Completed, e)}
              className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${isCompleted
                ? 'bg-green-500 border-green-500 text-white shadow-md scale-110'
                : 'border-gray-300 bg-white text-gray-300 hover:border-green-400 hover:text-green-500'
                }`}
              title="Tamamlandı olarak işaretle"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
              </svg>
            </button>

            {/* Reject Button (Cross) */}
            <button
              onClick={(e) => updateTaskStatus(dayIndex, taskIndex, 'Yapılmadı' as TaskStatus, e)}
              className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${isFailed
                ? 'bg-red-500 border-red-500 text-white shadow-md scale-110'
                : 'border-gray-300 bg-white text-gray-300 hover:border-red-400 hover:text-red-500'
                }`}
              title="Yapılmadı olarak işaretle"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>

          <div className="flex-1">
            <p className={`text-base ${(isCompleted || isFailed) ? 'text-gray-500' : 'text-gray-800'} ${isCompleted ? 'line-through' : ''}`}>
              {displayType && `${displayType}: `}{displayTitle}
              {isFailed && <span className="ml-2 text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded">YAPILMADI</span>}
            </p>
          </div>

          {/* Always show edit/delete buttons - REMOVED opacity logic to ensure visibility */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => startEdit(dayIndex, taskIndex)}
              className="w-8 h-8 rounded flex items-center justify-center text-blue-600 hover:bg-blue-50 transition-colors"
              title="Düzenle"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
            </button>
            <button
              onClick={() => deleteTask(dayIndex, taskIndex)}
              className="w-8 h-8 rounded flex items-center justify-center text-red-600 hover:bg-red-50 transition-colors"
              title="Sil"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (!displayProgram) return null;

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden transition-all duration-300">
      <div
        className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6 flex justify-between items-center cursor-pointer hover:brightness-110 transition-all group"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div>
          <h2 className="text-2xl font-bold font-poppins text-white flex items-center gap-2">
            <span className="bg-white/20 p-1.5 rounded-lg text-white">📅</span>
            Haftalık Plan
          </h2>
          <p className="text-blue-100 mt-1">{completedCount} / {weeklyTotal} görev tamamlandı.</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-center hidden sm:block">
            <div className="relative w-16 h-16">
              <svg className="w-full h-full" viewBox="0 0 36 36">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="3" />
                <path className="transition-all duration-500 ease-in-out" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="white" strokeWidth="3" strokeDasharray={`${completionPercentage}, 100`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-sm font-bold font-poppins text-white">{completionPercentage}%</span>
              </div>
            </div>
          </div>
          <div className="bg-white/20 rounded-full p-2 group-hover:bg-white/30 transition-colors">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              className={`w-6 h-6 text-white transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="p-6 space-y-6 bg-card-background animate-fade-in-down">
          {displayProgram.days
            .filter(day => !focusDay || day.day === focusDay)
            .map((day, filteredIndex) => {
              // Find the original index for dayNames and updates
              const dayIndex = dayNames.indexOf(day.day);
              return (
                <div key={dayIndex}>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      <span className="w-2 h-8 rounded-full bg-blue-500"></span>
                      {day.day}
                    </h3>
                    <button
                      onClick={() => {
                        setSelectedDayForAdd(dayIndex);
                        setShowAddModal(true);
                      }}
                      className="text-sm px-3 py-1 bg-blue-50 text-blue-600 rounded-lg font-bold hover:bg-blue-100 transition-colors"
                    >
                      + Ekle
                    </button>
                  </div>
                  <div className="space-y-2">
                    {day.tasks.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">Bu gün için görev yok</p>
                    ) : (
                      day.tasks.map((task, taskIndex) => (
                        <TaskCard key={taskIndex} task={task} dayIndex={dayIndex} taskIndex={taskIndex} />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
            <div className="bg-gradient-to-r from-primary to-primary-dark text-white p-5 rounded-t-2xl">
              <h3 className="text-xl font-bold">{dayNames[selectedDayForAdd]} - Yeni Görev</h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Görev Başlığı *</label>
                <input
                  type="text"
                  value={addForm.title || ''}
                  onChange={(e) => setAddForm({ ...addForm, title: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Örn: Matematik Alıştırmaları"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Görev Tipi *</label>
                  <select
                    value={addForm.type || ''}
                    onChange={(e) => setAddForm({ ...addForm, type: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  >
                    <option value="">Seçin</option>
                    <option value="Konu Anlatımı">Konu Anlatımı</option>
                    <option value="Alıştırma">Alıştırma</option>
                    <option value="Test">Test</option>
                    <option value="Ödev">Ödev</option>
                    <option value="Tekrar">Tekrar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Ders *</label>
                  <input
                    type="text"
                    value={addForm.subject || ''}
                    onChange={(e) => setAddForm({ ...addForm, subject: e.target.value as Subject })}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="Örn: Matematik"
                  />
                </div>
              </div>
            </div>
            <div className="p-5 bg-gray-50 rounded-b-2xl flex gap-3">
              <button
                onClick={addTask}
                className="flex-1 px-4 py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark"
              >
                Ekle
              </button>
              <button
                onClick={() => { setShowAddModal(false); setAddForm({}); }}
                className="px-4 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-50"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditableWeeklySchedule;
