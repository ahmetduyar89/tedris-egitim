import { supabase } from './supabase';
import { Badge, Student } from '../types';

export const LEVELS = [
    { level: 1, minXp: 0, title: 'Çırak' },
    { level: 2, minXp: 100, title: 'Keşifçi' },
    { level: 3, minXp: 300, title: 'Bilgin' },
    { level: 4, minXp: 600, title: 'Usta' },
    { level: 5, minXp: 1000, title: 'Üstat' },
    { level: 6, minXp: 1500, title: 'Efsane' },
];

export const BADGES: Badge[] = [
    { id: 'first_login', title: 'İlk Adım', icon: '🚀', description: 'Platforma ilk kez giriş yaptın.' },
    { id: 'first_test', title: 'Cesur Yürek', icon: '📝', description: 'İlk testini tamamladın.' },
    { id: 'perfect_score', title: 'Mükemmeliyetçi', icon: '💯', description: 'Bir testten 100 tam puan aldın.' },
    { id: 'streak_3', title: 'İstikrarlı', icon: '🔥', description: '3 gün üst üste çalıştın.' },
    { id: 'streak_7', title: 'Durdurulamaz', icon: '⚡', description: '7 gün üst üste çalıştın.' },
];

export const GamificationService = {
    async addXp(studentId: string, amount: number): Promise<{ newLevel: number | null, newXp: number }> {
        const { data: student, error } = await supabase
            .from('students')
            .select('xp, level')
            .eq('id', studentId)
            .single();

        if (error || !student) throw new Error('Student not found');

        const newXp = (student.xp || 0) + amount;
        let newLevel = student.level;

        // Check for level up
        const nextLevel = LEVELS.find(l => l.minXp > newXp);
        const calculatedLevel = nextLevel ? nextLevel.level - 1 : LEVELS[LEVELS.length - 1].level;

        if (calculatedLevel > student.level) {
            newLevel = calculatedLevel;
        }

        await supabase
            .from('students')
            .update({ xp: newXp, level: newLevel })
            .eq('id', studentId);

        return {
            newLevel: newLevel > student.level ? newLevel : null,
            newXp
        };
    },

    async checkBadges(studentId: string, event: 'login' | 'test_completed' | 'perfect_score'): Promise<Badge | null> {
        // Fetch current badges
        const { data: student } = await supabase
            .from('students')
            .select('badges')
            .eq('id', studentId)
            .single();

        const currentBadges = (student?.badges || []) as Badge[];
        const currentBadgeIds = currentBadges.map(b => b.id);

        let earnedBadge: Badge | null = null;

        if (event === 'login' && !currentBadgeIds.includes('first_login')) {
            earnedBadge = BADGES.find(b => b.id === 'first_login')!;
        } else if (event === 'test_completed' && !currentBadgeIds.includes('first_test')) {
            earnedBadge = BADGES.find(b => b.id === 'first_test')!;
        } else if (event === 'perfect_score' && !currentBadgeIds.includes('perfect_score')) {
            earnedBadge = BADGES.find(b => b.id === 'perfect_score')!;
        }

        if (earnedBadge) {
            const newBadges = [...currentBadges, earnedBadge];
            await supabase
                .from('students')
                .update({ badges: newBadges })
                .eq('id', studentId);
            return earnedBadge;
        }

        return null;
    },

    getLevelInfo(xp: number) {
        const currentLevelIndex = LEVELS.findIndex(l => l.minXp > xp) - 1;
        const levelIndex = currentLevelIndex >= 0 ? currentLevelIndex : LEVELS.length - 1;
        const currentLevel = LEVELS[levelIndex];
        const nextLevel = LEVELS[levelIndex + 1];

        return {
            currentLevel,
            nextLevel,
            progress: nextLevel ? ((xp - currentLevel.minXp) / (nextLevel.minXp - currentLevel.minXp)) * 100 : 100
        };
    }
};
