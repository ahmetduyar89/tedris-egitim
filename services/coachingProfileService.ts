import { supabase } from './dbAdapter';
import { CoachingProfile, LearningStyle } from '../types';

// ==================== Mapping ====================

function mapFromDB(data: any): CoachingProfile {
  return {
    id: data.id,
    studentId: data.student_id,
    tutorId: data.tutor_id,
    learningStyle: data.learning_style,
    personalityType: data.personality_type,
    studyHabits: data.study_habits || {},
    strengths: data.strengths || [],
    weaknesses: data.weaknesses || [],
    interests: data.interests || [],
    motivationLevel: data.motivation_level,
    multipleIntelligence: data.multiple_intelligence || {},
    notes: data.notes,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

function mapToDB(profile: Partial<CoachingProfile>) {
  const mapped: any = {};
  if (profile.studentId !== undefined) mapped.student_id = profile.studentId;
  if (profile.tutorId !== undefined) mapped.tutor_id = profile.tutorId;
  if (profile.learningStyle !== undefined) mapped.learning_style = profile.learningStyle;
  if (profile.personalityType !== undefined) mapped.personality_type = profile.personalityType;
  if (profile.studyHabits !== undefined) mapped.study_habits = profile.studyHabits;
  if (profile.strengths !== undefined) mapped.strengths = profile.strengths;
  if (profile.weaknesses !== undefined) mapped.weaknesses = profile.weaknesses;
  if (profile.interests !== undefined) mapped.interests = profile.interests;
  if (profile.motivationLevel !== undefined) mapped.motivation_level = profile.motivationLevel;
  if (profile.multipleIntelligence !== undefined) mapped.multiple_intelligence = profile.multipleIntelligence;
  if (profile.notes !== undefined) mapped.notes = profile.notes;
  return mapped;
}

// ==================== CRUD ====================

export async function getCoachingProfile(studentId: string): Promise<CoachingProfile | null> {
  const { data, error } = await supabase
    .from('coaching_profiles')
    .select('*')
    .eq('student_id', studentId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  if (!data) return null;
  return mapFromDB(data);
}

export async function createCoachingProfile(profile: Omit<CoachingProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<CoachingProfile> {
  const dbData = mapToDB(profile);
  const { data, error } = await supabase
    .from('coaching_profiles')
    .insert([dbData])
    .select()
    .single();

  if (error) throw error;
  return mapFromDB(data);
}

export async function updateCoachingProfile(studentId: string, updates: Partial<CoachingProfile>): Promise<CoachingProfile> {
  const dbData = {
    ...mapToDB(updates),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('coaching_profiles')
    .update(dbData)
    .eq('student_id', studentId)
    .select()
    .single();

  if (error) throw error;
  return mapFromDB(data);
}

export async function upsertCoachingProfile(profile: Omit<CoachingProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<CoachingProfile> {
  const existing = await getCoachingProfile(profile.studentId);
  if (existing) {
    return updateCoachingProfile(profile.studentId, profile);
  }
  return createCoachingProfile(profile);
}

export async function getCoachingProfilesByTutor(tutorId: string): Promise<CoachingProfile[]> {
  const { data, error } = await supabase
    .from('coaching_profiles')
    .select('*')
    .eq('tutor_id', tutorId)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapFromDB);
}

export async function deleteCoachingProfile(studentId: string): Promise<void> {
  const { error } = await supabase
    .from('coaching_profiles')
    .delete()
    .eq('student_id', studentId);

  if (error) throw error;
}

// ==================== Learning Style Helpers ====================

export const LEARNING_STYLE_LABELS: Record<LearningStyle, string> = {
  visual: 'Görsel',
  auditory: 'İşitsel',
  kinesthetic: 'Kinestetik',
  reading_writing: 'Okuma-Yazma',
};

export const MULTIPLE_INTELLIGENCE_LABELS: Record<string, string> = {
  linguistic: 'Sözel-Dilsel',
  logical: 'Mantıksal-Matematiksel',
  spatial: 'Görsel-Uzamsal',
  musical: 'Müzikal-Ritmik',
  bodily: 'Bedensel-Kinestetik',
  interpersonal: 'Kişilerarası',
  intrapersonal: 'İçsel',
  naturalistic: 'Doğacı',
};
