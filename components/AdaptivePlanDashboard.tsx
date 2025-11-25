import React, { useState, useEffect } from 'react';
import { adaptivePlanService } from '../services/adaptivePlanService';
import { TedrisPlanTask } from '../services/knowledgeGraphService';

interface AdaptivePlanDashboardProps {
  studentId: string;
  onTaskComplete?: (task: TedrisPlanTask) => void;
}

const AdaptivePlanDashboard: React.FC<AdaptivePlanDashboardProps> = ({ studentId, onTaskComplete }) => {
  const [todayTasks, setTodayTasks] = useState<TedrisPlanTask[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<TedrisPlanTask[]>([]);
  const [progress, setProgress] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'today' | 'upcoming'>('today');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadTasks();
  }, [studentId]);

  const loadTasks = async () => {
    setIsLoading(true);
    try {
      const today = await adaptivePlanService.getTodayTasks(studentId);
      const upcoming = await adaptivePlanService.getUpcomingTasks(studentId, 7);
      const prog = await adaptivePlanService.getPlanProgress(studentId);

      setTodayTasks(today);
      setUpcomingTasks(upcoming);
      setProgress(prog);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePlan = async () => {
    setIsGenerating(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const result = await adaptivePlanService.generateAdaptivePlan(studentId, 'manual_trigger', 7);
      console.log('Plan generation result:', result);

      if (result.success) {
        setSuccessMessage(result.message || 'Plan başarıyla oluşturuldu!');
        await loadTasks();
      } else {
        setError(result.message || 'Plan oluşturulamadı');
      }
    } catch (error: any) {
      console.error('Error generating plan:', error);
      setError(error.message || 'Plan oluşturulurken hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsGenerating(false);
      setTimeout(() => {
        setError(null);
        setSuccessMessage(null);
      }, 5000);
    }
  };

  const handleStartTask = async (taskId: string) => {
    try {
      await adaptivePlanService.startTask(taskId);
      await loadTasks();
    } catch (error) {
      console.error('Error starting task:', error);
    }
  };

  const handleCompleteTask = async (task: TedrisPlanTask) => {
    try {
      await adaptivePlanService.completeTask(task.id);
      await loadTasks();
      onTaskComplete?.(task);
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  const handleSkipTask = async (taskId: string) => {
    try {
      await adaptivePlanService.skipTask(taskId);
      await loadTasks();
    } catch (error) {
      console.error('Error skipping task:', error);
    }
  };

  const getTaskTypeIcon = (taskType: string) => adaptivePlanService.getTaskTypeIcon(taskType);
  const getTaskTypeLabel = (taskType: string) => adaptivePlanService.getTaskTypeLabel(taskType);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success text-white';
      case 'in_progress': return 'bg-primary text-white';
      case 'skipped': return 'bg-gray-400 text-white';
      default: return 'bg-gray-200 text-text-secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Tamamlandı';
      case 'in_progress': return 'Devam Ediyor';
      case 'skipped': return 'Atlandı';
      default: return 'Bekliyor';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-card-background p-6 rounded-2xl shadow-lg">
        <div className="text-center p-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-text-secondary">Öğrenme planı yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card-background p-6 rounded-2xl shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold font-poppins text-accent">🎯 Dinamik Öğrenme Planım</h2>
        <button
          onClick={handleGeneratePlan}
          disabled={isGenerating}
          className={`px-4 py-2 rounded-lg font-semibold text-sm ${
            isGenerating
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-primary text-white hover:bg-primary-dark'
          } transition-colors`}
        >
          {isGenerating ? 'Oluşturuluyor...' : '🤖 Yeni Plan Oluştur'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <p className="font-semibold">Hata:</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          <p className="font-semibold">Başarılı!</p>
          <p className="text-sm">{successMessage}</p>
        </div>
      )}

      {progress && (
        <div className="mb-6 grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-primary/10 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-primary">{progress.totalTasks}</div>
            <div className="text-xs text-text-secondary">Toplam Görev</div>
          </div>
          <div className="bg-success/10 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-success">{progress.completedTasks}</div>
            <div className="text-xs text-text-secondary">Tamamlanan</div>
          </div>
          <div className="bg-accent/10 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-accent">{progress.inProgressTasks}</div>
            <div className="text-xs text-text-secondary">Devam Eden</div>
          </div>
          <div className="bg-gray-200 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-text-primary">{progress.pendingTasks}</div>
            <div className="text-xs text-text-secondary">Bekleyen</div>
          </div>
          <div className="bg-gradient-to-r from-primary to-success p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-white">{progress.completionRate}%</div>
            <div className="text-xs text-white">Tamamlanma</div>
          </div>
        </div>
      )}

      <div className="flex space-x-2 mb-4 border-b border-border">
        <button
          onClick={() => setActiveTab('today')}
          className={`px-4 py-2 font-semibold ${
            activeTab === 'today'
              ? 'border-b-2 border-primary text-primary'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Bugün ({todayTasks.length})
        </button>
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-4 py-2 font-semibold ${
            activeTab === 'upcoming'
              ? 'border-b-2 border-primary text-primary'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Yaklaşan Görevler ({upcomingTasks.length})
        </button>
      </div>

      <div className="space-y-4">
        {activeTab === 'today' && todayTasks.length === 0 && !isGenerating && (
          <div className="text-center p-10 bg-white/50 rounded-xl border-2 border-dashed border-gray-300">
            <div className="text-6xl mb-4">🎯</div>
            <p className="text-lg font-semibold text-text-primary mb-2">Henüz bugün için görevin yok</p>
            <p className="text-sm text-text-secondary mb-4">AI destekli öğrenme planı oluşturarak başla</p>
            <button
              onClick={handleGeneratePlan}
              className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors"
            >
              İlk Planımı Oluştur
            </button>
          </div>
        )}

        {activeTab === 'upcoming' && upcomingTasks.length === 0 && !isGenerating && (
          <div className="text-center p-10 text-text-secondary">
            <p className="text-lg">📅 Yaklaşan görev yok</p>
            <p className="text-sm mt-2">Yeni bir plan oluştur ve öğrenmeye devam et</p>
          </div>
        )}

        {(activeTab === 'today' ? todayTasks : upcomingTasks).map((task, index) => (
          <div
            key={task.id}
            className="bg-white p-4 rounded-xl border border-border hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-2xl">{getTaskTypeIcon(task.taskType)}</span>
                  <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded">
                    Öncelik: {task.priority}
                  </span>
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${getStatusColor(task.status)}`}>
                    {getStatusLabel(task.status)}
                  </span>
                  {task.aiGenerated && (
                    <span className="text-xs bg-accent/10 text-accent px-2 py-1 rounded">🤖 AI</span>
                  )}
                </div>

                <h3 className="font-bold text-lg text-text-primary mb-1">
                  {task.module?.title || 'Görev'}
                </h3>

                <p className="text-sm text-text-secondary mb-2">
                  {getTaskTypeLabel(task.taskType)} • {adaptivePlanService.formatPlannedDate(task.plannedDate)}
                </p>

                {task.module?.description && (
                  <p className="text-xs text-text-secondary italic mb-2">
                    {task.module.description}
                  </p>
                )}

                {task.notes && (
                  <p className="text-xs text-text-secondary bg-gray-50 p-2 rounded mt-2">
                    💡 {task.notes}
                  </p>
                )}
              </div>

              <div className="flex flex-col space-y-2 ml-4">
                {task.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleStartTask(task.id)}
                      className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-dark"
                    >
                      Başla
                    </button>
                    <button
                      onClick={() => handleSkipTask(task.id)}
                      className="px-4 py-2 bg-gray-300 text-text-secondary rounded-lg text-sm hover:bg-gray-400"
                    >
                      Atla
                    </button>
                  </>
                )}

                {task.status === 'in_progress' && (
                  <button
                    onClick={() => handleCompleteTask(task)}
                    className="px-4 py-2 bg-success text-white rounded-lg text-sm font-semibold hover:bg-green-700"
                  >
                    Tamamla
                  </button>
                )}

                {task.status === 'completed' && task.performanceScore && (
                  <div className="text-center bg-success/10 p-2 rounded-lg">
                    <div className="text-lg font-bold text-success">
                      {Math.round(task.performanceScore * 100)}%
                    </div>
                    <div className="text-xs text-text-secondary">Performans</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdaptivePlanDashboard;
