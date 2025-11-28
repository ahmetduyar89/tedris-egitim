import React, { useState, useEffect } from 'react';

export const PomodoroTimer: React.FC = () => {
    const [minutes, setMinutes] = useState(25);
    const [seconds, setSeconds] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState<'work' | 'break'>('work');

    useEffect(() => {
        let interval: any = null;
        if (isActive) {
            interval = setInterval(() => {
                if (seconds === 0) {
                    if (minutes === 0) {
                        setIsActive(false);
                        // Timer finished
                        if (mode === 'work') {
                            setMode('break');
                            setMinutes(5);
                        } else {
                            setMode('work');
                            setMinutes(25);
                        }
                    } else {
                        setMinutes(minutes - 1);
                        setSeconds(59);
                    }
                } else {
                    setSeconds(seconds - 1);
                }
            }, 1000);
        } else if (!isActive && seconds !== 0) {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isActive, seconds, minutes, mode]);

    const toggleTimer = () => {
        setIsActive(!isActive);
    };

    const resetTimer = () => {
        setIsActive(false);
        setMode('work');
        setMinutes(25);
        setSeconds(0);
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center">
            <h3 className="text-lg font-bold mb-2 text-gray-700">
                {mode === 'work' ? '📚 Çalışma Zamanı' : '☕ Mola Zamanı'}
            </h3>
            <div className="text-4xl font-mono font-bold text-indigo-600 mb-4">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
            <div className="flex space-x-2">
                <button
                    onClick={toggleTimer}
                    className={`px-4 py-2 rounded text-white font-medium transition-colors ${isActive ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'
                        }`}
                >
                    {isActive ? 'Duraklat' : 'Başlat'}
                </button>
                <button
                    onClick={resetTimer}
                    className="px-4 py-2 rounded bg-gray-200 text-gray-700 font-medium hover:bg-gray-300 transition-colors"
                >
                    Sıfırla
                </button>
            </div>
        </div>
    );
};
