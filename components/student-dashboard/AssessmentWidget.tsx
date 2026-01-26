import React from 'react';

interface AssessmentWidgetProps {
    onStart: () => void;
}

const AssessmentWidget: React.FC<AssessmentWidgetProps> = ({ onStart }) => {
    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-4">
            <div className="p-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white flex items-center gap-2">
                <span className="bg-white/20 p-1.5 rounded-lg text-white backdrop-blur-sm">🎯</span>
                <h2 className="text-lg font-bold">Tanı Testi</h2>
            </div>
            <div className="p-4">
                <p className="text-sm text-gray-600 mb-4">
                    Eksiklerini belirlemek ve sana özel çalışma planı hazırlamak için 20 soruluk tanı testini çöz.
                </p>
                <button
                    onClick={onStart}
                    className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                >
                    <span>Sınavı Başlat</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7-7 7" /></svg>
                </button>
            </div>
        </div>
    );
};

export default AssessmentWidget;
