
import { Student, Badge, Task, TaskStatus, WeeklyProgram, Test, Subject } from '../types';

// Mock data for badges
const ALL_BADGES: Badge[] = [
    { id: 'b1', title: 'İlk Adım', icon: '🎯', description: 'İlk haftalık planını tamamladın!' },
    { id: 'b2', title: 'Test Uzmanı', icon: '📚', description: 'Arka arkaya 5 test çözdün.' },
    { id: 'b3', title: 'Mükemmel Hafta', icon: '💪', description: 'Bir haftadaki tüm görevleri tamamladın.' },
    { id: 'b4', title: 'Fen Canavarı', icon: '🔬', description: 'Fen Bilimleri dersinde %90+ başarı gösterdin.' },
];

// --- XP & Leveling System ---
const XP_PER_TASK = 10;
const XP_PER_LEVEL = 100;

export const calculateLevel = (xp: number) => {
    const level = Math.floor(xp / XP_PER_LEVEL) + 1;
    return {
        level,
        xpForNextLevel: xp % XP_PER_LEVEL,
        xpToNextLevel: XP_PER_LEVEL,
        totalXpForCurrentLevel: (level - 1) * XP_PER_LEVEL,
    };
};

export const awardXpForTask = (student: Student): { updatedStudent: Student; newLevel: boolean } => {
    const oldLevel = calculateLevel(student.xp).level;
    const newXp = student.xp + XP_PER_TASK;
    const newLevel = calculateLevel(newXp).level;

    return {
        updatedStudent: { ...student, xp: newXp },
        newLevel: newLevel > oldLevel,
    };
};

// --- Badge System ---
export const checkAndAwardBadges = (student: Student, program: WeeklyProgram | null, tests: Test[]): { updatedStudent: Student, newBadges: Badge[] } => {
    const newBadges: Badge[] = [];
    const existingBadgeIds = (student.badges || []).map(b => b.id);

    // Badge b3: "Mükemmel Hafta" - Complete all tasks in a week
    if (program && !existingBadgeIds.includes('b3')) {
        const allTasks = (program.days || []).flatMap((d) => d.tasks || []);
        if (allTasks.length > 0 && allTasks.every((t: Task) => t.status === TaskStatus.Completed)) {
            const badge = ALL_BADGES.find(b => b.id === 'b3');
            if (badge) newBadges.push(badge);
        }
    }
    
    // Badge b2: "Test Uzmanı" - Complete 5 tests
    if (!existingBadgeIds.includes('b2')) {
        const completedStudentTests = tests.filter(t => t.studentId === student.id && t.completed);
        if (completedStudentTests.length >= 5) {
            const badge = ALL_BADGES.find(b => b.id === 'b2');
            if (badge) newBadges.push(badge);
        }
    }

    // Badge b4: "Fen Canavarı" - Get 90%+ on a Science test
    if (!existingBadgeIds.includes('b4')) {
        const highScoringScienceTest = tests.find(t => 
            t.studentId === student.id &&
            t.completed &&
            t.subject === Subject.Science &&
            (t.score ?? 0) >= 90
        );
        if (highScoringScienceTest) {
            const badge = ALL_BADGES.find(b => b.id === 'b4');
            if (badge) newBadges.push(badge);
        }
    }
    
    if (newBadges.length > 0) {
        return {
            updatedStudent: { ...student, badges: [...(student.badges || []), ...newBadges] },
            newBadges,
        };
    }
    return { updatedStudent: student, newBadges: [] };
};


// --- AI Motivation ---
// This is a mock function. In a real implementation, it would call the Gemini API.
export const getDailyMotivationMessage = async (student: Student): Promise<string> => {
    const messages = [
        "Harika ilerliyorsun! Bugün küçük bir adım daha at, başarın katlanacak!",
        "Dün çok iyiydin! Bugün hedefin %100 tamamlama olsun, sen bunu yaparsın!",
        "Unutma, her tamamladığın görev seni hedefine bir adım daha yaklaştırır. Devam et!",
        "Bugün yeni bir gün, yeni fırsatlar demek! Enerjini topla ve başla!",
    ];
    // In a real app, we would use AI to generate a message based on performance.
    // For this prototype, we'll pick one randomly.
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    return messages[Math.floor(Math.random() * messages.length)];
};
