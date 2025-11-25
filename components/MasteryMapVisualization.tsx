import React, { useState, useEffect } from 'react';
import { knowledgeGraphService, StudentMastery } from '../services/knowledgeGraphService';
import { masteryScoreService } from '../services/masteryScoreService';
import { supabase } from '../services/supabase';

interface MasteryMapVisualizationProps {
  studentId: string;
  onModuleClick?: (mastery: StudentMastery) => void;
}

const MasteryMapVisualization: React.FC<MasteryMapVisualizationProps> = ({ studentId, onModuleClick }) => {
  const [masteryData, setMasteryData] = useState<StudentMastery[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMastery, setSelectedMastery] = useState<StudentMastery | null>(null);

  useEffect(() => {
    loadMasteryData();

    const channel = supabase
      .channel('mastery-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'student_mastery',
          filter: `student_id=eq.${studentId}`
        },
        async () => {
          console.log('Mastery data changed, reloading...');
          await loadMasteryData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [studentId]);

  const loadMasteryData = async () => {
    setIsLoading(true);
    try {
      const data = await knowledgeGraphService.getStudentMastery(studentId);
      const stats = await masteryScoreService.getMasteryStatistics(studentId);
      setMasteryData(data);
      setStatistics(stats);
    } catch (error) {
      console.error('Error loading mastery data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMasteryColor = (score: number): string => {
    if (score < 0.5) return '#F05039';
    if (score < 0.7) return '#F5C542';
    return '#10B981';
  };

  const getMasteryLabel = (score: number): string => {
    if (score < 0.5) return 'Zayıf';
    if (score < 0.7) return 'Gelişiyor';
    return 'Güçlü';
  };

  const groupByStatus = () => {
    const weak = masteryData.filter(m => m.masteryScore < 0.5);
    const progress = masteryData.filter(m => m.masteryScore >= 0.5 && m.masteryScore < 0.7);
    const mastered = masteryData.filter(m => m.masteryScore >= 0.7);

    return { weak, progress, mastered };
  };

  const { weak, progress, mastered } = groupByStatus();

  if (isLoading) {
    return (
      <div className="bg-card-background p-6 rounded-2xl shadow-lg">
        <div className="text-center p-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-text-secondary">Yeterlilik haritası yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (masteryData.length === 0) {
    return (
      <div className="bg-card-background p-6 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold font-poppins text-accent mb-4">📊 Yeterlilik Haritası</h2>
        <div className="text-center p-10 text-text-secondary">
          <p>Henüz yeterlilik verisi bulunmuyor.</p>
          <p className="text-sm mt-2">Bir test çözerek başlayabilirsiniz.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card-background p-6 rounded-2xl shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold font-poppins text-accent">📊 Yeterlilik Haritası (Knowledge Graph)</h2>
        {statistics && (
          <div className="text-sm text-text-secondary">
            <span className="font-semibold">Ortalama: </span>
            <span className={`font-bold ${statistics.averageScore >= 0.7 ? 'text-success' : statistics.averageScore >= 0.5 ? 'text-accent' : 'text-secondary'}`}>
              {Math.round(statistics.averageScore * 100)}%
            </span>
          </div>
        )}
      </div>

      {statistics && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-success/10 p-4 rounded-xl border-2 border-success/20">
            <div className="text-3xl font-bold text-success">{statistics.masteredCount}</div>
            <div className="text-sm text-text-secondary">Güçlü Konular</div>
          </div>
          <div className="bg-accent/10 p-4 rounded-xl border-2 border-accent/20">
            <div className="text-3xl font-bold text-accent">{statistics.progressCount}</div>
            <div className="text-sm text-text-secondary">Gelişen Konular</div>
          </div>
          <div className="bg-secondary/10 p-4 rounded-xl border-2 border-secondary/20">
            <div className="text-3xl font-bold text-secondary">{statistics.weakCount}</div>
            <div className="text-sm text-text-secondary">Zayıf Konular</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <h3 className="font-bold text-lg mb-4 text-secondary flex items-center">
            <span className="w-3 h-3 rounded-full bg-secondary mr-2"></span>
            Zayıf Konular ({weak.length})
          </h3>
          <div className="space-y-3">
            {weak.map((mastery) => (
              <div
                key={mastery.id}
                onClick={() => {
                  setSelectedMastery(mastery);
                  onModuleClick?.(mastery);
                }}
                className="bg-secondary/10 p-4 rounded-lg border-l-4 border-secondary cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-semibold text-text-primary">{mastery.module?.title}</div>
                    <div className="text-xs text-text-secondary mt-1">
                      Kod: {mastery.module?.code} | Deneme: {mastery.attemptsCount}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-secondary">
                      {Math.round(mastery.masteryScore * 100)}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {weak.length === 0 && (
              <div className="text-sm text-text-secondary italic text-center p-4">
                Harika! Zayıf konu yok.
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="font-bold text-lg mb-4 text-accent flex items-center">
            <span className="w-3 h-3 rounded-full bg-accent mr-2"></span>
            Gelişen Konular ({progress.length})
          </h3>
          <div className="space-y-3">
            {progress.map((mastery) => (
              <div
                key={mastery.id}
                onClick={() => {
                  setSelectedMastery(mastery);
                  onModuleClick?.(mastery);
                }}
                className="bg-accent/10 p-4 rounded-lg border-l-4 border-accent cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-semibold text-text-primary">{mastery.module?.title}</div>
                    <div className="text-xs text-text-secondary mt-1">
                      Kod: {mastery.module?.code} | Deneme: {mastery.attemptsCount}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-accent">
                      {Math.round(mastery.masteryScore * 100)}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {progress.length === 0 && (
              <div className="text-sm text-text-secondary italic text-center p-4">
                Bu kategoride konu yok
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="font-bold text-lg mb-4 text-success flex items-center">
            <span className="w-3 h-3 rounded-full bg-success mr-2"></span>
            Güçlü Konular ({mastered.length})
          </h3>
          <div className="space-y-3">
            {mastered.map((mastery) => (
              <div
                key={mastery.id}
                onClick={() => {
                  setSelectedMastery(mastery);
                  onModuleClick?.(mastery);
                }}
                className="bg-success/10 p-4 rounded-lg border-l-4 border-success cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-semibold text-text-primary">{mastery.module?.title}</div>
                    <div className="text-xs text-text-secondary mt-1">
                      Kod: {mastery.module?.code} | Deneme: {mastery.attemptsCount}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-success">
                      {Math.round(mastery.masteryScore * 100)}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {mastered.length === 0 && (
              <div className="text-sm text-text-secondary italic text-center p-4">
                Henüz güçlü konu yok
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedMastery && (
        <div className="mt-6 bg-primary/5 p-4 rounded-xl border border-primary/20">
          <h4 className="font-bold text-primary mb-2">Seçili Modül: {selectedMastery.module?.title}</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-text-secondary">Yeterlilik Puanı:</span>
              <span className="ml-2 font-semibold">{Math.round(selectedMastery.masteryScore * 100)}%</span>
            </div>
            <div>
              <span className="text-text-secondary">Güven Seviyesi:</span>
              <span className="ml-2 font-semibold">{Math.round(selectedMastery.confidenceLevel * 100)}%</span>
            </div>
            <div>
              <span className="text-text-secondary">Deneme Sayısı:</span>
              <span className="ml-2 font-semibold">{selectedMastery.attemptsCount}</span>
            </div>
            <div>
              <span className="text-text-secondary">Zorluk:</span>
              <span className="ml-2 font-semibold">{selectedMastery.module?.difficultyLevel}/5</span>
            </div>
          </div>
          {selectedMastery.module?.description && (
            <p className="text-xs text-text-secondary mt-3 italic">{selectedMastery.module.description}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default MasteryMapVisualization;
