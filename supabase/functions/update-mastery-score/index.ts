import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface UpdateMasteryRequest {
  studentId: string;
  testId?: string;
  topicScores: Array<{
    topicName: string;
    correct: number;
    wrong: number;
  }>;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { studentId, testId, topicScores }: UpdateMasteryRequest = body;

    if (!studentId || !topicScores || !Array.isArray(topicScores)) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: studentId, topicScores' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Updating mastery scores:', { studentId, topicCount: topicScores.length });

    const updatedModules: any[] = [];
    const errors: any[] = [];

    for (const topicScore of topicScores) {
      try {
        const { topicName, correct, wrong } = topicScore;
        const totalQuestions = correct + wrong;

        if (totalQuestions === 0) {
          console.warn('Skipping topic with 0 questions:', topicName);
          continue;
        }

        // Topic'i kg_modules'te bul
        const { data: module, error: moduleError } = await supabaseClient
          .from('kg_modules')
          .select('id, code, title')
          .ilike('title', topicName)
          .maybeSingle();

        if (moduleError) {
          console.error('Module fetch error:', moduleError);
          errors.push({ topic: topicName, error: moduleError.message });
          continue;
        }

        if (!module) {
          console.warn('Module not found for topic:', topicName);
          errors.push({ topic: topicName, error: 'Module not found' });
          continue;
        }

        // Yeni mastery score hesapla
        const newScore = Math.round((correct / totalQuestions) * 100) / 100;

        // Mevcut mastery kaydını al
        const { data: existingMastery } = await supabaseClient
          .from('student_mastery')
          .select('*')
          .eq('student_id', studentId)
          .eq('module_id', module.id)
          .maybeSingle();

        let finalScore = newScore;
        let previousScore = 0;
        let newAttemptsCount = 1;

        if (existingMastery) {
          // Ağırlıklı ortalama hesapla
          previousScore = existingMastery.mastery_score || 0;
          newAttemptsCount = (existingMastery.attempts_count || 0) + 1;
          finalScore = Math.round(
            ((previousScore * (newAttemptsCount - 1)) + newScore) / newAttemptsCount * 100
          ) / 100;
        }

        // student_mastery güncelle veya oluştur
        const { data: updatedMastery, error: masteryError } = await supabaseClient
          .from('student_mastery')
          .upsert({
            student_id: studentId,
            module_id: module.id,
            mastery_score: finalScore,
            confidence_level: finalScore,
            attempts_count: newAttemptsCount,
            last_practiced_at: new Date().toISOString(),
            first_practiced_at: existingMastery?.first_practiced_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'student_id,module_id',
          })
          .select()
          .maybeSingle();

        if (masteryError) {
          console.error('Mastery update error:', masteryError);
          errors.push({ topic: topicName, error: masteryError.message });
          continue;
        }

        // mastery_history'ye kaydet
        await supabaseClient
          .from('mastery_history')
          .insert({
            student_id: studentId,
            module_id: module.id,
            mastery_score: finalScore,
            change_reason: 'test_completed',
            previous_score: previousScore,
            test_id: testId || null,
            recorded_at: new Date().toISOString(),
          });

        updatedModules.push({
          moduleId: module.id,
          moduleCode: module.code,
          moduleName: module.title,
          previousScore: previousScore,
          newScore: finalScore,
          attemptsCount: newAttemptsCount,
        });

        console.log('Updated mastery:', { moduleName: module.title, score: finalScore });
      } catch (topicError) {
        console.error('Error processing topic:', topicScore.topicName, topicError);
        errors.push({ topic: topicScore.topicName, error: String(topicError) });
      }
    }

    // Zayıf modülleri kontrol et ve risk alarmı oluştur
    const { data: weakModules } = await supabaseClient
      .from('student_mastery')
      .select('*, kg_modules(code, title)')
      .eq('student_id', studentId)
      .lt('mastery_score', 0.5)
      .gte('attempts_count', 3);

    if (weakModules && weakModules.length > 0) {
      console.log('Risk alarm triggered:', { studentId, weakModulesCount: weakModules.length });
      
      // Öğrencinin tutor'ünü bul
      const { data: student } = await supabaseClient
        .from('students')
        .select('tutor_id, name')
        .eq('id', studentId)
        .maybeSingle();

      if (student?.tutor_id) {
        const weakModuleNames = weakModules
          .map((m: any) => m.kg_modules?.title || 'Bilinmeyen Modül')
          .join(', ');

        await supabaseClient
          .from('notifications')
          .insert({
            recipient_id: student.tutor_id,
            message: `⚠️ UYARI: ${student.name} - Şu konularda 3+ denemeden sonra hala düşük performans: ${weakModuleNames}. Birebir müdahale gerekebilir.`,
            read: false,
            timestamp: new Date().toISOString(),
            entity_type: 'student_risk',
            entity_id: studentId,
          });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        updatedModules,
        errors: errors.length > 0 ? errors : undefined,
        riskAlertTriggered: weakModules && weakModules.length > 0,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Unexpected error in update-mastery-score:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});