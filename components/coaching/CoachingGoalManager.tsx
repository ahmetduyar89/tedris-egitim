import React, { useState, useEffect } from 'react';
import { Target, Plus, ChevronDown, ChevronUp, Trash2, CheckCircle, Circle, Pause, X, Loader2, Flag } from 'lucide-react';
import { CoachingGoal, CoachingMilestone, GoalType, GoalStatus, GoalCategory } from '../../types';
import {
  getGoalsByStudent,
  createGoal,
  updateGoal,
  deleteGoal,
  createMilestone,
  toggleMilestone,
  deleteMilestone,
  getGoalProgress,
  GOAL_TYPE_LABELS,
  GOAL_CATEGORY_LABELS,
  GOAL_STATUS_LABELS,
} from '../../services/coachingGoalService';

interface CoachingGoalManagerProps {
  studentId: string;
  tutorId: string;
  studentName: string;
  readOnly?: boolean;
}

const CoachingGoalManager: React.FC<CoachingGoalManagerProps> = ({
  studentId,
  tutorId,
  studentName,
  readOnly = false,
}) => {
  const [goals, setGoals] = useState<CoachingGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');

  // Form state
  const [form, setForm] = useState({
    title: '',
    description: '',
    goalType: 'short_term' as GoalType,
    category: 'academic' as GoalCategory,
    targetValue: '',
    unit: '',
    deadline: '',
    priority: 3,
  });

  useEffect(() => {
    loadGoals();
  }, [studentId]);

  const loadGoals = async () => {
    try {
      setLoading(true);
      const data = await getGoalsByStudent(studentId);
      setGoals(data);
    } catch (err) {
      console.error('Hedefler yüklenirken hata:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    try {
      await createGoal({
        studentId,
        tutorId,
        title: form.title,
        description: form.description || undefined,
        goalType: form.goalType,
        category: form.category,
        targetValue: form.targetValue ? parseFloat(form.targetValue) : undefined,
        unit: form.unit || undefined,
        deadline: form.deadline || undefined,
        priority: form.priority,
      });
      setForm({ title: '', description: '', goalType: 'short_term', category: 'academic', targetValue: '', unit: '', deadline: '', priority: 3 });
      setShowForm(false);
      loadGoals();
    } catch (err) {
      console.error('Hedef oluşturma hatası:', err);
      alert('Hedef oluşturulurken hata oluştu.');
    }
  };

  const handleStatusChange = async (goalId: string, status: GoalStatus) => {
    try {
      await updateGoal(goalId, { status });
      loadGoals();
    } catch (err) {
      console.error('Durum güncelleme hatası:', err);
    }
  };

  const handleProgressUpdate = async (goalId: string, value: string) => {
    const numVal = parseFloat(value);
    if (isNaN(numVal)) return;
    try {
      await updateGoal(goalId, { currentValue: numVal });
      loadGoals();
    } catch (err) {
      console.error('İlerleme güncelleme hatası:', err);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('Bu hedefi silmek istediğinize emin misiniz?')) return;
    try {
      await deleteGoal(goalId);
      loadGoals();
    } catch (err) {
      console.error('Hedef silme hatası:', err);
    }
  };

  const handleAddMilestone = async (goalId: string) => {
    if (!newMilestoneTitle.trim()) return;
    try {
      await createMilestone({ goalId, title: newMilestoneTitle });
      setNewMilestoneTitle('');
      loadGoals();
    } catch (err) {
      console.error('Milestone ekleme hatası:', err);
    }
  };

  const handleToggleMilestone = async (milestoneId: string, completed: boolean) => {
    try {
      await toggleMilestone(milestoneId, !completed);
      loadGoals();
    } catch (err) {
      console.error('Milestone güncelleme hatası:', err);
    }
  };

  const handleDeleteMilestone = async (milestoneId: string) => {
    try {
      await deleteMilestone(milestoneId);
      loadGoals();
    } catch (err) {
      console.error('Milestone silme hatası:', err);
    }
  };

  const getStatusColor = (status: GoalStatus) => {
    switch (status) {
      case 'active': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'completed': return 'text-green-600 bg-green-50 border-green-200';
      case 'paused': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'abandoned': return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority <= 2) return 'text-red-500';
    if (priority <= 3) return 'text-yellow-500';
    return 'text-gray-400';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');
  const otherGoals = goals.filter(g => g.status !== 'active' && g.status !== 'completed');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Target className="w-6 h-6 text-blue-500" />
          Hedefler - {studentName}
        </h2>
        {!readOnly && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Yeni Hedef
          </button>
        )}
      </div>

      {/* New Goal Form */}
      {showForm && (
        <form onSubmit={handleCreateGoal} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <h3 className="font-semibold text-gray-700">Yeni Hedef Oluştur</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-600 mb-1">Hedef Başlığı *</label>
              <input
                value={form.title}
                onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Örn: Matematik netini 20'ye çıkarmak"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-600 mb-1">Açıklama</label>
              <textarea
                value={form.description}
                onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Hedefe dair detaylar..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Hedef Tipi</label>
              <select
                value={form.goalType}
                onChange={e => setForm(prev => ({ ...prev, goalType: e.target.value as GoalType }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(GOAL_TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Kategori</label>
              <select
                value={form.category}
                onChange={e => setForm(prev => ({ ...prev, category: e.target.value as GoalCategory }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(GOAL_CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Hedef Değer</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={form.targetValue}
                  onChange={e => setForm(prev => ({ ...prev, targetValue: e.target.value }))}
                  placeholder="Örn: 20"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <input
                  value={form.unit}
                  onChange={e => setForm(prev => ({ ...prev, unit: e.target.value }))}
                  placeholder="Birim (net, saat...)"
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Son Tarih</label>
              <input
                type="date"
                value={form.deadline}
                onChange={e => setForm(prev => ({ ...prev, deadline: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Öncelik (1=En Yüksek)</label>
              <input
                type="range"
                min="1"
                max="5"
                value={form.priority}
                onChange={e => setForm(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>Kritik</span>
                <span>Normal</span>
                <span>Düşük</span>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">
              İptal
            </button>
            <button type="submit" className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
              Oluştur
            </button>
          </div>
        </form>
      )}

      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Aktif Hedefler ({activeGoals.length})</h3>
          {activeGoals.map(goal => (
            <GoalCard
              key={goal.id}
              goal={goal}
              expanded={expandedGoal === goal.id}
              onToggleExpand={() => setExpandedGoal(expandedGoal === goal.id ? null : goal.id)}
              onStatusChange={handleStatusChange}
              onProgressUpdate={handleProgressUpdate}
              onDelete={handleDeleteGoal}
              onAddMilestone={handleAddMilestone}
              onToggleMilestone={handleToggleMilestone}
              onDeleteMilestone={handleDeleteMilestone}
              newMilestoneTitle={newMilestoneTitle}
              onNewMilestoneTitleChange={setNewMilestoneTitle}
              getStatusColor={getStatusColor}
              getPriorityColor={getPriorityColor}
              readOnly={readOnly}
            />
          ))}
        </div>
      )}

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Tamamlanan Hedefler ({completedGoals.length})</h3>
          {completedGoals.map(goal => (
            <GoalCard
              key={goal.id}
              goal={goal}
              expanded={expandedGoal === goal.id}
              onToggleExpand={() => setExpandedGoal(expandedGoal === goal.id ? null : goal.id)}
              onStatusChange={handleStatusChange}
              onProgressUpdate={handleProgressUpdate}
              onDelete={handleDeleteGoal}
              onAddMilestone={handleAddMilestone}
              onToggleMilestone={handleToggleMilestone}
              onDeleteMilestone={handleDeleteMilestone}
              newMilestoneTitle={newMilestoneTitle}
              onNewMilestoneTitleChange={setNewMilestoneTitle}
              getStatusColor={getStatusColor}
              getPriorityColor={getPriorityColor}
              readOnly={readOnly}
            />
          ))}
        </div>
      )}

      {/* Other Goals */}
      {otherGoals.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Diğer ({otherGoals.length})</h3>
          {otherGoals.map(goal => (
            <GoalCard
              key={goal.id}
              goal={goal}
              expanded={expandedGoal === goal.id}
              onToggleExpand={() => setExpandedGoal(expandedGoal === goal.id ? null : goal.id)}
              onStatusChange={handleStatusChange}
              onProgressUpdate={handleProgressUpdate}
              onDelete={handleDeleteGoal}
              onAddMilestone={handleAddMilestone}
              onToggleMilestone={handleToggleMilestone}
              onDeleteMilestone={handleDeleteMilestone}
              newMilestoneTitle={newMilestoneTitle}
              onNewMilestoneTitleChange={setNewMilestoneTitle}
              getStatusColor={getStatusColor}
              getPriorityColor={getPriorityColor}
              readOnly={readOnly}
            />
          ))}
        </div>
      )}

      {goals.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Henüz hedef belirlenmemiş.</p>
          {!readOnly && <p className="text-sm mt-1">Yukarıdaki "Yeni Hedef" butonuyla başlayın.</p>}
        </div>
      )}
    </div>
  );
};

// ==================== GoalCard Sub-component ====================

interface GoalCardProps {
  goal: CoachingGoal;
  expanded: boolean;
  onToggleExpand: () => void;
  onStatusChange: (goalId: string, status: GoalStatus) => void;
  onProgressUpdate: (goalId: string, value: string) => void;
  onDelete: (goalId: string) => void;
  onAddMilestone: (goalId: string) => void;
  onToggleMilestone: (milestoneId: string, completed: boolean) => void;
  onDeleteMilestone: (milestoneId: string) => void;
  newMilestoneTitle: string;
  onNewMilestoneTitleChange: (v: string) => void;
  getStatusColor: (status: GoalStatus) => string;
  getPriorityColor: (priority: number) => string;
  readOnly: boolean;
}

const GoalCard: React.FC<GoalCardProps> = ({
  goal, expanded, onToggleExpand, onStatusChange, onProgressUpdate, onDelete,
  onAddMilestone, onToggleMilestone, onDeleteMilestone,
  newMilestoneTitle, onNewMilestoneTitleChange,
  getStatusColor, getPriorityColor, readOnly,
}) => {
  const progress = getGoalProgress(goal);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Goal Header */}
      <div className="p-4 cursor-pointer hover:bg-gray-50 transition-colors" onClick={onToggleExpand}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <Flag className={`w-4 h-4 ${getPriorityColor(goal.priority)}`} />
            <div className="flex-1">
              <h4 className="font-semibold text-gray-800">{goal.title}</h4>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-0.5 rounded-full text-xs border ${getStatusColor(goal.status)}`}>
                  {GOAL_STATUS_LABELS[goal.status]}
                </span>
                <span className="text-xs text-gray-400">{GOAL_TYPE_LABELS[goal.goalType]}</span>
                {goal.category && (
                  <span className="text-xs text-gray-400">| {GOAL_CATEGORY_LABELS[goal.category]}</span>
                )}
                {goal.deadline && (
                  <span className="text-xs text-gray-400">| Son: {new Date(goal.deadline).toLocaleDateString('tr-TR')}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {goal.targetValue && (
              <div className="text-right">
                <div className="text-sm font-medium text-gray-700">
                  {goal.currentValue}/{goal.targetValue} {goal.unit}
                </div>
                <div className="w-24 h-2 bg-gray-200 rounded-full mt-1">
                  <div
                    className="h-2 bg-blue-500 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
            {expanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-gray-100 p-4 space-y-4">
          {goal.description && (
            <p className="text-sm text-gray-600">{goal.description}</p>
          )}

          {/* Progress Update */}
          {!readOnly && goal.status === 'active' && goal.targetValue && (
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-600">Mevcut İlerleme:</label>
              <input
                type="number"
                defaultValue={goal.currentValue}
                onBlur={e => onProgressUpdate(goal.id, e.target.value)}
                className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
              />
              <span className="text-sm text-gray-400">{goal.unit} ({progress}%)</span>
            </div>
          )}

          {/* Milestones */}
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-2">Alt Hedefler (Milestones)</h5>
            <div className="space-y-2">
              {(goal.milestones || []).map(ms => (
                <div key={ms.id} className="flex items-center gap-2 group">
                  <button
                    onClick={() => !readOnly && onToggleMilestone(ms.id, ms.completed)}
                    disabled={readOnly}
                    className="flex-shrink-0"
                  >
                    {ms.completed ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-300 hover:text-gray-400" />
                    )}
                  </button>
                  <span className={`text-sm flex-1 ${ms.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                    {ms.title}
                  </span>
                  {!readOnly && (
                    <button
                      onClick={() => onDeleteMilestone(ms.id)}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              {!readOnly && (
                <div className="flex gap-2 mt-2">
                  <input
                    value={newMilestoneTitle}
                    onChange={e => onNewMilestoneTitleChange(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && onAddMilestone(goal.id)}
                    placeholder="Yeni alt hedef ekle..."
                    className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                  />
                  <button
                    onClick={() => onAddMilestone(goal.id)}
                    className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          {!readOnly && (
            <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
              {goal.status === 'active' && (
                <>
                  <button
                    onClick={() => onStatusChange(goal.id, 'completed')}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-green-600 hover:bg-green-50 rounded-lg"
                  >
                    <CheckCircle className="w-4 h-4" /> Tamamla
                  </button>
                  <button
                    onClick={() => onStatusChange(goal.id, 'paused')}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-yellow-600 hover:bg-yellow-50 rounded-lg"
                  >
                    <Pause className="w-4 h-4" /> Duraklat
                  </button>
                </>
              )}
              {goal.status === 'paused' && (
                <button
                  onClick={() => onStatusChange(goal.id, 'active')}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  Devam Et
                </button>
              )}
              <div className="flex-1" />
              <button
                onClick={() => onDelete(goal.id)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 rounded-lg"
              >
                <Trash2 className="w-4 h-4" /> Sil
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CoachingGoalManager;
