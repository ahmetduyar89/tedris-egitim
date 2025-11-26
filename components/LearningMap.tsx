import React, { useState, useEffect, useMemo } from 'react';
import * as Recharts from 'recharts';
import { Student, Test, MapNode, MapNodeStatus, ContentRecommendation, Question, QuestionType } from '../types';
import { recommendContentForTopic } from '../services/optimizedAIService';
import { db } from '../services/dbAdapter';

const { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } = Recharts;

interface LearningMapProps {
    student: Student;
    onGenerateReviewPackage?: (topic: string) => void;
}

const statusConfig: { [key in MapNodeStatus]: { color: string; glow: string; label: string, textColor: string } } = {
    mastered: { color: 'bg-success', glow: 'shadow-[0_0_15px_3px_#10B981]', label: 'Güçlü Konular', textColor: 'text-success' },
    progress: { color: 'bg-accent', glow: 'shadow-[0_0_15px_3px_#F5C542]', label: 'Gelişen Konular', textColor: 'text-accent' },
    weak: { color: 'bg-secondary', glow: 'shadow-[0_0_15px_3px_#F05039]', label: 'Zayıf Konular', textColor: 'text-secondary' },
};

const LearningMap: React.FC<LearningMapProps> = ({ student, onGenerateReviewPackage }) => {
    const [nodes, setNodes] = useState<MapNode[]>([]);
    const [selectedNode, setSelectedNode] = useState<MapNode | null>(null);
    const [recommendations, setRecommendations] = useState<ContentRecommendation[]>([]);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTestsAndBuildMap = async () => {
            setIsLoading(true);
            try {
                const testsSnapshot = await db.collection('tests')
                    .where('studentId', '==', student.id)
                    .where('completed', '==', true)
                    .get();

                const studentTests = testsSnapshot.docs
                    .map((doc: any) => ({ id: doc.id, ...doc.data() }) as Test)
                    .filter(t => t.analysis?.topicBreakdown)
                    .sort((a, b) => new Date(a.submissionDate!).getTime() - new Date(b.submissionDate!).getTime());

                const qbAssignmentsSnapshot = await db.collection('question_bank_assignments')
                    .where('student_id', '==', student.id)
                    .where('status', '==', 'Tamamlandı')
                    .get();

                const qbTests = await Promise.all(
                    qbAssignmentsSnapshot.docs.map(async (doc: any) => {
                        const assignment = doc.data();
                        const qbDoc = await db.collection('question_banks').doc(assignment.question_bank_id).get();

                        if (!qbDoc.exists) {
                            console.warn(`⚠️ Soru bankası bulunamadı: ${assignment.question_bank_id}`);
                            return null;
                        }

                        const qb = qbDoc.data();
                        const performanceBreakdown = assignment.performance_breakdown || {};
                        const answers = assignment.answers || [];

                        let topicBreakdown = [];

                        if (Object.keys(performanceBreakdown).length > 0) {
                            topicBreakdown = Object.values(performanceBreakdown).map((perf: any) => ({
                                topic: perf.moduleName || perf.topicName || qb.topic || qb.unit || 'Genel',
                                correct: perf.correct || 0,
                                wrong: (perf.questions || 0) - (perf.correct || 0),
                            }));
                        } else if (Array.isArray(answers) && answers.length > 0) {
                            const topicStats = new Map<string, { correct: number; wrong: number }>();

                            answers.forEach((ans: any) => {
                                const topic = ans.topic || qb.topic || qb.unit || 'Genel';
                                if (!topicStats.has(topic)) {
                                    topicStats.set(topic, { correct: 0, wrong: 0 });
                                }
                                const stats = topicStats.get(topic)!;
                                if (ans.isCorrect) {
                                    stats.correct++;
                                } else {
                                    stats.wrong++;
                                }
                            });

                            topicBreakdown = Array.from(topicStats.entries()).map(([topic, stats]) => ({
                                topic,
                                correct: stats.correct,
                                wrong: stats.wrong
                            }));
                        } else {
                            const defaultTopic = qb.topic || qb.unit || 'Genel';
                            const correct = assignment.total_correct || 0;
                            const total = assignment.total_questions || 0;
                            topicBreakdown = [{
                                topic: defaultTopic,
                                correct: correct,
                                wrong: total - correct
                            }];
                        }

                        if (topicBreakdown.length === 0) {
                            console.warn(`⚠️ Test için topic breakdown oluşturulamadı: ${doc.id}`);
                            return null;
                        }

                        const questionsList: Question[] = Array.isArray(answers) ? answers.map((ans: any, idx: number) => ({
                            id: ans.questionId || `q${idx}`,
                            text: ans.questionText || ans.question || 'Soru metni yok',
                            type: QuestionType.MultipleChoice, // Default to MultipleChoice for QB questions
                            studentAnswer: ans.selectedAnswer || '',
                            correctAnswer: ans.correctAnswer || '',
                            isCorrect: ans.isCorrect || false,
                            topic: ans.topic || topicBreakdown[0]?.topic || qb.topic || qb.unit || 'Genel'
                        })) : [];

                        const test: Test = {
                            id: doc.id,
                            title: qb.title || 'Soru Bankası Testi',
                            studentId: student.id,
                            subject: qb.subject,
                            unit: qb.unit || 'Genel',
                            duration: 0,
                            dueDate: '',
                            completed: true,
                            submissionDate: assignment.completed_at || new Date().toISOString(),
                            score: assignment.score || 0,
                            questions: questionsList,
                            analysis: {
                                summary: { correct: assignment.total_correct || 0, wrong: (assignment.total_questions || 0) - (assignment.total_correct || 0), scorePercent: assignment.score || 0 },
                                analysis: { weakTopics: [], strongTopics: [], recommendations: [], overallComment: '' },
                                questionEvaluations: questionsList,
                                topicBreakdown: topicBreakdown
                            }
                        };
                        return test;
                    })
                );

                const validQbTests = qbTests.filter((t): t is Test => t !== null);
                const allTests = [...studentTests, ...validQbTests]
                    .sort((a, b) => new Date(a.submissionDate!).getTime() - new Date(b.submissionDate!).getTime());

                if (allTests.length > 0) {
                    const aggregatedTopics: { [key: string]: { correct: number; wrong: number; questions: Question[]; history: { [testId: string]: { correct: number; total: number; date: string } } } } = {};

                    allTests.forEach(test => {
                        const questionsInTestByTopic = test.questions.reduce((acc, q) => {
                            if (q.topic) {
                                if (!acc[q.topic]) acc[q.topic] = [];
                                acc[q.topic].push(q);
                            }
                            return acc;
                        }, {} as Record<string, Question[]>);

                        test.analysis!.topicBreakdown!.forEach(topicData => {
                            const topicName = topicData.topic;
                            if (!aggregatedTopics[topicName]) {
                                aggregatedTopics[topicName] = { correct: 0, wrong: 0, questions: [], history: {} };
                            }
                            aggregatedTopics[topicName].correct += topicData.correct;
                            aggregatedTopics[topicName].wrong += topicData.wrong;

                            if (questionsInTestByTopic[topicName]) {
                                aggregatedTopics[topicName].questions.push(...questionsInTestByTopic[topicName]);
                            }

                            const totalForTopicInTest = topicData.correct + topicData.wrong;
                            if (totalForTopicInTest > 0) {
                                aggregatedTopics[topicName].history[test.id] = { correct: topicData.correct, total: totalForTopicInTest, date: test.submissionDate! };
                            }
                        });
                    });

                    const newNodes = Object.entries(aggregatedTopics).map(([name, data]): MapNode => {
                        const totalQuestions = data.correct + data.wrong;
                        const score = totalQuestions > 0 ? Math.round((data.correct / totalQuestions) * 100) : 0;
                        let status: MapNodeStatus;
                        if (score >= 80) status = 'mastered';
                        else if (score >= 50) status = 'progress';
                        else status = 'weak';

                        const history = Object.values(data.history).map(h => ({
                            name: new Date(h.date).toLocaleDateString('tr-TR'),
                            score: h.total > 0 ? Math.round((h.correct / h.total) * 100) : 0,
                            date: h.date, // for sorting
                        })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

                        return { name, status, score, questionCount: totalQuestions, history, questions: data.questions };
                    });
                    setNodes(newNodes);
                } else {
                    setNodes([]);
                }
            } catch (error) {
                console.error("Error fetching tests for learning map:", error);
                setNodes([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchTestsAndBuildMap();
    }, [student.id]);

    const handleNodeClick = async (node: MapNode) => {
        setSelectedNode(node);
        setIsAiLoading(true);
        setRecommendations([]);
        try {
            const recs = await recommendContentForTopic(node.name, student.grade);
            if (Array.isArray(recs)) {
                setRecommendations(recs);
            } else {
                setRecommendations([]);
            }
        } catch (error) {
            console.error("Failed to get recommendations:", error);
            setRecommendations([]);
        } finally {
            setIsAiLoading(false);
        }
    };

    const groupedNodes = useMemo(() => {
        const groups: { [key in MapNodeStatus]: MapNode[] } = { mastered: [], progress: [], weak: [] };
        nodes.forEach(node => groups[node.status].push(node));
        return groups;
    }, [nodes]);

    return (
        <div className="bg-card-background p-6 rounded-2xl shadow-lg relative min-h-[500px]">
            <h2 className="text-2xl font-bold font-poppins text-accent mb-4">Tedris Harita 🗺️</h2>
            {isLoading && <div className="text-center p-10">Harita yükleniyor...</div>}
            {!isLoading && nodes.length === 0 && (
                <div className="text-center p-10 text-text-secondary">
                    Öğrenme haritanızı oluşturmak için lütfen bir test çözün.
                </div>
            )}

            <div className="flex flex-col md:flex-row justify-around gap-4">
                {Object.entries(groupedNodes).map(([status, groupNodes]) => (
                    <div key={status} className="flex-1">
                        <h3 className={`font-bold font-poppins text-lg mb-4 text-center ${statusConfig[status as MapNodeStatus].textColor}`}>{statusConfig[status as MapNodeStatus].label}</h3>
                        <div className="flex flex-col items-center gap-4 p-4 bg-background rounded-lg min-h-[300px]">
                            {Array.isArray(groupNodes) && groupNodes.map(node => (
                                <div
                                    key={node.name}
                                    onClick={() => handleNodeClick(node)}
                                    className={`p-3 rounded-lg text-white font-semibold text-center cursor-pointer transition-transform hover:scale-105 ${statusConfig[node.status].color}`}
                                    style={{ minWidth: '120px', maxWidth: '240px' }}
                                >
                                    {node.name}
                                    <span className="block text-xs opacity-80">{node.score}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Detail Panel */}
            {selectedNode && (
                <div className="absolute top-0 right-0 h-full w-full md:w-2/5 bg-white/80 backdrop-blur-sm border-l border-border p-6 z-10 animate-fade-in-right overflow-y-auto">
                    <button onClick={() => setSelectedNode(null)} className="absolute top-4 right-4 text-text-secondary hover:text-text-primary text-2xl">&times;</button>
                    <h3 className="text-2xl font-bold font-poppins mb-1">{selectedNode.name}</h3>
                    <p className={`font-semibold text-lg mb-4 ${statusConfig[selectedNode.status].textColor}`}>{statusConfig[selectedNode.status].label} ({selectedNode.score}%)</p>

                    {selectedNode.status !== 'mastered' && onGenerateReviewPackage && (
                        <button
                            onClick={() => { onGenerateReviewPackage(selectedNode.name); setSelectedNode(null); }}
                            className="w-full bg-primary text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-primary-dark mb-6"
                        >
                            Bu Konu İçin AI Telafi Paketi Oluştur
                        </button>
                    )}

                    <h4 className="font-bold font-poppins text-gray-700 mb-2 mt-4">Gelişim Grafiği</h4>
                    {selectedNode.history.length > 1 ? (
                        <ResponsiveContainer width="100%" height={150}>
                            <LineChart data={selectedNode.history} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                                <Tooltip />
                                <Line type="monotone" dataKey="score" stroke="#4F46E5" strokeWidth={2} name="Puan" />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-sm text-gray-500">Gelişim grafiği için yeterli test verisi yok.</p>
                    )}

                    <h4 className="font-bold font-poppins text-gray-700 mb-3 mt-6">İlgili Sorular ({selectedNode.questions.length})</h4>
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                        {selectedNode.questions.map((q, index) => (
                            <div key={`${q.id}-${index}`} className={`p-3 rounded-lg text-xs ${q.isCorrect ? 'bg-green-50 border-l-4 border-green-400' : 'bg-red-50 border-l-4 border-red-400'}`}>
                                <p className="font-medium text-gray-800">{q.text}</p>
                                <p className="mt-1"><strong className="font-bold">Cevabın:</strong> {q.studentAnswer}</p>
                                {!q.isCorrect && <p><strong className="font-bold">Doğru Cevap:</strong> {q.correctAnswer}</p>}
                            </div>
                        ))}
                    </div>

                    <h4 className="font-bold font-poppins text-primary mb-3 mt-6">💡 AI Önerileri</h4>
                    {isAiLoading && <p>Öneriler getiriliyor...</p>}
                    <div className="space-y-3">
                        {recommendations.map((rec, index) => (
                            <div key={index} className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                                <p className="font-semibold">{rec.title} <span className="text-xs font-normal text-text-secondary">({rec.type})</span></p>
                                <p className="text-sm text-text-secondary mt-1">{rec.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LearningMap;