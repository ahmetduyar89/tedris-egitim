import React from 'react';
import * as Recharts from 'recharts';
import { Test, QuestionType } from '../types';

const { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } = Recharts;

const COLORS = { correct: '#10B981', wrong: '#EF4444', primary: '#4F46E5', secondary: '#06B6D4' };

interface StudentTestReportProps {
  test: Test;
  allCompletedTests: Test[];
  onBack: () => void;
}

const StudentTestReport: React.FC<StudentTestReportProps> = ({ test, allCompletedTests, onBack }) => {
  const analysis = test.analysis;

  if (!analysis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
        <div className="max-w-4xl mx-auto">
          <button onClick={onBack} className="mb-6 px-6 py-3 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-colors shadow-md font-semibold">
            Geri Dön
          </button>
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <p className="text-gray-600">Analiz raporu henüz hazırlanmadı.</p>
          </div>
        </div>
      </div>
    );
  }

  const correctCount = analysis.questionEvaluations.filter(q => q.isCorrect).length;
  const wrongCount = analysis.questionEvaluations.length - correctCount;

  const pieData = [
    { name: 'Doğru', value: correctCount, color: COLORS.correct },
    { name: 'Yanlış', value: wrongCount, color: COLORS.wrong }
  ];

  const topicPerformance = analysis.topicBreakdown?.map(topic => {
    const correct = typeof topic === 'object' && 'correct' in topic ? topic.correct : 0;
    const wrong = typeof topic === 'object' && 'wrong' in topic ? topic.wrong : 0;
    const topicName = typeof topic === 'object' && 'topic' in topic ? topic.topic : 'Bilinmiyor';
    const total = correct + wrong;

    return {
      topic: topicName,
      correct: correct,
      wrong: wrong,
      percentage: total > 0 ? Math.round((correct / total) * 100) : 0
    };
  }) || [];


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <div className="max-w-6xl mx-auto">
        <button onClick={onBack} className="mb-6 px-6 py-3 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-colors shadow-md font-semibold">
          Geri Dön
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{test.title}</h1>
              <p className="text-gray-600 mt-1">{test.subject} - Test Raporu</p>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold text-primary">{test.score}%</div>
              <div className="text-sm text-gray-500">Genel Başarı</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <div className="text-2xl font-bold text-green-600">{correctCount}</div>
              <div className="text-sm text-gray-600">Doğru Cevap</div>
            </div>
            <div className="bg-red-50 rounded-xl p-4 border border-red-200">
              <div className="text-2xl font-bold text-red-600">{wrongCount}</div>
              <div className="text-sm text-gray-600">Yanlış Cevap</div>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">{analysis.questionEvaluations.length}</div>
              <div className="text-sm text-gray-600">Toplam Soru</div>
            </div>
          </div>

          {analysis.analysis?.overallComment && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
              <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center">
                <span className="text-2xl mr-2">📊</span>
                Genel Değerlendirme
              </h3>
              <p className="text-gray-700 leading-relaxed">{analysis.analysis.overallComment}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Soru Dağılımı</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" labelLine={false} label={(entry) => `${entry.name}: ${entry.value}`} outerRadius={80} fill="#8884d8" dataKey="value">
                  {pieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {topicPerformance.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Konu Bazlı Performans</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={topicPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="topic" angle={-20} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="correct" fill={COLORS.correct} name="Doğru" />
                  <Bar dataKey="wrong" fill={COLORS.wrong} name="Yanlış" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>


        {analysis.analysis?.strongTopics && analysis.analysis.strongTopics.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <span className="text-2xl mr-2">💪</span>
              Güçlü Yönlerin
            </h3>
            <ul className="space-y-2">
              {analysis.analysis.strongTopics.map((strength, idx) => (
                <li key={idx} className="flex items-start bg-green-50 p-3 rounded-lg border border-green-200">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-gray-700">{strength}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {analysis.analysis?.weakTopics && analysis.analysis.weakTopics.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <span className="text-2xl mr-2">🎯</span>
              Geliştirilmesi Gereken Konular
            </h3>
            <ul className="space-y-2">
              {analysis.analysis.weakTopics.map((weakness, idx) => (
                <li key={idx} className="flex items-start bg-orange-50 p-3 rounded-lg border border-orange-200">
                  <span className="text-orange-600 mr-2">⚠</span>
                  <span className="text-gray-700">{weakness}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {analysis.analysis?.recommendations && analysis.analysis.recommendations.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <span className="text-2xl mr-2">💡</span>
              Öneriler
            </h3>
            <ul className="space-y-2">
              {analysis.analysis.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <span className="text-blue-600 mr-2">→</span>
                  <span className="text-gray-700">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentTestReport;
