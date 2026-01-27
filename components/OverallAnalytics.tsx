import React, { useMemo } from 'react';
import * as Recharts from 'recharts';
import { Test, Assignment, Flashcard, SpacedRepetitionSchedule, QuestionBankAssignment } from '../types';
import { PDFTestSubmission } from '../services/pdfTestService';
import { DiagnosisTestAssignment } from '../types/diagnosisTestTypes';

const { ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Cell, LabelList } = Recharts;

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

    const updateMap = (subject: string | undefined, score: number) => {
      if (!subject) return;
      if (!subjectMap.has(subject)) {
        subjectMap.set(subject, { total: 0, sum: 0 });
      }
      const data = subjectMap.get(subject)!;
      data.total += 1;
      data.sum += score;
    };

    completedTests.forEach(test => updateMap(test.subject, test.score || 0));
    completedAssignments.forEach(assignment => updateMap(assignment.subject, assignment.submission?.teacherScore ?? assignment.submission?.aiScore ?? 0));
    completedQBTests.forEach(qb => updateMap(qb.questionBank?.subject, qb.score || 0));
    completedPDFTests.forEach(pdf => updateMap(pdf.pdfTest?.subject, pdf.scorePercentage || 0));
    completedDiagnosisTests.forEach(d => updateMap(d.test?.subject, d.score || 0));

    return Array.from(subjectMap.entries())
      .map(([subject, data]) => ({
        subject,
        ortalama: Math.round(data.sum / data.total),
        aktivite: data.total
      }))
      .sort((a, b) => b.ortalama - a.ortalama) // Sort by performance
      .slice(0, 7); // Limit to top 7
  }, [completedTests, completedAssignments, completedQBTests, completedPDFTests, completedDiagnosisTests]);

  const normalizeTopic = (topic: string) => {
    return topic.trim().replace(/['"]/g, '').replace(/\.$/, '');
  };

  const getTopicCounts = useMemo(() => {
    const weakMap = new Map<string, number>();
    const strongMap = new Map<string, number>();
    const invalidTopicPatterns = [/tespit edilememiştir/i, /bulunamadı/i, /yok/i, /bu sınavda/i, /henüz/i, /N\/A/i, /belirtilmemiş/i];

    const isValidTopic = (topic: string) =>
      topic && typeof topic === 'string' && topic.trim().length >= 3 && !invalidTopicPatterns.some(p => p.test(topic));

    const processTopics = (topics: string[] | undefined, map: Map<string, number>) => {
      if (!topics || !Array.isArray(topics)) return;
      topics.forEach(t => {
        if (isValidTopic(t)) {
          const normalized = normalizeTopic(t);
          map.set(normalized, (map.get(normalized) || 0) + 1);
        }
      });
    };

    completedTests.forEach(t => {
      processTopics(t.analysis?.analysis?.weakTopics, weakMap);
      processTopics(t.analysis?.analysis?.strongTopics, strongMap);
    });

    completedAssignments.forEach(a => {
      processTopics(a.submission?.aiAnalysis?.weakTopics, weakMap);
      processTopics(a.submission?.aiAnalysis?.strongTopics, strongMap);
    });

    completedQBTests.forEach(q => {
      processTopics(q.aiFeedback?.weaknesses, weakMap);
      processTopics(q.aiFeedback?.strengths, strongMap);
    });

    completedDiagnosisTests.forEach(d => {
      if (d.aiAnalysis?.weakAreas) {
        const topics = d.aiAnalysis.weakAreas.map((area: any) => typeof area === 'string' ? area : (area.moduleName || area.name));
        processTopics(topics, weakMap);
      }
      if (d.aiAnalysis?.strongAreas) {
        const topics = d.aiAnalysis.strongAreas.map((area: any) => typeof area === 'string' ? area : (area.moduleName || area.name));
        processTopics(topics, strongMap);
      }
    });

    const getSorted = (map: Map<string, number>) =>
      Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([topic, count]) => ({ topic, count }));

    return { weak: getSorted(weakMap), strong: getSorted(strongMap) };
  }, [completedTests, completedAssignments, completedQBTests, completedDiagnosisTests]);

  const weakTopicsAggregated = getTopicCounts.weak;
  const strongTopicsAggregated = getTopicCounts.strong;

  const weightedAverage = useMemo(() => {
    let totalScore = 0;
    let totalCount = 0;
    const addScores = (items: any[], getScore: (i: any) => number) => {
      totalScore += items.reduce((sum, item) => sum + getScore(item), 0);
      totalCount += items.length;
    };

    addScores(completedTests, t => t.score || 0);
    addScores(completedAssignments, a => a.submission?.teacherScore ?? a.submission?.aiScore ?? 0);
    addScores(completedQBTests, qb => qb.score || 0);
    addScores(completedPDFTests, pdf => pdf.scorePercentage || 0);
    addScores(completedDiagnosisTests, d => d.score || 0);

    return totalCount > 0 ? Math.round(totalScore / totalCount) : 0;
  }, [completedTests, completedAssignments, completedQBTests, completedPDFTests, completedDiagnosisTests]);

  const performanceLevel = useMemo(() => {
    if (weightedAverage >= 85) return { label: 'Mükemmel', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' };
    if (weightedAverage >= 70) return { label: 'İyi', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' };
    if (weightedAverage >= 50) return { label: 'Gelişmekte', color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200' };
    return { label: 'Destek Gerekli', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' };
  }, [weightedAverage]);

  // Synthesize AI Recommendations
  const aiRecommendations = useMemo(() => {
    const recs: { type: 'warning' | 'success' | 'info' | 'critical', text: string }[] = [];

    // 1. Critical Performance Check
    if (weightedAverage < 50 && overallStats.totalActivities > 2) {
      recs.push({
        type: 'critical',
        text: `Genel başarı oranın kritik seviyede (%${weightedAverage}). Temel konulara geri dönüp "Sıfırdan Tekrar" programı uygulamalısın.`
      });
    }

    // 2. Specific Weakness Focus
    if (weakTopicsAggregated.length > 0) {
      const topWeakness = weakTopicsAggregated[0].topic;
      const count = weakTopicsAggregated[0].count;
      recs.push({
        type: 'warning',
        text: `"${topWeakness}" konusunda ${count} farklı aktivitede eksiklik tespit edildi. Bu konuya özel bir çalışma planı oluşturuldu.`
      });
    }

    // 3. Diagnosis Test Insight
    if (overallStats.totalDiagnosisTests > 0 && overallStats.avgDiagnosisTestScore < 60) {
      recs.push({
        type: 'info',
        text: 'Tanı testleri sonuçlarına göre akademik altyapıda eksikler var. Konu anlatımlı videolara ağırlık vermelisin.'
      });
    }

    // 4. Strength Reinforcement
    if (strongTopicsAggregated.length > 0) {
      const topStrength = strongTopicsAggregated[0].topic;
      recs.push({
        type: 'success',
        text: `"${topStrength}" konusunda çok iyisin! Zorluk seviyesini artırarak bu başarını perçinleyebilirsin.`
      });
    }

    // 5. Activity Balance
    if (overallStats.totalTests > 0 && overallStats.totalAssignments === 0) {
      recs.push({
        type: 'info',
        text: 'Sadece test çözmek yeterli olmayabilir. Öğretmeninin verdiği ödevleri de tamamlamalısın.'
      });
    }

    // 6. Consistency
    if (overallStats.totalActivities > 10 && weightedAverage > 70) {
      recs.push({
        type: 'success',
        text: 'İstikrarlı bir ilerleme kaydediyorsun. Bu tempoyu koru!'
      });
    }

    // Fallback if empty
    if (recs.length === 0) {
      if (overallStats.totalActivities === 0) {
        recs.push({ type: 'info', text: 'Analiz yapabilmem için test veya ödev tamamlamalısın.' });
      } else {
        recs.push({ type: 'info', text: 'Mevcut performansın dengeli görünüyor. Çalışmaya devam et' });
      }
    }

    return recs.slice(0, 4); // Limit to top 4 recommendations
  }, [weightedAverage, overallStats, weakTopicsAggregated, strongTopicsAggregated]);

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

  const GRID_STATS = [
    { label: 'Tanı Testleri', count: overallStats.totalDiagnosisTests, avg: overallStats.avgDiagnosisTestScore, bgInfo: 'bg-orange-50 border-orange-100', textColors: { label: 'text-orange-900', value: 'text-orange-700', sub: 'text-orange-600/80' }, icon: '📋' },
    { label: 'Testler', count: overallStats.totalTests, avg: overallStats.avgTestScore, bgInfo: 'bg-indigo-50 border-indigo-100', textColors: { label: 'text-indigo-900', value: 'text-indigo-700', sub: 'text-indigo-600/80' }, icon: '📝' },
    { label: 'Ödevler', count: overallStats.totalAssignments, avg: overallStats.avgAssignmentScore, bgInfo: 'bg-cyan-50 border-cyan-100', textColors: { label: 'text-cyan-900', value: 'text-cyan-700', sub: 'text-cyan-600/80' }, icon: '📚' },
    { label: 'Soru Bankası', count: overallStats.totalQBTests, avg: overallStats.avgQBTestScore, bgInfo: 'bg-purple-50 border-purple-100', textColors: { label: 'text-purple-900', value: 'text-purple-700', sub: 'text-purple-600/80' }, icon: '🧩' },
    { label: 'PDF Testler', count: overallStats.totalPDFTests, avg: overallStats.avgPDFTestScore, bgInfo: 'bg-rose-50 border-rose-100', textColors: { label: 'text-rose-900', value: 'text-rose-700', sub: 'text-rose-600/80' }, icon: '📄' },
  ];

  const SUBJECT_COLORS = [COLORS.primary, COLORS.secondary, COLORS.purple, COLORS.pink, COLORS.orange, COLORS.success, COLORS.warning];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-indigo-500 via-purple-500 to-pink-500"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-gray-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

        <div className="flex items-center gap-4 z-10">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center text-2xl shadow-inner text-indigo-600">
            📊
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Genel Performans</h2>
            <p className="text-sm text-gray-500 font-medium flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
              {studentName}
              <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
              {overallStats.totalActivities} Aktivite
            </p>
          </div>
        </div>

        <div className="flex items-center gap-8 z-10 md:pr-4">
          <div className="flex flex-col items-end">
            <span className="text-sm text-gray-400 font-medium uppercase tracking-wider mb-0.5">Başarı Oranı</span>
            <div className="flex items-baseline gap-1">
              <span className={`text-4xl font-black ${weightedAverage >= 70 ? 'text-gray-900' : 'text-gray-700'}`}>%{weightedAverage}</span>
            </div>
          </div>
          <div className={`px-4 py-2 rounded-xl text-sm font-bold border ${performanceLevel.bg} ${performanceLevel.color} ${performanceLevel.border} shadow-sm`}>
            {performanceLevel.label}
          </div>
        </div>
      </div>

      {/* Stats Grid - Colorful Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {GRID_STATS.map((stat, idx) => (
          <div key={idx} className={`rounded-2xl p-4 border transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${stat.bgInfo}`}>
            <div className="flex justify-between items-start mb-2">
              <div className={`text-sm font-bold ${stat.textColors.label}`}>{stat.label}</div>
              <span className="text-lg opacity-50 grayscale">{stat.icon}</span>
            </div>
            <div className="mt-2">
              <div className={`text-2xl font-black ${stat.textColors.value}`}>{stat.count}</div>
              <div className={`text-xs font-semibold mt-1 ${stat.textColors.sub}`}>Ort: %{stat.avg}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Subject Performance - Enhanced */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-base font-bold text-gray-800 mb-6 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-100 text-cyan-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            Ders Bazlı Performans
          </h3>
          {subjectPerformance.length > 0 ? (
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectPerformance} layout="vertical" margin={{ top: 0, right: 50, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} stroke="#f3f4f6" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="subject" type="category" width={110} tick={{ fontSize: 11, fill: '#4b5563', fontWeight: 500 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: '#f9fafb' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                    formatter={(value: number) => [`%${value}`, 'Ortalama']}
                  />
                  <Bar dataKey="ortalama" radius={[0, 6, 6, 0]} barSize={24}>
                    <LabelList dataKey="ortalama" position="right" formatter={(value: number) => `%${value}`} style={{ fontSize: '12px', fontWeight: 'bold', fill: '#4b5563' }} />
                    {subjectPerformance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={SUBJECT_COLORS[index % SUBJECT_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400 text-sm bg-gray-50/50 rounded-xl">Yeterli veri yok</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Weak Topics */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 transition-transform hover:scale-[1.01] duration-300">
          <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-500 text-xs">⚠️</span>
            Gelişim Alanları (Ortak Eksikler)
          </h3>
          {weakTopicsAggregated.length > 0 ? (
            <div className="space-y-3">
              {weakTopicsAggregated.slice(0, 3).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-red-50 to-white border border-red-100/50">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-red-100 text-[10px] font-bold text-red-500">{idx + 1}</span>
                    <span className="text-sm font-medium text-gray-700 truncate">{item.topic}</span>
                  </div>
                  <span className="text-[10px] px-2 py-1 bg-white rounded-md border border-red-100 text-red-500 font-bold shadow-sm whitespace-nowrap">
                    {item.count} aktivite
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
              Şu an için ortak bir eksik konu tespit edilmedi. Harika!
            </p>
          )}
        </div>

        {/* Strong Topics */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 transition-transform hover:scale-[1.01] duration-300">
          <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-500 text-xs">💪</span>
            Güçlü Yönler (En Başarılı Konular)
          </h3>
          {strongTopicsAggregated.length > 0 ? (
            <div className="space-y-3">
              {strongTopicsAggregated.slice(0, 3).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-green-50 to-white border border-green-100/50">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-green-100 text-[10px] font-bold text-green-600">✓</span>
                    <span className="text-sm font-medium text-gray-700 truncate">{item.topic}</span>
                  </div>
                  <span className="text-[10px] px-2 py-1 bg-white rounded-md border border-green-100 text-green-600 font-bold shadow-sm whitespace-nowrap">
                    {item.count} aktivite
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
              Veri bekleniyor...
            </p>
          )}
        </div>
      </div>

      {/* Suggestions - Modern Card */}
      <div className="bg-gradient-to-br from-indigo-50 via-blue-50 to-white rounded-2xl border border-blue-100 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-indigo-900 mb-4 flex items-center gap-2">
          <div className="p-1.5 rounded bg-indigo-100 text-indigo-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          Akıllı AI Analiz & Öneriler
        </h3>
        <ul className="space-y-3">
          {aiRecommendations.map((rec, idx) => (
            <li key={idx} className={`flex items-start gap-3 text-sm p-3 rounded-xl border ${rec.type === 'critical' ? 'bg-red-50 border-red-100 text-red-900' :
              rec.type === 'warning' ? 'bg-orange-50 border-orange-100 text-orange-900' :
                rec.type === 'success' ? 'bg-green-50 border-green-100 text-green-900' :
                  'bg-white/60 border-indigo-50 text-indigo-900/80'
              }`}>
              <span className={`mt-1 text-[10px] ${rec.type === 'critical' ? 'text-red-600' :
                rec.type === 'warning' ? 'text-orange-500' :
                  rec.type === 'success' ? 'text-green-500' :
                    'text-indigo-400'
                }`}>●</span>
              <span>{rec.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default OverallAnalytics;
