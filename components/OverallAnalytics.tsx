import React, { useMemo } from 'react';
import * as Recharts from 'recharts';
import { Test, Assignment, Flashcard, SpacedRepetitionSchedule, QuestionBankAssignment } from '../types';
import { PDFTestSubmission } from '../services/pdfTestService';
import { DiagnosisTestAssignment } from '../types/diagnosisTestTypes';

const { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, PieChart, Pie, Cell } = Recharts;

const COLORS = {
  primary: '#4F46E5',
  secondary: '#06B6D4',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  purple: '#8B5CF6',
  pink: '#EC4899',
  orange: '#F97316'
};

interface OverallAnalyticsProps {
  tests: Test[];
  assignments: Assignment[];
  flashcards: Flashcard[];
  spacedRepetitionSchedules: SpacedRepetitionSchedule[];
  questionBankAssignments?: QuestionBankAssignment[];
  pdfTestSubmissions?: PDFTestSubmission[];
  diagnosisTestAssignments?: DiagnosisTestAssignment[];
  studentName: string;
}

const OverallAnalytics: React.FC<OverallAnalyticsProps> = ({
  tests,
  assignments,
  flashcards,
  spacedRepetitionSchedules,
  questionBankAssignments = [],
  pdfTestSubmissions = [],
  diagnosisTestAssignments = [],
  studentName
}) => {
  const completedTests = useMemo(() => tests.filter(t => t.completed && t.analysis), [tests]);
  const completedAssignments = useMemo(() => assignments.filter(a => a.submission?.status === 'Değerlendirildi'), [assignments]);
  const completedQBTests = useMemo(() => questionBankAssignments.filter(qb => qb.status === 'Tamamlandı'), [questionBankAssignments]);
  const completedPDFTests = useMemo(() => pdfTestSubmissions.filter(pdf => pdf.status === 'completed' && pdf.scorePercentage !== undefined), [pdfTestSubmissions]);
  const completedDiagnosisTests = useMemo(() => diagnosisTestAssignments.filter(d => d.status === 'completed'), [diagnosisTestAssignments]);

  const overallStats = useMemo(() => {
    // Total counts should reflect ALL assigned items, not just completed ones
    const totalTests = tests.length;
    const totalAssignments = assignments.length;
    const totalFlashcards = flashcards.length;
    const totalQBTests = questionBankAssignments.length;
    const totalPDFTests = pdfTestSubmissions.length;
    const totalDiagnosisTests = diagnosisTestAssignments.length;

    const avgTestScore = completedTests.length > 0
      ? Math.round(completedTests.reduce((sum, t) => sum + (t.score || 0), 0) / completedTests.length)
      : 0;

    const avgAssignmentScore = completedAssignments.length > 0
      ? Math.round(completedAssignments.reduce((sum, a) => {
        const score = a.submission?.teacherScore ?? a.submission?.aiScore ?? 0;
        return sum + score;
      }, 0) / completedAssignments.length)
      : 0;

    const avgQBTestScore = completedQBTests.length > 0
      ? Math.round(completedQBTests.reduce((sum, qb) => sum + (qb.score || 0), 0) / completedQBTests.length)
      : 0;

    const avgPDFTestScore = completedPDFTests.length > 0
      ? Math.round(completedPDFTests.reduce((sum, pdf) => sum + (pdf.scorePercentage || 0), 0) / completedPDFTests.length)
      : 0;

    const avgDiagnosisTestScore = completedDiagnosisTests.length > 0
      ? Math.round(completedDiagnosisTests.reduce((sum, d) => sum + (d.score || 0), 0) / completedDiagnosisTests.length)
      : 0;

    const masteredFlashcards = spacedRepetitionSchedules.filter(s => s.intervalDays >= 30).length;
    const flashcardMasteryRate = totalFlashcards > 0
      ? Math.round((masteredFlashcards / totalFlashcards) * 100)
      : 0;

    return {
      totalTests,
      totalAssignments,
      totalFlashcards,
      totalQBTests,
      totalPDFTests,
      totalDiagnosisTests,
      avgTestScore,
      avgAssignmentScore,
      avgQBTestScore,
      avgPDFTestScore,
      avgDiagnosisTestScore,
      flashcardMasteryRate,
      totalActivities: totalTests + totalAssignments + totalFlashcards + totalQBTests + totalPDFTests + totalDiagnosisTests,
      // Add completion counts for UI display if needed
      completedTestsCount: completedTests.length,
      completedAssignmentsCount: completedAssignments.length,
      completedQBTestsCount: completedQBTests.length,
      completedPDFTestsCount: completedPDFTests.length,
      completedDiagnosisTestsCount: completedDiagnosisTests.length
    };
  }, [tests, assignments, flashcards, spacedRepetitionSchedules, questionBankAssignments, pdfTestSubmissions, diagnosisTestAssignments, completedTests, completedAssignments, completedQBTests, completedPDFTests, completedDiagnosisTests]);

  const progressOverTime = useMemo(() => {
    const allActivities = [
      ...completedTests.map(t => ({
        date: new Date(t.submissionDate || ''),
        score: t.score || 0,
        type: 'Test'
      })),
      ...completedQBTests.map(qb => ({
        date: new Date(qb.completedAt || ''),
        score: qb.score || 0,
        type: 'Soru Bankası'
      })),
      ...completedPDFTests.map(pdf => ({
        date: new Date(pdf.submittedAt || ''),
        score: pdf.scorePercentage || 0,
        type: 'PDF Test'
      })),
      ...completedAssignments.map(a => ({
        date: new Date(a.submission?.submittedAt || ''),
        score: a.submission?.teacherScore ?? a.submission?.aiScore ?? 0,
        type: 'Ödev'
      })),
      ...completedDiagnosisTests.map(d => ({
        date: new Date(d.completedAt || ''),
        score: d.score || 0,
        type: 'Tanı Testi'
      }))
    ].sort((a, b) => a.date.getTime() - b.date.getTime());

    return allActivities.slice(-20).map(activity => ({
      date: activity.date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' }),
      puan: activity.score,
      tip: activity.type
    }));
  }, [completedTests, completedAssignments, completedQBTests, completedPDFTests, completedDiagnosisTests]);

  const subjectPerformance = useMemo(() => {
    const subjectMap = new Map<string, { total: number; sum: number }>();

    completedTests.forEach(test => {
      const subject = test.subject;
      if (!subject) return;
      if (!subjectMap.has(subject)) {
        subjectMap.set(subject, { total: 0, sum: 0 });
      }
      const data = subjectMap.get(subject)!;
      data.total += 1;
      data.sum += test.score || 0;
    });

    completedAssignments.forEach(assignment => {
      const subject = assignment.subject;
      if (!subject) return;
      if (!subjectMap.has(subject)) {
        subjectMap.set(subject, { total: 0, sum: 0 });
      }
      const data = subjectMap.get(subject)!;
      data.total += 1;
      data.sum += assignment.submission?.teacherScore ?? assignment.submission?.aiScore ?? 0;
    });

    completedQBTests.forEach(qbTest => {
      if (qbTest.questionBank?.subject) {
        const subject = qbTest.questionBank.subject;
        if (!subjectMap.has(subject)) {
          subjectMap.set(subject, { total: 0, sum: 0 });
        }
        const data = subjectMap.get(subject)!;
        data.total += 1;
        data.sum += qbTest.score || 0;
      }
    });

    completedPDFTests.forEach(pdfTest => {
      if (pdfTest.pdfTest?.subject) {
        const subject = pdfTest.pdfTest.subject;
        if (!subjectMap.has(subject)) {
          subjectMap.set(subject, { total: 0, sum: 0 });
        }
        const data = subjectMap.get(subject)!;
        data.total += 1;
        data.sum += pdfTest.scorePercentage || 0;
      }
    });

    completedDiagnosisTests.forEach(dTest => {
      if (dTest.test?.subject) {
        const subject = dTest.test.subject;
        if (!subjectMap.has(subject)) {
          subjectMap.set(subject, { total: 0, sum: 0 });
        }
        const data = subjectMap.get(subject)!;
        data.total += 1;
        data.sum += dTest.score || 0;
      }
    });

    return Array.from(subjectMap.entries()).map(([subject, data]) => ({
      subject,
      ortalama: Math.round(data.sum / data.total),
      aktivite: data.total
    }));
  }, [completedTests, completedAssignments, completedQBTests, completedPDFTests, completedDiagnosisTests]);

  const weakTopicsAggregated = useMemo(() => {
    const topicMap = new Map<string, number>();
    const invalidTopicPatterns = [
      /tespit edilememiştir/i,
      /bulunamadı/i,
      /yok/i,
      /bu sınavda/i,
      /henüz/i,
      /N\/A/i
    ];

    const isValidTopic = (topic: string) => {
      if (!topic || typeof topic !== 'string' || topic.trim().length < 3) return false;
      return !invalidTopicPatterns.some(pattern => pattern.test(topic));
    };

    completedTests.forEach(test => {
      test.analysis?.analysis?.weakTopics?.forEach(topic => {
        if (isValidTopic(topic)) {
          topicMap.set(topic, (topicMap.get(topic) || 0) + 1);
        }
      });
    });

    completedAssignments.forEach(assignment => {
      assignment.submission?.aiAnalysis?.weakTopics?.forEach(topic => {
        if (isValidTopic(topic)) {
          topicMap.set(topic, (topicMap.get(topic) || 0) + 1);
        }
      });
    });

    completedQBTests.forEach(qbTest => {
      if (qbTest.aiFeedback?.weaknesses) {
        qbTest.aiFeedback.weaknesses.forEach(topic => {
          if (isValidTopic(topic)) {
            topicMap.set(topic, (topicMap.get(topic) || 0) + 1);
          }
        });
      }
    });

    completedDiagnosisTests.forEach(dTest => {
      // Handle array of objects { moduleName: string, ... }
      if (dTest.aiAnalysis?.weakAreas) {
        dTest.aiAnalysis.weakAreas.forEach((area: any) => {
          const topic = typeof area === 'string' ? area : (area.moduleName || area.name);
          if (isValidTopic(topic)) {
            topicMap.set(topic, (topicMap.get(topic) || 0) + 1);
          }
        });
      }
    });

    return Array.from(topicMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic, count]) => ({ topic, count }));
  }, [completedTests, completedAssignments, completedQBTests, completedDiagnosisTests]);

  const strongTopicsAggregated = useMemo(() => {
    const topicMap = new Map<string, number>();
    const invalidTopicPatterns = [
      /tespit edilememiştir/i,
      /bulunamadı/i,
      /yok/i,
      /bu sınavda/i,
      /henüz/i,
      /N\/A/i
    ];

    const isValidTopic = (topic: string) => {
      if (!topic || typeof topic !== 'string' || topic.trim().length < 3) return false;
      return !invalidTopicPatterns.some(pattern => pattern.test(topic));
    };

    completedTests.forEach(test => {
      test.analysis?.analysis?.strongTopics?.forEach(topic => {
        if (isValidTopic(topic)) {
          topicMap.set(topic, (topicMap.get(topic) || 0) + 1);
        }
      });
    });

    completedAssignments.forEach(assignment => {
      assignment.submission?.aiAnalysis?.strongTopics?.forEach(topic => {
        if (isValidTopic(topic)) {
          topicMap.set(topic, (topicMap.get(topic) || 0) + 1);
        }
      });
    });

    completedQBTests.forEach(qbTest => {
      if (qbTest.aiFeedback?.strengths) {
        qbTest.aiFeedback.strengths.forEach(topic => {
          if (isValidTopic(topic)) {
            topicMap.set(topic, (topicMap.get(topic) || 0) + 1);
          }
        });
      }
    });

    completedDiagnosisTests.forEach(dTest => {
      // Handle array of objects { moduleName: string, ... }
      if (dTest.aiAnalysis?.strongAreas) {
        dTest.aiAnalysis.strongAreas.forEach((area: any) => {
          const topic = typeof area === 'string' ? area : (area.moduleName || area.name);
          if (isValidTopic(topic)) {
            topicMap.set(topic, (topicMap.get(topic) || 0) + 1);
          }
        });
      }
    });

    return Array.from(topicMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic, count]) => ({ topic, count }));
  }, [completedTests, completedAssignments, completedQBTests, completedDiagnosisTests]);

  const activityDistribution = useMemo(() => {
    return [
      { name: 'Tanı Testleri', value: overallStats.totalDiagnosisTests, color: COLORS.orange },
      { name: 'Testler', value: overallStats.totalTests, color: COLORS.primary },
      { name: 'Ödevler', value: overallStats.totalAssignments, color: COLORS.secondary },
      { name: 'Soru Bankası', value: overallStats.totalQBTests, color: COLORS.purple },
      { name: 'PDF Testler', value: overallStats.totalPDFTests, color: COLORS.warning },
      { name: 'Flashcardlar', value: overallStats.totalFlashcards, color: COLORS.pink }
    ].filter(item => item.value > 0);
  }, [overallStats]);

  const performanceLevel = useMemo(() => {
    const totalScores = [
      overallStats.avgTestScore,
      overallStats.avgAssignmentScore,
      overallStats.avgQBTestScore,
      overallStats.avgPDFTestScore,
      overallStats.avgDiagnosisTestScore
    ].filter(score => score > 0);
    const avg = totalScores.length > 0
      ? totalScores.reduce((sum, score) => sum + score, 0) / totalScores.length
      : 0;
    if (avg >= 85) return { label: 'Mükemmel', color: 'text-green-600', bg: 'bg-green-100' };
    if (avg >= 70) return { label: 'İyi', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (avg >= 50) return { label: 'Gelişmekte', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { label: 'Destek Gerekli', color: 'text-red-600', bg: 'bg-red-100' };
  }, [overallStats]);

  // Calculate weighted average for realistic data
  const weightedAverage = useMemo(() => {
    let totalScore = 0;
    let totalCount = 0;

    // Tests
    if (completedTests.length > 0) {
      totalScore += completedTests.reduce((sum, t) => sum + (t.score || 0), 0);
      totalCount += completedTests.length;
    }

    // Assignments
    if (completedAssignments.length > 0) {
      totalScore += completedAssignments.reduce((sum, a) => sum + (a.submission?.teacherScore ?? a.submission?.aiScore ?? 0), 0);
      totalCount += completedAssignments.length;
    }

    // QB Tests
    if (completedQBTests.length > 0) {
      totalScore += completedQBTests.reduce((sum, qb) => sum + (qb.score || 0), 0);
      totalCount += completedQBTests.length;
    }

    // PDF Tests
    if (completedPDFTests.length > 0) {
      totalScore += completedPDFTests.reduce((sum, pdf) => sum + (pdf.scorePercentage || 0), 0);
      totalCount += completedPDFTests.length;
    }

    // Diagnosis Tests
    if (completedDiagnosisTests.length > 0) {
      totalScore += completedDiagnosisTests.reduce((sum, d) => sum + (d.score || 0), 0);
      totalCount += completedDiagnosisTests.length;
    }

    return totalCount > 0 ? Math.round(totalScore / totalCount) : 0;
  }, [completedTests, completedAssignments, completedQBTests, completedPDFTests, completedDiagnosisTests]);

  if (completedTests.length === 0 && completedAssignments.length === 0 && completedDiagnosisTests.length === 0 && completedPDFTests.length === 0 && completedQBTests.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="text-4xl mb-3">📊</div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Henüz Analiz Verisi Yok</h3>
        <p className="text-sm text-gray-500">
          {studentName} için tamamlanmış aktivite bulunmuyor.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Section - Minimal & Modern */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-600"></div>
        <div className="flex items-center gap-3 z-10">
          <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
            <span className="text-xl">📊</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800">Genel Performans</h2>
            <p className="text-xs text-gray-500 font-medium">{studentName} • {overallStats.totalActivities} Aktivite</p>
          </div>
        </div>

        <div className="flex items-center gap-6 z-10">
          <div className="flex flex-col items-end">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-gray-900">%{weightedAverage}</span>
              <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Başarı</span>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-bold ${performanceLevel.bg} ${performanceLevel.color}`}>
            {performanceLevel.label}
          </div>
        </div>
      </div>

      {/* Stats Grid - Cleaner Look */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: 'Tanı Testleri', count: overallStats.totalDiagnosisTests, avg: overallStats.avgDiagnosisTestScore, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Testler', count: overallStats.totalTests, avg: overallStats.avgTestScore, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Ödevler', count: overallStats.totalAssignments, avg: overallStats.avgAssignmentScore, color: 'text-cyan-600', bg: 'bg-cyan-50' },
          { label: 'Soru Bankası', count: overallStats.totalQBTests, avg: overallStats.avgQBTestScore, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'PDF Testler', count: overallStats.totalPDFTests, avg: overallStats.avgPDFTestScore, color: 'text-yellow-600', bg: 'bg-yellow-50' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 flex flex-col justify-between hover:border-gray-200 transition-colors">
            <div className="text-xs text-gray-500 font-medium mb-1">{stat.label}</div>
            <div className="flex items-end justify-between">
              <div className={`text-xl font-bold ${stat.color}`}>{stat.count}</div>
              <div className="text-xs text-gray-400 font-medium">Ort: %{stat.avg}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Progress Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            İlerleme Grafiği
          </h3>
          {progressOverTime.length > 0 ? (
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={progressOverTime}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} dx={-10} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontSize: '12px' }}
                  />
                  <Line type="monotone" dataKey="puan" stroke={COLORS.primary} strokeWidth={2.5} dot={{ r: 3, fill: COLORS.primary }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-400 text-xs">Yeterli veri yok</div>
          )}
        </div>

        {/* Subject Performance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
            Ders Bazlı Performans
          </h3>
          {subjectPerformance.length > 0 ? (
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectPerformance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f3f4f6" />
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis dataKey="subject" type="category" width={100} tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="ortalama" fill={COLORS.secondary} radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-400 text-xs">Yeterli veri yok</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Weak Topics */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span className="text-red-500">⚠️</span>
            Gelişim Alanları
          </h3>
          {weakTopicsAggregated.length > 0 ? (
            <div className="space-y-2">
              {weakTopicsAggregated.slice(0, 3).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-red-50/50 border border-red-100">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="text-xs font-bold text-red-400 w-4">{idx + 1}.</span>
                    <span className="text-xs font-medium text-gray-700 truncate">{item.topic}</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 bg-white rounded border border-red-100 text-red-500 font-medium whitespace-nowrap">
                    {item.count} tekrar
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 text-center py-4">Tespit edilen eksik konu yok</p>
          )}
        </div>

        {/* Strong Topics */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span className="text-green-500">💪</span>
            Güçlü Yönler
          </h3>
          {strongTopicsAggregated.length > 0 ? (
            <div className="space-y-2">
              {strongTopicsAggregated.slice(0, 3).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-green-50/50 border border-green-100">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="text-xs font-bold text-green-500">✓</span>
                    <span className="text-xs font-medium text-gray-700 truncate">{item.topic}</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 bg-white rounded border border-green-100 text-green-600 font-medium whitespace-nowrap">
                    {item.count} aktivite
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 text-center py-4">Veri bekleniyor</p>
          )}
        </div>
      </div>

      {/* Suggestions - Compact */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-4">
        <h3 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
          <span className="text-blue-500">💡</span>
          AI Önerileri
        </h3>
        <ul className="space-y-2">
          {overallStats.avgDiagnosisTestScore < 60 && overallStats.totalDiagnosisTests > 0 && (
            <li className="flex items-start gap-2 text-xs text-blue-800">
              <span className="mt-0.5 text-orange-500">●</span>
              Tanı testlerinde temel eksikler var (%{overallStats.avgDiagnosisTestScore}). Yeni bir çalışma planı oluştur.
            </li>
          )}
          {weightedAverage < 70 && weightedAverage > 0 && (
            <li className="flex items-start gap-2 text-xs text-blue-800">
              <span className="mt-0.5 text-orange-500">●</span>
              Genel ortalama hedefin altında (%{weightedAverage}). Konu tekrarlarına ağırlık verilmeli.
            </li>
          )}
          {weakTopicsAggregated.length > 0 && (
            <li className="flex items-start gap-2 text-xs text-blue-800">
              <span className="mt-0.5 text-red-500">●</span>
              <strong>{weakTopicsAggregated[0].topic}</strong> konusunda yoğunlaşmalısın.
            </li>
          )}
          {strongTopicsAggregated.length > 0 && (
            <li className="flex items-start gap-2 text-xs text-blue-800">
              <span className="mt-0.5 text-green-500">●</span>
              <strong>{strongTopicsAggregated[0].topic}</strong> konusundaki başarını korumaya devam et.
            </li>
          )}
          {overallStats.totalActivities < 5 && (
            <li className="flex items-start gap-2 text-xs text-blue-800 opacity-75">
              <span className="mt-0.5">ℹ</span>
              Daha sağlıklı analiz için daha fazla test çözmelisin.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default OverallAnalytics;

