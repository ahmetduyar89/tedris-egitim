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
    if (students.length > 0) {
      loadRiskAlerts();
    } else {
      setIsLoading(false);
    }
  }, [students]);

  const loadRiskAlerts = async () => {
    setIsLoading(true);
    try {
      const studentIds = students.map(s => s.id);

      // Bulk fetch weak modules (threshold 0.5)
      const bulkWeakModules = await knowledgeGraphService.getBulkWeakModules(studentIds, 0.5);

      // Bulk fetch mastery statistics
      const bulkStats = await masteryScoreService.getBulkMasteryStatistics(studentIds);

      const alerts: RiskAlert[] = [];

      students.forEach(student => {
        const weakModules = bulkWeakModules[student.id] || [];
        const highAttemptModules = weakModules.filter(m => m.attemptsCount >= 3);

        if (highAttemptModules.length > 0) {
          const stats = bulkStats[student.id] || { averageScore: 0, totalAttempts: 0 };

          alerts.push({
            student,
            weakModules: highAttemptModules,
            averageScore: stats.averageScore,
            totalAttempts: stats.totalAttempts,
          });
        }
      });

      setRiskAlerts(alerts.sort((a, b) => b.weakModules.length - a.weakModules.length));
    } catch (error) {
      console.error('Error loading risk alerts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-lg h-full min-h-[200px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-3 text-gray-500 font-medium">Risk analizi yapılıyor...</p>
        </div>
      </div>
    );
  }

  if (riskAlerts.length === 0) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-lg border-l-4 border-green-500 h-full flex flex-col justify-center">
        <h2 className="text-xl font-bold font-poppins text-green-600 mb-2 flex items-center">
          <span className="mr-2">✅</span> Risk Durumu
        </h2>
        <div className="text-center py-4">
          <p className="text-lg font-semibold text-gray-800">Harika! Hiçbir öğrencide risk tespit edilmedi.</p>
          <p className="text-sm text-gray-500 mt-1">Tüm öğrenciler beklenen performansın üzerinde.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border-l-4 border-red-500 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold font-poppins text-red-600 flex items-center">
          <span className="mr-2">⚠️</span> Risk Alarmları
        </h2>
        <div className="bg-red-50 px-3 py-1 rounded-lg border border-red-100">
          <span className="text-xl font-bold text-red-600">{riskAlerts.length}</span>
          <span className="text-xs text-red-400 ml-1 font-medium">Öğrenci</span>
        </div>
      </div>

      <div className="space-y-4 flex-1 overflow-y-auto pr-1 custom-scrollbar">
        {riskAlerts.map(alert => (
          <div
            key={alert.student.id}
            className="bg-red-50/50 border border-red-100 p-4 rounded-xl hover:shadow-md transition-all cursor-pointer group"
            onClick={() => onViewStudent(alert.student)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 group-hover:text-red-600 transition-colors">{alert.student.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {alert.student.grade === 4 ? 'İlkokul' : `${alert.student.grade}. Sınıf`} • Ort: %{Math.round(alert.averageScore * 100)}
                </p>
              </div>
              <div className="bg-red-100 text-red-700 px-2 py-1 rounded-md text-xs font-bold border border-red-200">
                {alert.weakModules.length} Kritik Konu
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-red-100/50 shadow-sm">
              <p className="text-[10px] uppercase tracking-wider font-bold text-red-500 mb-2">Müdahale Gerekenler</p>
              <div className="space-y-2">
                {alert.weakModules.slice(0, 3).map(module => (
                  <div key={module.id} className="flex justify-between items-center text-sm">
                    <div className="flex-1 truncate mr-2">
                      <span className="text-gray-700 font-medium text-xs">
                        {module.module?.title || 'Bilinmeyen Konu'}
                      </span>
                    </div>
                    <div className="flex items-center text-xs">
                      <span className="text-gray-400 mr-2">({module.attemptsCount} deneme)</span>
                      <span className="text-red-600 font-bold bg-red-50 px-1.5 rounded">
                        %{Math.round(module.masteryScore * 100)}
                      </span>
                    </div>
                  </div>
                ))}
                {alert.weakModules.length > 3 && (
                  <p className="text-xs text-gray-400 italic text-center pt-1 border-t border-gray-50 mt-1">
                    +{alert.weakModules.length - 3} konu daha
                  </p>
                )}
              </div>
            </div>

            <div className="mt-3 flex items-center justify-end">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewStudent(alert.student);
                }}
                className="text-xs bg-white text-red-600 border border-red-200 px-3 py-1.5 rounded-lg font-medium hover:bg-red-50 transition-colors shadow-sm"
              >
                Detayları İncele →
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 bg-yellow-50 p-3 rounded-lg border border-yellow-100 flex gap-2">
        <span className="text-lg">💡</span>
        <p className="text-xs text-yellow-800 leading-relaxed">
          <strong>Öneri:</strong> Bu öğrenciler 3+ denemeye rağmen %50 başarı altında kalmış. Birebir etüt planlayabilirsiniz.
        </p>
      </div>
    </div>
  );
};

export default RiskAlertsPanel;
