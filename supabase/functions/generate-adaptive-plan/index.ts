import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface GeneratePlanRequest {
  studentId: string;
  triggerReason: 'initial_diagnosis' | 'test_failed' | 'milestone_reached' | 'manual_trigger' | 'scheduled';
  planDurationDays?: number;
}

interface ModuleWithMastery {
  id: string;
  code: string;
  title: string;
  mastery_score: number;
  attempts_count: number;
}

interface PrerequisiteModule {
  id: string;
  code: string;
  title: string;
  relationship_type: string;
  strength: number;
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

    const { studentId, triggerReason, planDurationDays = 7 }: GeneratePlanRequest = body;

    if (!studentId || !triggerReason) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: studentId, triggerReason' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Generating adaptive plan:', { studentId, triggerReason, planDurationDays });

    const { data: weakModules, error: weakError } = await supabaseClient
      .from('student_mastery')
      .select(`
        id,
        mastery_score,
        attempts_count,
        kg_modules (
          id,
          code,
          title,
          subject,
          grade,
          difficulty_level
        )
      `)
      .eq('student_id', studentId)
      .lt('mastery_score', 0.7)
      .order('mastery_score', { ascending: true });

    if (weakError) {
      console.error('Failed to fetch weak modules:', weakError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch student mastery data' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const effectiveWeakModules = [...(weakModules || [])];

    // --- NEW LOGIC START: Integrate Exam Results & Grade Level ---
    try {
      const { data: studentData } = await supabaseClient
        .from('students')
        .select('grade')
        .eq('id', studentId)
        .single();

      const studentGrade = studentData?.grade;

      if (studentGrade) {
        const { data: failedTests } = await supabaseClient
          .from('tests')
          .select('subject, unit')
          .eq('student_id', studentId)
          .lt('score', 70);

        if (failedTests && failedTests.length > 0) {
          // Deduplicate subject+unit pairs
          const uniqueUnits = new Set(failedTests.map((t: any) => `${t.subject}|${t.unit}`));

          for (const key of uniqueUnits) {
            const [subj, unit] = (key as string).split('|');

            // Find modules that match this failed test unit + student grade
            const { data: testModules } = await supabaseClient
              .from('kg_modules')
              .select('id, code, title, subject, grade, difficulty_level')
              .eq('subject', subj)
              .eq('unit', unit)
              .eq('grade', studentGrade)
              .limit(3); // Grab top 3 modules for this unit

            if (testModules) {
              for (const tm of testModules) {
                // Avoid duplicates if already in mastery list
                if (!effectiveWeakModules.find(wm => wm.kg_modules && wm.kg_modules.id === tm.id)) {
                  effectiveWeakModules.push({
                    id: `synthetic-test-${tm.id}`,
                    mastery_score: 0.3, // Assign low mastery for failed test topics
                    attempts_count: 1,
                    kg_modules: tm
                  });
                }
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('Error integrating test results:', err);
      // Continue without test results if this fails
    }
    // --- NEW LOGIC END ---

    if (effectiveWeakModules.length === 0) {
      console.log('No weak modules found for student:', studentId);
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No weak modules found. Student is performing well!',
          planCreated: false,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Found weak modules (including tests):', effectiveWeakModules.length);

    const rootCauseModules: Set<string> = new Set();
    const moduleAnalysis: any[] = [];

    for (const weakModule of effectiveWeakModules) {
      const module = weakModule.kg_modules;
      if (!module) continue;

      const { data: prerequisites } = await supabaseClient
        .from('kg_prerequisites')
        .select(`
          prerequisite_module_id,
          relationship_type,
          strength,
          kg_modules!kg_prerequisites_prerequisite_module_id_fkey (
            id,
            code,
            title
          )
        `)
        .eq('module_id', module.id)
        .eq('relationship_type', 'CRITICAL');

      if (prerequisites && prerequisites.length > 0) {
        for (const prereq of prerequisites) {
          const prereqModule = prereq.kg_modules;
          if (prereqModule) {
            rootCauseModules.add(prereqModule.id);
            moduleAnalysis.push({
              weakModule: module.title,
              weakModuleScore: weakModule.mastery_score,
              rootCause: prereqModule.title,
              rootCauseId: prereqModule.id,
            });
          }
        }
      } else {
        rootCauseModules.add(module.id);
        moduleAnalysis.push({
          weakModule: module.title,
          weakModuleScore: weakModule.mastery_score,
          rootCause: module.title + ' (kendisi)',
          rootCauseId: module.id,
        });
      }
    }

    console.log('Root cause modules identified:', rootCauseModules.size);

    const planTasks: any[] = [];
    let currentDate = new Date();
    let priority = 1;

    for (const rootModuleId of Array.from(rootCauseModules).slice(0, 5)) {
      const { data: contents } = await supabaseClient
        .from('kg_content')
        .select('*')
        .eq('module_id', rootModuleId)
        .order('difficulty_level', { ascending: true })
        .limit(3);

      if (contents && contents.length > 0) {
        for (const content of contents) {
          planTasks.push({
            student_id: studentId,
            module_id: rootModuleId,
            content_id: content.id,
            planned_date: currentDate.toISOString().split('T')[0],
            priority: priority++,
            task_type: content.content_type === 'quiz' ? 'assessment' :
              content.content_type === 'video' ? 'learning' : 'practice',
            status: 'pending',
            ai_generated: true,
            notes: `AI tarafından oluşturuldu - Kök neden analizi`,
            created_at: new Date().toISOString(),
          });

          if (priority % 2 === 0) {
            currentDate.setDate(currentDate.getDate() + 1);
          }
        }
      } else {
        console.warn('No content found for module:', rootModuleId);
      }
    }

    await supabaseClient
      .from('tedris_plan')
      .delete()
      .eq('student_id', studentId)
      .eq('status', 'pending');

    if (planTasks.length > 0) {
      const { data: insertedTasks, error: insertError } = await supabaseClient
        .from('tedris_plan')
        .insert(planTasks)
        .select();

      if (insertError) {
        console.error('Failed to insert plan tasks:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to create plan tasks' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      console.log('Plan tasks created:', insertedTasks?.length || 0);
    }

    await supabaseClient
      .from('adaptive_plan_logs')
      .insert({
        student_id: studentId,
        trigger_reason: triggerReason,
        weak_modules: moduleAnalysis,
        recommended_modules: Array.from(rootCauseModules),
        plan_duration_days: planDurationDays,
        created_at: new Date().toISOString(),
      });

    try {
      await supabaseClient
        .from('notifications')
        .insert({
          recipient_id: user.id,
          message: `🎯 Senin için yeni bir öğrenme planı oluşturuldu! ${planTasks.length} görev seni bekliyor.`,
          read: false,
          timestamp: new Date().toISOString(),
          entity_type: 'adaptive_plan',
          entity_id: studentId,
        });
    } catch (notifError) {
      console.error('Failed to send notification (non-critical):', notifError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        planCreated: true,
        tasksCount: planTasks.length,
        weakModulesCount: weakModules.length,
        rootCausesCount: rootCauseModules.size,
        moduleAnalysis,
        message: `${planTasks.length} görevli adaptif plan oluşturuldu`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Unexpected error in generate-adaptive-plan:', error);

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
