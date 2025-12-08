import React, { useMemo } from 'react';
import * as Recharts from 'recharts';
import { Test, Assignment, Flashcard, SpacedRepetitionSchedule, QuestionBankAssignment } from '../types';

const { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, PieChart, Pie, Cell } = Recharts;

const COLORS = {
  primary: '#4F46E5',
  secondary: '#06B6D4',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  purple: '#8B5CF6',
  pink: '#EC4899'
};

interface OverallAnalyticsProps {
  tests: Test[];
  assignments: Assignment[];
  flashcards: Flashcard[];
  spacedRepetitionSchedules: SpacedRepetitionSchedule[];
  questionBankAssignments?: QuestionBankAssignment[];
  studentName: string;
}

const OverallAnalytics: React.FC<OverallAnalyticsProps> = ({
  tests,
  assignments,
  flashcards,
  spacedRepetitionSchedules,
  questionBankAssignments = [],
  studentName
}) => {
  const completedTests = useMemo(() => tests.filter(t => t.completed && t.analysis), [tests]);
  const completedAssignments = useMemo(() => assignments.filter(a => a.submission?.status === 'Değerlendirildi'), [assignments]);
  const completedQBTests = useMemo(() => questionBankAssignments.filter(qb => qb.status === 'Tamamlandı'), [questionBankAssignments]);

  const overallStats = useMemo(() => {
    // Total counts should reflect ALL assigned items, not just completed ones
    const totalTests = tests.length;
    const totalAssignments = assignments.length;
    const totalFlashcards = flashcards.length;
    const totalQBTests = questionBankAssignments.length;

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

    const masteredFlashcards = spacedRepetitionSchedules.filter(s => s.intervalDays >= 30).length;
    const flashcardMasteryRate = totalFlashcards > 0
      ? Math.round((masteredFlashcards / totalFlashcards) * 100)
      : 0;

    return {
      totalTests,
      totalAssignments,
      totalFlashcards,
      totalQBTests,
      avgTestScore,
      avgAssignmentScore,
      avgQBTestScore,
      flashcardMasteryRate,
      totalActivities: totalTests + totalAssignments + totalFlashcards + totalQBTests,
      // Add completion counts for UI display if needed
      completedTestsCount: completedTests.length,
      completedAssignmentsCount: completedAssignments.length,
      completedQBTestsCount: completedQBTests.length
    };
  }, [tests, assignments, flashcards, spacedRepetitionSchedules, questionBankAssignments, completedTests, completedAssignments, completedQBTests]);

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
      ...completedAssignments.map(a => ({
        date: new Date(a.submission?.submittedAt || ''),
        score: a.submission?.teacherScore ?? a.submission?.aiScore ?? 0,
        type: 'Ödev'
      }))
    ].sort((a, b) => a.date.getTime() - b.date.getTime());

    return allActivities.slice(-10).map(activity => ({
      date: activity.date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' }),
      puan: activity.score,
      tip: activity.type
    }));
  }, [completedTests, completedAssignments, completedQBTests]);

  const subjectPerformance = useMemo(() => {
    const subjectMap = new Map<string, { total: number; sum: number }>();

    completedTests.forEach(test => {
      const subject = test.subject;
      if (!subjectMap.has(subject)) {
        subjectMap.set(subject, { total: 0, sum: 0 });
      }
      const data = subjectMap.get(subject)!;
      data.total += 1;
      data.sum += test.score || 0;
    });

    completedAssignments.forEach(assignment => {
      const subject = assignment.subject;
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

    return Array.from(subjectMap.entries()).map(([subject, data]) => ({
      subject,
      ortalama: Math.round(data.sum / data.total),
      aktivite: data.total
    }));
  }, [completedTests, completedAssignments, completedQBTests]);

  const weakTopicsAggregated = useMemo(() => {
    const topicMap = new Map<string, number>();
    const invalidTopicPatterns = [
      /tespit edilememiştir/i,
      /bulunamadı/i,
      /yok/i,
      /bu sınavda/i,
      /henüz/i
    ];

    const isValidTopic = (topic: string) => {
      if (!topic || topic.trim().length < 3) return false;
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

    return Array.from(topicMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic, count]) => ({ topic, count }));
  }, [completedTests, completedAssignments, completedQBTests]);

  const strongTopicsAggregated = useMemo(() => {
    const topicMap = new Map<string, number>();
    const invalidTopicPatterns = [
      /tespit edilememiştir/i,
      /bulunamadı/i,
      /yok/i,
      /bu sınavda/i,
      /henüz/i
    ];

    const isValidTopic = (topic: string) => {
      if (!topic || topic.trim().length < 3) return false;
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

    return Array.from(topicMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic, count]) => ({ topic, count }));
  }, [completedTests, completedAssignments, completedQBTests]);

  const activityDistribution = useMemo(() => {
    return [
      { name: 'Testler', value: overallStats.totalTests, color: COLORS.primary },
      { name: 'Ödevler', value: overallStats.totalAssignments, color: COLORS.secondary },
      { name: 'Soru Bankası', value: overallStats.totalQBTests, color: COLORS.purple },
      { name: 'Flashcardlar', value: overallStats.totalFlashcards, color: COLORS.pink }
    ];
  }, [overallStats]);

  const performanceLevel = useMemo(() => {
    const totalScores = [
      overallStats.avgTestScore,
      overallStats.avgAssignmentScore,
      overallStats.avgQBTestScore
    ].filter(score => score > 0);
    const avg = totalScores.length > 0
      ? totalScores.reduce((sum, score) => sum + score, 0) / totalScores.length
      : 0;
    if (avg >= 85) return { label: 'Mükemmel', color: 'text-green-600', bg: 'bg-green-100' };
    if (avg >= 70) return { label: 'İyi', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (avg >= 50) return { label: 'Gelişmekte', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { label: 'Destek Gerekli', color: 'text-red-600', bg: 'bg-red-100' };
  }, [overallStats]);

  if (completedTests.length === 0 && completedAssignments.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Henüz Analiz Verisi Yok</h3>
        <p className="text-gray-600">
          {studentName} için tamamlanmış test veya ödev bulunmuyor.
          <br />
          Öğrenci aktivite tamamladıkça burada kapsamlı analiz göreceksiniz.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg p-8 text-white">
        <h2 className="text-3xl font-bold mb-2">Genel Performans Analizi</h2>
        <p className="text-blue-100">{studentName} - Tüm Aktiviteler</p>
        <div className="mt-4 flex items-center space-x-4">
          <span className={`px-4 py-2 rounded-full ${performanceLevel.bg} ${performanceLevel.color} font-bold`}>
            {performanceLevel.label}
          </span>
          <span className="text-blue-100">
            {overallStats.totalActivities} Toplam Aktivite
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
          <div className="text-xs text-gray-500 mb-1">Testler</div>
          <div className="text-2xl font-bold text-blue-600">{overallStats.totalTests}</div>
          <div className="text-xs text-gray-400 mt-0.5">Ort: {overallStats.avgTestScore}%</div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
          <div className="text-xs text-gray-500 mb-1">Ödevler</div>
          <div className="text-2xl font-bold text-cyan-600">{overallStats.totalAssignments}</div>
          <div className="text-xs text-gray-400 mt-0.5">Ort: {overallStats.avgAssignmentScore}%</div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
          <div className="text-xs text-gray-500 mb-1">Soru Bankası</div>
          <div className="text-2xl font-bold text-purple-600">{overallStats.totalQBTests}</div>
          <div className="text-xs text-gray-400 mt-0.5">Ort: {overallStats.avgQBTestScore}/100</div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
          <div className="text-xs text-gray-500 mb-1">Flashcardlar</div>
          <div className="text-2xl font-bold text-pink-600">{overallStats.totalFlashcards}</div>
          <div className="text-xs text-gray-400 mt-0.5">Hakimiyet: {overallStats.flashcardMasteryRate}%</div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
          <div className="text-xs text-gray-500 mb-1">Genel Ortalama</div>
          <div className="text-2xl font-bold text-green-600">
            {Math.round((overallStats.avgTestScore + overallStats.avgAssignmentScore) / 2)}%
          </div>
          <div className="text-xs text-gray-400 mt-0.5">Test + Ödev</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">İlerleme Grafiği</h3>
          {progressOverTime.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={progressOverTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="puan" stroke={COLORS.primary} strokeWidth={3} name="Puan" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-8">Yeterli veri yok</p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Ders Bazlı Performans</h3>
          {subjectPerformance.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={subjectPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="ortalama" fill={COLORS.secondary} name="Ortalama %" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-8">Yeterli veri yok</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Aktivite Dağılımı</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={activityDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {activityDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <span className="text-2xl mr-2">⚠️</span>
            En Çok Zorlanan Konular (Bütüncül Analiz)
          </h3>
          <p className="text-sm text-gray-500 mb-3">
            Testler, soru bankası ve ödevlerden toplanan veriler
          </p>
          {weakTopicsAggregated.length > 0 ? (
            <div className="space-y-3">
              {weakTopicsAggregated.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between bg-red-50 p-3 rounded-lg border border-red-200 hover:bg-red-100 transition-colors">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl font-bold text-red-600">{idx + 1}</span>
                    <span className="text-gray-800 font-medium">{item.topic}</span>
                  </div>
                  <span className="px-3 py-1 bg-red-200 text-red-800 rounded-full text-sm font-semibold">
                    {item.count} aktivitede
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Zayıf konu tespit edilmedi</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <span className="text-2xl mr-2">💪</span>
          En Güçlü Konular (Bütüncül Analiz)
        </h3>
        <p className="text-sm text-gray-500 mb-3">
          Testler, soru bankası ve ödevlerden toplanan veriler
        </p>
        {strongTopicsAggregated.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {strongTopicsAggregated.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between bg-green-50 p-3 rounded-lg border border-green-200 hover:bg-green-100 transition-colors">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">✓</span>
                  <span className="text-gray-800 font-medium">{item.topic}</span>
                </div>
                <span className="px-2 py-1 bg-green-200 text-green-800 rounded-full text-xs font-semibold">
                  {item.count} aktivite
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center">
            <p className="text-gray-600 font-medium">
              Henüz güçlü olunan bir konu tespit edilememiştir.
            </p>
          </div>
        )}
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl shadow-lg p-6 border border-blue-200">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <span className="text-2xl mr-2">💡</span>
          Genel Öneriler (Tüm Testler & Ödevler)
        </h3>
        <ul className="space-y-2">
          {overallStats.avgTestScore < 70 && (
            <li className="flex items-start bg-white p-3 rounded-lg">
              <span className="text-orange-600 mr-2">→</span>
              <span className="text-gray-700">
                Test ortalaması düşük ({overallStats.avgTestScore}%). Konu tekrarı ve ek çalışma materyali önerilir.
              </span>
            </li>
          )}
          {overallStats.avgAssignmentScore < 70 && (
            <li className="flex items-start bg-white p-3 rounded-lg">
              <span className="text-orange-600 mr-2">→</span>
              <span className="text-gray-700">
                Ödev performansı artırılabilir ({overallStats.avgAssignmentScore}%). Düzenli ödev takibi yapılmalı.
              </span>
            </li>
          )}
          {overallStats.avgQBTestScore < 70 && overallStats.totalQBTests > 0 && (
            <li className="flex items-start bg-white p-3 rounded-lg">
              <span className="text-orange-600 mr-2">→</span>
              <span className="text-gray-700">
                Soru bankası testlerinde performans artırılmalı ({overallStats.avgQBTestScore}/100). Daha fazla örnek soru çözümü önerilir.
              </span>
            </li>
          )}
          {overallStats.flashcardMasteryRate < 50 && overallStats.totalFlashcards > 0 && (
            <li className="flex items-start bg-white p-3 rounded-lg">
              <span className="text-orange-600 mr-2">→</span>
              <span className="text-gray-700">
                Flashcard çalışmasına daha fazla zaman ayrılmalı. Düzenli tekrar önemli (Hakimiyet: {overallStats.flashcardMasteryRate}%).
              </span>
            </li>
          )}
          {weakTopicsAggregated.length > 0 && (
            <li className="flex items-start bg-white p-3 rounded-lg">
              <span className="text-orange-600 mr-2">→</span>
              <span className="text-gray-700">
                <strong>{weakTopicsAggregated[0].topic}</strong> konusunda {weakTopicsAggregated[0].count} farklı aktivitede zorluk yaşanmış. Bu konuda ek kaynak çalışması ve örnek soru çözümü yapılması önerilir.
              </span>
            </li>
          )}
          {weakTopicsAggregated.length >= 2 && (
            <li className="flex items-start bg-white p-3 rounded-lg">
              <span className="text-orange-600 mr-2">→</span>
              <span className="text-gray-700">
                <strong>{weakTopicsAggregated[1].topic}</strong> konusunda da gelişim gerekiyor. Konu anlatımı tekrarı ve alıştırma soruları faydalı olacaktır.
              </span>
            </li>
          )}
          {weakTopicsAggregated.length >= 3 && (
            <li className="flex items-start bg-white p-3 rounded-lg">
              <span className="text-orange-600 mr-2">→</span>
              <span className="text-gray-700">
                <strong>{weakTopicsAggregated[2].topic}</strong> konusuna da dikkat edilmeli. Temel kavramların pekiştirilmesi önerilir.
              </span>
            </li>
          )}
          {strongTopicsAggregated.length > 0 && (
            <li className="flex items-start bg-white p-3 rounded-lg">
              <span className="text-green-600 mr-2">✓</span>
              <span className="text-gray-700">
                <strong>{strongTopicsAggregated[0].topic}</strong> konusunda başarılı performans gösterilmiş. Bu konudaki çalışma yöntemi diğer konulara da uygulanabilir.
              </span>
            </li>
          )}
          {strongTopicsAggregated.length >= 2 && (
            <li className="flex items-start bg-white p-3 rounded-lg">
              <span className="text-green-600 mr-2">✓</span>
              <span className="text-gray-700">
                <strong>{strongTopicsAggregated[1].topic}</strong> konusundaki hakimiyet devam ettirilerek benzer konulara geçiş yapılabilir.
              </span>
            </li>
          )}
          {overallStats.avgTestScore >= 85 && overallStats.avgAssignmentScore >= 85 && overallStats.avgQBTestScore >= 85 && (
            <li className="flex items-start bg-white p-3 rounded-lg">
              <span className="text-green-600 mr-2">✓</span>
              <span className="text-gray-700">
                Tüm alanlarda yüksek başarı gösterilmektedir (%85+). Mevcut çalışma disiplini sürdürülmeli ve zorluk seviyesi artırılabilir.
              </span>
            </li>
          )}
          {overallStats.totalActivities < 5 && (
            <li className="flex items-start bg-white p-3 rounded-lg">
              <span className="text-blue-600 mr-2">ℹ</span>
              <span className="text-gray-700">
                Daha detaylı analiz için daha fazla aktivite tamamlanmalı. Düzenli test ve ödev çalışması önerilir.
              </span>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default OverallAnalytics;
