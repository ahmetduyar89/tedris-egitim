import React, { useState, useEffect } from 'react';
import { User, Brain, BookOpen, Heart, Star, Save, Loader2, Sparkles } from 'lucide-react';
import {
  CoachingProfile,
  LearningStyle,
} from '../../types';
import {
  getCoachingProfile,
  upsertCoachingProfile,
  LEARNING_STYLE_LABELS,
  MULTIPLE_INTELLIGENCE_LABELS,
} from '../../services/coachingProfileService';

interface StudentCoachingProfileProps {
  studentId: string;
  tutorId: string;
  studentName: string;
  onClose?: () => void;
}

const StudentCoachingProfile: React.FC<StudentCoachingProfileProps> = ({
  studentId,
  tutorId,
  studentName,
  onClose,
}) => {
  const [profile, setProfile] = useState<Partial<CoachingProfile>>({
    studentId,
    tutorId,
    learningStyle: undefined,
    personalityType: '',
    studyHabits: { preferredTime: '', avgHours: 0, environment: '', breaks: '' },
    strengths: [],
    weaknesses: [],
    interests: [],
    motivationLevel: 5,
    multipleIntelligence: {},
    notes: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newStrength, setNewStrength] = useState('');
  const [newWeakness, setNewWeakness] = useState('');
  const [newInterest, setNewInterest] = useState('');

  useEffect(() => {
    loadProfile();
  }, [studentId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const existing = await getCoachingProfile(studentId);
      if (existing) {
        setProfile(existing);
      }
    } catch (err) {
      console.error('Profil yüklenirken hata:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await upsertCoachingProfile({
        studentId,
        tutorId,
        learningStyle: profile.learningStyle,
        personalityType: profile.personalityType,
        studyHabits: profile.studyHabits || {},
        strengths: profile.strengths || [],
        weaknesses: profile.weaknesses || [],
        interests: profile.interests || [],
        motivationLevel: profile.motivationLevel,
        multipleIntelligence: profile.multipleIntelligence || {},
        notes: profile.notes,
      });
      alert('Profil kaydedildi!');
    } catch (err) {
      console.error('Kaydetme hatası:', err);
      alert('Profil kaydedilirken hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  const addToList = (field: 'strengths' | 'weaknesses' | 'interests', value: string, setter: (v: string) => void) => {
    if (!value.trim()) return;
    setProfile(prev => ({
      ...prev,
      [field]: [...(prev[field] || []), value.trim()],
    }));
    setter('');
  };

  const removeFromList = (field: 'strengths' | 'weaknesses' | 'interests', index: number) => {
    setProfile(prev => ({
      ...prev,
      [field]: (prev[field] || []).filter((_, i) => i !== index),
    }));
  };

  const updateIntelligence = (key: string, value: number) => {
    setProfile(prev => ({
      ...prev,
      multipleIntelligence: { ...prev.multipleIntelligence, [key]: value },
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-3 text-gray-500">Profil yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <User className="w-8 h-8" />
            <div>
              <h2 className="text-xl font-bold">{studentName} - Koçluk Profili</h2>
              <p className="text-indigo-100 text-sm">Öğrenci envanter ve profil bilgileri</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Kaydet
            </button>
            {onClose && (
              <button onClick={onClose} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
                Kapat
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Öğrenme Stili */}
        <section>
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-indigo-500" />
            Öğrenme Stili
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(Object.entries(LEARNING_STYLE_LABELS) as [LearningStyle, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setProfile(prev => ({ ...prev, learningStyle: key }))}
                className={`p-3 rounded-lg border-2 text-center transition-all ${
                  profile.learningStyle === key
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
              >
                <div className="text-2xl mb-1">
                  {key === 'visual' ? '👁️' : key === 'auditory' ? '👂' : key === 'kinesthetic' ? '🤸' : '📖'}
                </div>
                <div className="text-sm font-medium">{label}</div>
              </button>
            ))}
          </div>
        </section>

        {/* Çalışma Alışkanlıkları */}
        <section>
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-green-500" />
            Çalışma Alışkanlıkları
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Tercih Ettiği Çalışma Saati</label>
              <select
                value={profile.studyHabits?.preferredTime || ''}
                onChange={e => setProfile(prev => ({
                  ...prev,
                  studyHabits: { ...prev.studyHabits, preferredTime: e.target.value },
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Seçiniz</option>
                <option value="morning">Sabah (06:00-12:00)</option>
                <option value="afternoon">Öğleden Sonra (12:00-18:00)</option>
                <option value="evening">Akşam (18:00-22:00)</option>
                <option value="night">Gece (22:00+)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Günlük Ortalama Çalışma (saat)</label>
              <input
                type="number"
                min="0"
                max="16"
                step="0.5"
                value={profile.studyHabits?.avgHours || ''}
                onChange={e => setProfile(prev => ({
                  ...prev,
                  studyHabits: { ...prev.studyHabits, avgHours: parseFloat(e.target.value) || 0 },
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Çalışma Ortamı</label>
              <select
                value={profile.studyHabits?.environment || ''}
                onChange={e => setProfile(prev => ({
                  ...prev,
                  studyHabits: { ...prev.studyHabits, environment: e.target.value },
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Seçiniz</option>
                <option value="quiet_room">Sessiz Oda</option>
                <option value="library">Kütüphane</option>
                <option value="with_music">Müzikle</option>
                <option value="group">Grup Çalışması</option>
                <option value="mixed">Karma</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Mola Tercihi</label>
              <select
                value={profile.studyHabits?.breaks || ''}
                onChange={e => setProfile(prev => ({
                  ...prev,
                  studyHabits: { ...prev.studyHabits, breaks: e.target.value },
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Seçiniz</option>
                <option value="pomodoro">Pomodoro (25dk çalış / 5dk mola)</option>
                <option value="long_sessions">Uzun Oturum (50dk / 10dk mola)</option>
                <option value="flexible">Esnek</option>
                <option value="rare">Nadiren mola</option>
              </select>
            </div>
          </div>
        </section>

        {/* Motivasyon Seviyesi */}
        <section>
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
            <Heart className="w-5 h-5 text-red-500" />
            Motivasyon Seviyesi
          </h3>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="1"
              max="10"
              value={profile.motivationLevel || 5}
              onChange={e => setProfile(prev => ({ ...prev, motivationLevel: parseInt(e.target.value) }))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <span className="text-2xl font-bold text-indigo-600 min-w-[3rem] text-center">
              {profile.motivationLevel || 5}/10
            </span>
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1 px-1">
            <span>Çok Düşük</span>
            <span>Orta</span>
            <span>Çok Yüksek</span>
          </div>
        </section>

        {/* Güçlü / Zayıf Yönler / İlgi Alanları */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Güçlü Yönler */}
          <section>
            <h3 className="text-sm font-semibold text-green-700 mb-3">Güçlü Yönler</h3>
            <div className="flex gap-2 mb-2">
              <input
                value={newStrength}
                onChange={e => setNewStrength(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addToList('strengths', newStrength, setNewStrength)}
                placeholder="Ekle..."
                className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
              <button
                onClick={() => addToList('strengths', newStrength, setNewStrength)}
                className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600"
              >+</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(profile.strengths || []).map((s, i) => (
                <span key={i} className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs flex items-center gap-1">
                  {s}
                  <button onClick={() => removeFromList('strengths', i)} className="hover:text-green-900">&times;</button>
                </span>
              ))}
            </div>
          </section>

          {/* Zayıf Yönler */}
          <section>
            <h3 className="text-sm font-semibold text-red-700 mb-3">Geliştirilmesi Gereken Yönler</h3>
            <div className="flex gap-2 mb-2">
              <input
                value={newWeakness}
                onChange={e => setNewWeakness(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addToList('weaknesses', newWeakness, setNewWeakness)}
                placeholder="Ekle..."
                className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              />
              <button
                onClick={() => addToList('weaknesses', newWeakness, setNewWeakness)}
                className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600"
              >+</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(profile.weaknesses || []).map((w, i) => (
                <span key={i} className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs flex items-center gap-1">
                  {w}
                  <button onClick={() => removeFromList('weaknesses', i)} className="hover:text-red-900">&times;</button>
                </span>
              ))}
            </div>
          </section>

          {/* İlgi Alanları */}
          <section>
            <h3 className="text-sm font-semibold text-blue-700 mb-3">İlgi Alanları</h3>
            <div className="flex gap-2 mb-2">
              <input
                value={newInterest}
                onChange={e => setNewInterest(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addToList('interests', newInterest, setNewInterest)}
                placeholder="Ekle..."
                className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => addToList('interests', newInterest, setNewInterest)}
                className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600"
              >+</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(profile.interests || []).map((int, i) => (
                <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs flex items-center gap-1">
                  {int}
                  <button onClick={() => removeFromList('interests', i)} className="hover:text-blue-900">&times;</button>
                </span>
              ))}
            </div>
          </section>
        </div>

        {/* Çoklu Zeka */}
        <section>
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            Çoklu Zeka Profili
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(MULTIPLE_INTELLIGENCE_LABELS).map(([key, label]) => (
              <div key={key} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-40">{label}</span>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={(profile.multipleIntelligence as any)?.[key] || 0}
                  onChange={e => updateIntelligence(key, parseInt(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                />
                <span className="text-sm font-medium text-gray-700 w-8 text-right">
                  {(profile.multipleIntelligence as any)?.[key] || 0}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Kişilik Tipi */}
        <section>
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-orange-500" />
            Kişilik Tipi & Notlar
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Kişilik Tipi</label>
              <input
                value={profile.personalityType || ''}
                onChange={e => setProfile(prev => ({ ...prev, personalityType: e.target.value }))}
                placeholder="Örn: İçe dönük, analitik, sabırlı..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Koç Notları</label>
              <textarea
                value={profile.notes || ''}
                onChange={e => setProfile(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Öğrenciyle ilgili genel gözlem ve notlar..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default StudentCoachingProfile;
