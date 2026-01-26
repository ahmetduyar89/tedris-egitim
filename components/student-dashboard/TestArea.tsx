import React from 'react';
import { Test } from '../../types';
import { PDFTest, PDFTestSubmission } from '../../services/pdfTestService';

interface TestAreaProps {
    pendingTests: Test[];
    completedTests: Test[];
    onStartTest: (test: Test) => void;
    onViewReport: (test: Test) => void;
    pendingPDFTests: PDFTest[];
    completedPDFTests: PDFTestSubmission[];
    onStartPDFTest: (test: PDFTest) => void;
}

const TestArea: React.FC<TestAreaProps> = ({
    pendingTests,
    completedTests,
    onStartTest,
    onViewReport,
    pendingPDFTests,
    completedPDFTests,
    onStartPDFTest
}) => {
    const hasPendingTests = pendingTests.length > 0 || pendingPDFTests.length > 0;
    const hasCompletedTests = completedTests.length > 0 || completedPDFTests.length > 0;

    if (!hasPendingTests && !hasCompletedTests) {
        return null;
    }

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-teal-600 to-emerald-600 text-white flex items-center gap-2">
                <span className="bg-white/20 p-1.5 rounded-lg text-white backdrop-blur-sm">📝</span>
                <h2 className="text-lg font-bold">Testler</h2>
            </div>

            <div className="p-4 space-y-4">
                {hasPendingTests && (
                    <div>
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                            Atanan
                        </h3>
                        <ul className="space-y-2">
                            {pendingTests.map(test => (
                                <li key={test.id} className="p-3 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="text-sm font-bold text-gray-800 group-hover:text-blue-600 transition-colors truncate pr-2">{test.title}</h4>
                                        <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100 font-medium flex-shrink-0">Test</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mb-3">{test.questions.length} soru · {test.duration} dk</p>
                                    <button
                                        onClick={() => onStartTest(test)}
                                        className="w-full bg-blue-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-blue-700 transition-all shadow-sm hover:shadow active:scale-95"
                                    >
                                        Başla
                                    </button>
                                </li>
                            ))}
                            {pendingPDFTests.map(test => (
                                <li key={test.id} className="p-3 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                                    <div className="flex items-center gap-1.5 mb-2 max-w-full">
                                        <span className="bg-red-50 text-red-600 p-1 rounded-md text-xs flex-shrink-0">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                        </span>
                                        <h4 className="text-sm font-bold text-gray-800 group-hover:text-blue-600 transition-colors truncate flex-1 min-w-0">{test.title}</h4>
                                    </div>
                                    <p className="text-xs text-gray-500 mb-3 ml-1">{test.totalQuestions} soru · {test.durationMinutes} dk</p>
                                    <button
                                        onClick={() => onStartPDFTest(test)}
                                        className="w-full bg-blue-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-blue-700 transition-all shadow-sm hover:shadow active:scale-95"
                                    >
                                        Başla
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {hasCompletedTests && (
                    <div>
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                            Tamamlanan
                        </h3>
                        <ul className="space-y-2">
                            {completedTests.map(test => (
                                <li key={test.id} className="p-2.5 rounded-xl bg-gray-50 hover:bg-white border border-transparent hover:border-gray-200 hover:shadow-sm transition-all cursor-pointer group" onClick={() => test.analysis && onViewReport(test)}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 truncate">{test.title}</h4>
                                            <p className="text-[10px] text-gray-500 mt-0.5">Puan: <span className={test.score && test.score >= 70 ? 'text-green-600 font-bold' : 'text-orange-600 font-bold'}>{test.score ?? 0}%</span></p>
                                        </div>
                                        <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${test.analysis ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                            {test.analysis ? 'Rapor' : 'Bekliyor'}
                                        </span>
                                    </div>
                                </li>
                            ))}
                            {completedPDFTests.map(submission => (
                                <li key={submission.id} className="p-2.5 rounded-xl bg-gray-50 hover:bg-white border border-transparent hover:border-gray-200 hover:shadow-sm transition-all">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                </svg>
                                                <h4 className="text-sm font-semibold text-gray-700 truncate">{submission.pdfTest?.title || 'PDF Testi'}</h4>
                                            </div>
                                            <p className="text-[10px] text-gray-500 ml-5">Puan: <span className={submission.scorePercentage && submission.scorePercentage >= 70 ? 'text-green-600 font-bold' : 'text-orange-600 font-bold'}>{submission.scorePercentage?.toFixed(1)}%</span></p>
                                        </div>
                                        <span className="text-[10px] px-2 py-1 rounded-full bg-green-100 text-green-700 font-bold">✓</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TestArea;
