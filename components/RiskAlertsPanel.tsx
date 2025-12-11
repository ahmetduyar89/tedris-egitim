import React, { useState, useEffect } from 'react';
import { supabase } from '../services/dbAdapter';
import { Student } from '../types';

interface RiskAlert {
  student: Student;
  averageScore: number;
  testCount: number;
  weakTopics: string[];
  riskLevel: 'high' | 'medium' | 'low';
}

interface RiskAlertsPanelProps {
  students: Student[];
  onViewStudent: (student: Student) => void;
}

const RiskAlertsPanel: React.FC<RiskAlertsPanelProps> = ({ students, onViewStudent }) => {
  const [riskAlerts, setRiskAlerts] = useState<RiskAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [systemAverage, setSystemAverage] = useState(0);

  useEffect(() => {
    if (students.length > 0) {
      loadComprehensiveRiskAnalysis();
    } else {
      setIsLoading(false);
    }
  }, [students]);

  const loadComprehensiveRiskAnalysis = async () => {
    setIsLoading(true);
    try {
      const studentIds = students.filter(s => s && s.id).map(s => s.id);

      // 1. Fetch Diagnosis Assignments (AI Tests)
      const { data: aiTests, error: aiError } = await supabase
        .from('diagnosis_test_assignments')
        .select('student_id, score, status, ai_analysis')
        .in('student_id', studentIds)
        .eq('status', 'completed');

      if (aiError) console.error('AI Tests fetch error:', aiError);

      // 2. Fetch PDF Submissions
      const { data: pdfTests, error: pdfError } = await supabase
        .from('pdf_test_submissions')
        .select('student_id, score_percentage')
        .in('student_id', studentIds)
        .eq('status', 'completed');

      if (pdfError) console.warn('PDF Tests fetch error:', pdfError);

      // 3. Fetch Question Bank Assignments
      const { data: qbTests, error: qbError } = await supabase
        .from('question_bank_assignments')
        .select('student_id, score, status, ai_feedback')
        .in('student_id', studentIds)
        .eq('status', 'Tamamlandı');

      if (qbError) console.warn('Question Bank Tests fetch error:', qbError);

      // 4. Aggregate Data
      const studentStats = new Map<string, { totalScore: number; count: number; weakTopics: Set<string> }>();

      const processTest = (studentId: string, score: number, weakTopics: string[] = []) => {
        const stats = studentStats.get(studentId) || { totalScore: 0, count: 0, weakTopics: new Set() };
        stats.totalScore += score;
        stats.count += 1;
        weakTopics.forEach(t => stats.weakTopics.add(t));
        studentStats.set(studentId, stats);
      };

      // Process AI Tests
      (aiTests || []).forEach((test: any) => {
        let topics: string[] = [];
        if (test.ai_analysis) {
          if (Array.isArray(test.ai_analysis.weakTopics)) topics = test.ai_analysis.weakTopics;
          else if (Array.isArray(test.ai_analysis.weaknesses)) topics = test.ai_analysis.weaknesses;
        }
        processTest(test.student_id, test.score || 0, topics.slice(0, 2));
      });

      // Process PDF Tests
      (pdfTests || []).forEach((test: any) => {
        processTest(test.student_id, test.score_percentage || 0);
      });

      // Process Question Bank Tests
      (qbTests || []).forEach((test: any) => {
        let topics: string[] = [];
        if (test.ai_feedback && Array.isArray(test.ai_feedback.weaknesses)) {
          topics = test.ai_feedback.weaknesses;
        }
        processTest(test.student_id, test.score || 0, topics.slice(0, 2));
      });

      // 5. Create Alerts
      const alerts: RiskAlert[] = [];
      let totalSystemScore = 0;
      let totalSystemCount = 0;

      students.forEach(student => {
        const stats = studentStats.get(student.id);
        if (stats && stats.count > 0) {
          const avg = Math.round(stats.totalScore / stats.count);
          totalSystemScore += avg;
          totalSystemCount++;

          let riskLevel: 'high' | 'medium' | 'low' = 'low';
          if (avg < 50) riskLevel = 'high';
          else if (avg < 70) riskLevel = 'medium';

          alerts.push({
            student,
            averageScore: avg,
            testCount: stats.count,
            weakTopics: Array.from(stats.weakTopics).slice(0, 2),
            riskLevel
          });
        }
      });

      if (totalSystemCount > 0) {
        setSystemAverage(Math.round(totalSystemScore / totalSystemCount));
      }

      setRiskAlerts(alerts.sort((a, b) => {
        if (a.riskLevel === 'high' && b.riskLevel !== 'high') return -1;
        if (b.riskLevel === 'high' && a.riskLevel !== 'high') return 1;
        return a.averageScore - b.averageScore;
      }));

    } catch (error) {
      console.error('Error in risk analysis:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col max-h-[400px] min-h-[200px]">
      {/* Minimal Header */}
      {/* Minimal Header */}
      <div className="px-4 py-3 border-b border-gray-50 flex justify-between items-center bg-gradient-to-r from-red-500 to-rose-600 text-white">
        <h3 className="text-sm font-bold font-poppins flex items-center gap-2">
          <span className="text-base bg-white/20 p-1 rounded-md">⚠️</span>
          Risk Analizi
        </h3>
        <span className="text-[9px] font-bold px-2 py-0.5 bg-white/20 text-white rounded-full border border-white/10">
          G. Ort: %{systemAverage}
        </span>
      </div>

      {/* Compact List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
        {riskAlerts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-gray-400">Henüz saptanmış bir risk yok.</p>
          </div>
        ) : (
          riskAlerts.map(alert => (
            <div
              key={alert.student.id}
              onClick={() => onViewStudent(alert.student)}
              className={`group flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer hover:shadow-sm ${alert.riskLevel === 'high' ? 'border-red-100 bg-red-50/30' :
                alert.riskLevel === 'medium' ? 'border-yellow-100 bg-yellow-50/30' :
                  'border-gray-100 hover:bg-gray-50'
                }`}
            >
              {/* Left: Score & Name */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className={`
                  flex items-center justify-center w-9 h-9 rounded-full text-xs font-bold border-2 shrink-0
                  ${alert.riskLevel === 'high' ? 'border-red-200 text-red-700 bg-red-50' :
                    alert.riskLevel === 'medium' ? 'border-yellow-200 text-yellow-700 bg-yellow-50' :
                      'border-green-200 text-green-700 bg-green-50'}
                `}>
                  %{alert.averageScore}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-gray-800 truncate">{alert.student.name}</h4>
                    {alert.riskLevel === 'high' && (
                      <span className="text-[9px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded uppercase tracking-wide shrink-0">Acil</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 truncate flex items-center gap-1">
                    {alert.weakTopics.length > 0 ? (
                      <>
                        <span className="text-red-400 font-medium whitespace-nowrap">Eksik:</span>
                        <span className="truncate">{alert.weakTopics.join(', ')}</span>
                      </>
                    ) : (
                      <span className="text-gray-400">{alert.testCount} test tamamlandı</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Action */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity pl-2">
                <button className="p-1.5 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-lg">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Info */}
      <div className="p-2 border-t border-gray-50 bg-gray-50/30 text-[10px] text-gray-400 text-center">
        Tüm sınavlar otomatik analiz edilmiştir.
      </div>
    </div>
  );
};

export default RiskAlertsPanel;
