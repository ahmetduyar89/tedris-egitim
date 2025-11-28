import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

interface EnhancedPomodoroTimerProps {
    studentId: string;
}

export const EnhancedPomodoroTimer: React.FC<EnhancedPomodoroTimerProps> = ({ studentId }) => {
    const [workMinutes, setWorkMinutes] = useState(25);
    const [breakMinutes, setBreakMinutes] = useState(5);
    const [timeLeft, setTimeLeft] = useState(workMinutes * 60);
    const [isRunning, setIsRunning] = useState(false);
    const [isBreak, setIsBreak] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [completedCycles, setCompletedCycles] = useState(0);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [totalWorkTime, setTotalWorkTime] = useState(0);
    const [totalBreakTime, setTotalBreakTime] = useState(0);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRunning && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        handleTimerComplete();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRunning, timeLeft]);

    const startSession = async () => {
        const { data, error } = await supabase
            .from('pomodoro_sessions')
            .insert({
                student_id: studentId,
                duration_minutes: workMinutes,
                break_duration_minutes: breakMinutes,
                is_active: true
            })
            .select()
            .single();

        if (!error && data) {
            setSessionId(data.id);
        }
    };

    const updateSession = async () => {
        if (!sessionId) return;

        await supabase
            .from('pomodoro_sessions')
            .update({
                completed_cycles: completedCycles,
                total_work_minutes: totalWorkTime,
                total_break_minutes: totalBreakTime,
                updated_at: new Date().toISOString()
            })
            .eq('id', sessionId);
    };

    const endSession = async () => {
        if (!sessionId) return;

        await supabase
            .from('pomodoro_sessions')
            .update({
                ended_at: new Date().toISOString(),
                is_active: false,
                completed_cycles: completedCycles,
                total_work_minutes: totalWorkTime,
                total_break_minutes: totalBreakTime
            })
            .eq('id', sessionId);

        setSessionId(null);
    };

    const handleStart = () => {
        if (!sessionId) {
            startSession();
        }
        setIsRunning(true);
    };

    const handlePause = () => {
        setIsRunning(false);
        updateSession();
    };

    const handleReset = () => {
        setIsRunning(false);
        setTimeLeft(workMinutes * 60);
        setIsBreak(false);
        if (sessionId) {
            endSession();
        }
    };

    const handleTimerComplete = () => {
        if (!isBreak) {
            setTotalWorkTime(prev => prev + workMinutes);
            setCompletedCycles(prev => prev + 1);
            setIsBreak(true);
            setTimeLeft(breakMinutes * 60);
        } else {
            setTotalBreakTime(prev => prev + breakMinutes);
            setIsBreak(false);
            setTimeLeft(workMinutes * 60);
        }
        updateSession();
        playSound();
    };

    const playSound = () => {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGWi77eafTRAMUKfj8LZjHAY4ktfyzHksBSR3x/DdkEAKFF606+uoVRQKRp/g8r5sIQUrgs7y2Yk2CBlou+3mn00QDFCn4/C2YxwGOJLX8sx5LAUkd8fw3ZBAC');
        audio.play().catch(() => { });
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const CompactView = () => (
        <div className="bg-white rounded-lg shadow-md p-3 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setIsExpanded(true)}>
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <span className="text-2xl">🍅</span>
                    <div>
                        <div className="font-bold text-sm">{isBreak ? 'Mola' : 'Çalışma'}</div>
                        <div className="text-xs text-gray-500">{completedCycles} döngü</div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="font-mono text-lg font-bold">{formatTime(timeLeft)}</div>
                    <div className="flex space-x-1 mt-1">
                        {!isRunning ? (
                            <button onClick={(e) => { e.stopPropagation(); handleStart(); }}
                                className="px-2 py-1 bg-green-500 text-white rounded text-xs">▶</button>
                        ) : (
                            <button onClick={(e) => { e.stopPropagation(); handlePause(); }}
                                className="px-2 py-1 bg-yellow-500 text-white rounded text-xs">⏸</button>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); handleReset(); }}
                            className="px-2 py-1 bg-red-500 text-white rounded text-xs">⏹</button>
                    </div>
                </div>
            </div>
        </div>
    );

    const ExpandedView = () => (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setIsExpanded(false)}>
            <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-3xl shadow-2xl p-8 max-w-md w-full text-white"
                onClick={(e) => e.stopPropagation()}>
                <div className="text-center">
                    <h2 className="text-3xl font-bold mb-2">Pomodoro Zamanlayıcı</h2>
                    <p className="text-purple-200 mb-6">{isBreak ? '☕ Mola Zamanı' : '📚 Çalışma Zamanı'}</p>

                    <div className="bg-white bg-opacity-20 rounded-2xl p-8 mb-6">
                        <div className="text-7xl font-mono font-bold mb-4">{formatTime(timeLeft)}</div>
                        <div className="text-sm opacity-75">
                            {completedCycles} döngü tamamlandı • {totalWorkTime} dk çalışma
                        </div>
                    </div>

                    <div className="flex justify-center space-x-4 mb-6">
                        {!isRunning ? (
                            <button onClick={handleStart}
                                className="bg-green-500 hover:bg-green-600 px-8 py-3 rounded-full font-bold text-lg">
                                ▶ Başlat
                            </button>
                        ) : (
                            <button onClick={handlePause}
                                className="bg-yellow-500 hover:bg-yellow-600 px-8 py-3 rounded-full font-bold text-lg">
                                ⏸ Duraklat
                            </button>
                        )}
                        <button onClick={handleReset}
                            className="bg-red-500 hover:bg-red-600 px-8 py-3 rounded-full font-bold text-lg">
                            ⏹ Sıfırla
                        </button>
                    </div>

                    {!isRunning && !sessionId && (
                        <div className="bg-white bg-opacity-10 rounded-xl p-4 mb-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm mb-2">Çalışma (dk)</label>
                                    <input type="number" value={workMinutes} onChange={(e) => {
                                        const val = parseInt(e.target.value) || 25;
                                        setWorkMinutes(val);
                                        if (!isBreak) setTimeLeft(val * 60);
                                    }}
                                        className="w-full px-3 py-2 rounded-lg text-gray-800 font-bold text-center" />
                                </div>
                                <div>
                                    <label className="block text-sm mb-2">Mola (dk)</label>
                                    <input type="number" value={breakMinutes} onChange={(e) => setBreakMinutes(parseInt(e.target.value) || 5)}
                                        className="w-full px-3 py-2 rounded-lg text-gray-800 font-bold text-center" />
                                </div>
                            </div>
                        </div>
                    )}

                    <button onClick={() => setIsExpanded(false)}
                        className="text-white opacity-75 hover:opacity-100 underline">
                        Küçült
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <>
            <CompactView />
            {isExpanded && <ExpandedView />}
        </>
    );
};
