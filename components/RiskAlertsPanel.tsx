import React, { useState, useEffect } from 'react';
import { knowledgeGraphService, StudentMastery } from '../services/knowledgeGraphService';
import { masteryScoreService } from '../services/masteryScoreService';
import { Student } from '../types';

interface RiskAlert {
  student: Student;
  weakModules: StudentMastery[];
  averageScore: number;
  totalAttempts: number;
}

interface RiskAlertsPanelProps {
  students: Student[];
  onViewStudent: (student: Student) => void;
}

const RiskAlertsPanel: React.FC<RiskAlertsPanelProps> = ({ students, onViewStudent }) => {
  const [riskAlerts, setRiskAlerts] = useState<RiskAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRiskAlerts();
  }, [students]);

  const loadRiskAlerts = async () => {
    setIsLoading(true);
    try {
      const alerts: RiskAlert[] = [];

      for (const student of students) {
        const weakModules = await knowledgeGraphService.getWeakModules(student.id, 0.5);
        const highAttemptModules = weakModules.filter(m => m.attemptsCount >= 3);

        if (highAttemptModules.length > 0) {
          const stats = await masteryScoreService.getMasteryStatistics(student.id);

          alerts.push({
            student,
            weakModules: highAttemptModules,
            averageScore: stats.averageScore,
            totalAttempts: stats.totalAttempts,
          });
        }
      }

      setRiskAlerts(alerts.sort((a, b) => b.weakModules.length - a.weakModules.length));
    } catch (error) {
      console.error('Error loading risk alerts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-card-background p-6 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold font-poppins text-secondary mb-4">⚠️ Risk Alarmları</h2>
        <div className="text-center p-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary mx-auto"></div>
          <p className="mt-4 text-text-secondary">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (riskAlerts.length === 0) {
    return (
      <div className="bg-card-background p-6 rounded-2xl shadow-lg border-l-4 border-success">
        <h2 className="text-2xl font-bold font-poppins text-success mb-4">✅ Risk Alarmları</h2>
        <div className="text-center p-8">
          <p className="text-lg font-semibold text-text-primary">Harika! Hiçbir öğrencide risk tespit edilmedi.</p>
          <p className="text-sm text-text-secondary mt-2">Tüm öğrenciler iyi performans gösteriyor.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card-background p-6 rounded-2xl shadow-lg border-l-4 border-secondary">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold font-poppins text-secondary">⚠️ Risk Alarmları</h2>
        <div className="bg-secondary/10 px-4 py-2 rounded-lg">
          <span className="text-2xl font-bold text-secondary">{riskAlerts.length}</span>
          <span className="text-sm text-text-secondary ml-2">Risk</span>
        </div>
      </div>

      <div className="space-y-4">
        {riskAlerts.map(alert => (
          <div
            key={alert.student.id}
            className="bg-secondary/5 border border-secondary/20 p-4 rounded-xl hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onViewStudent(alert.student)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-bold text-lg text-text-primary">{alert.student.name}</h3>
                <p className="text-sm text-text-secondary">
                  {alert.student.grade === 4 ? 'İlkokul' : `${alert.student.grade}. Sınıf`} • Ortalama: {Math.round(alert.averageScore * 100)}%
                </p>
              </div>
              <div className="bg-secondary text-white px-3 py-1 rounded-full text-sm font-semibold">
                {alert.weakModules.length} Risk
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg">
              <p className="text-xs font-semibold text-secondary mb-2">🚨 Müdahale Gerekli Konular:</p>
              <div className="space-y-2">
                {alert.weakModules.slice(0, 3).map(module => (
                  <div key={module.id} className="flex justify-between items-center text-sm">
                    <div className="flex-1">
                      <span className="font-semibold text-text-primary">
                        {module.module?.title || 'Bilinmeyen'}
                      </span>
                      <span className="text-xs text-text-secondary ml-2">
                        ({module.attemptsCount} deneme)
                      </span>
                    </div>
                    <div className="text-secondary font-bold">
                      {Math.round(module.masteryScore * 100)}%
                    </div>
                  </div>
                ))}
                {alert.weakModules.length > 3 && (
                  <p className="text-xs text-text-secondary italic">
                    +{alert.weakModules.length - 3} konu daha
                  </p>
                )}
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-text-secondary">
                💡 3+ denemeden sonra hala düşük performans gösteriyor
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewStudent(alert.student);
                }}
                className="text-xs bg-secondary text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                Detay Gör →
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-accent/10 p-4 rounded-lg border border-accent/20">
        <p className="text-sm text-text-primary">
          <strong className="text-accent">💡 Öneriler:</strong> Bu öğrenciler için birebir ders veya ek çalışma materyali düşünebilirsiniz.
          Zayıf konuların ön koşul konularını kontrol edin.
        </p>
      </div>
    </div>
  );
};

export default RiskAlertsPanel;
