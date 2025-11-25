import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface SubmitTestRequest {
  assignmentId: string;
  answers: Array<{
    questionId: string;
    selectedAnswer: string;
  }>;
}

interface Question {
  id: string;
  question: string;
  options?: string[];
  correct_answer: string;
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
      console.error('Auth error:', authError);
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

    const { assignmentId, answers }: SubmitTestRequest = body;

    if (!assignmentId || !answers || !Array.isArray(answers)) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: assignmentId, answers' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Processing test submission:', { assignmentId, userId: user.id, answerCount: answers.length });

    const { data: assignment, error: assignmentError } = await supabaseClient
      .from('question_bank_assignments')
      .select('*, question_banks(*)')
      .eq('id', assignmentId)
      .eq('student_id', user.id)
      .maybeSingle();

    if (assignmentError) {
      console.error('Assignment fetch error:', assignmentError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch assignment', details: assignmentError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!assignment) {
      console.error('Assignment not found:', assignmentId);
      return new Response(
        JSON.stringify({ error: 'Assignment not found or access denied' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (assignment.status === 'Tamamlandı' || assignment.completed_at) {
      console.warn('Test already completed:', assignmentId);
      return new Response(
        JSON.stringify({ error: 'Test already completed' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const questionBank = assignment.question_banks;
    
    if (!questionBank || !questionBank.questions || !Array.isArray(questionBank.questions)) {
      console.error('Question bank or questions not found:', { questionBankExists: !!questionBank });
      return new Response(
        JSON.stringify({ error: 'Question bank or questions not found' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const questions: Question[] = questionBank.questions;
    const totalQuestions = questionBank.total_questions || questions.length;

    console.log('Processing questions:', { totalQuestions, receivedAnswers: answers.length });

    let correctCount = 0;
    const detailedAnswers: Array<{
      questionId: string;
      questionText: string;
      selectedAnswer: string;
      correctAnswer: string;
      isCorrect: boolean;
    }> = [];

    for (const answer of answers) {
      if (!answer || !answer.questionId) {
        console.warn('Invalid answer object:', answer);
        continue;
      }

      const question = questions.find((q: Question) => q && q.id === answer.questionId);
      
      if (question) {
        const safeStudentAnswer = String(answer.selectedAnswer || '').trim().toLowerCase();
        const safeCorrectAnswer = String(question.correct_answer || '').trim().toLowerCase();
        const safeQuestionText = String(question.question || 'Soru metni bulunamadı');
        
        const isCorrect = safeStudentAnswer === safeCorrectAnswer;
        
        if (isCorrect) {
          correctCount++;
        }

        detailedAnswers.push({
          questionId: answer.questionId,
          questionText: safeQuestionText,
          selectedAnswer: String(answer.selectedAnswer || ''),
          correctAnswer: String(question.correct_answer || ''),
          isCorrect,
        });
      } else {
        console.warn('Question not found:', answer.questionId);
        detailedAnswers.push({
          questionId: answer.questionId,
          questionText: 'Soru bulunamadı',
          selectedAnswer: String(answer.selectedAnswer || ''),
          correctAnswer: '',
          isCorrect: false,
        });
      }
    }

    const score = totalQuestions > 0
      ? Math.round((correctCount / totalQuestions) * 100 * 100) / 100
      : 0;

    console.log('Score calculated:', {
      score,
      correctCount,
      totalQuestions,
      formula: `(${correctCount} / ${totalQuestions}) * 100 = ${score}`,
      percentage: totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0
    });

    const { data: updatedAssignment, error: updateError } = await supabaseClient
      .from('question_bank_assignments')
      .update({
        answers: detailedAnswers,
        score: score,
        total_correct: correctCount,
        total_questions: totalQuestions,
        status: 'Tamamlandı',
        completed_at: new Date().toISOString(),
      })
      .eq('id', assignmentId)
      .select()
      .maybeSingle();

    if (updateError) {
      console.error('Database update error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update assignment', details: updateError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!updatedAssignment) {
      console.error('No assignment returned after update');
      return new Response(
        JSON.stringify({ error: 'Failed to update assignment' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Assignment updated successfully:', assignmentId);

    const updatedModules: any[] = [];

    try {
      const testTopic = String(questionBank.topic || '').trim();
      const testSubject = String(questionBank.subject || '').trim();
      const testUnit = String(questionBank.unit || '').trim();

      console.log('Analyzing test topics:', { testTopic, testSubject, testUnit });

      const topicScoreMap = new Map<string, { correct: number; wrong: number; questions: number }>();

      for (const answerDetail of detailedAnswers) {
        const question = questions.find((q: Question) => q.id === answerDetail.questionId);

        if (question) {
          const questionTopic = question.topic || testTopic || testUnit;

          if (questionTopic) {
            if (!topicScoreMap.has(questionTopic)) {
              topicScoreMap.set(questionTopic, { correct: 0, wrong: 0, questions: 0 });
            }

            const stats = topicScoreMap.get(questionTopic)!;
            stats.questions++;

            if (answerDetail.isCorrect) {
              stats.correct++;
            } else {
              stats.wrong++;
            }
          }
        }
      }

      if (topicScoreMap.size === 0 && testTopic) {
        topicScoreMap.set(testTopic, {
          correct: correctCount,
          wrong: totalQuestions - correctCount,
          questions: totalQuestions
        });
      }

      console.log('Topic score breakdown:', Array.from(topicScoreMap.entries()));

      for (const [topicName, stats] of topicScoreMap.entries()) {
        try {
          if (stats.questions === 0) continue;

          console.log(`🔍 Module eşleştirme: ${topicName}`, {
            questions: stats.questions,
            correct: stats.correct,
            wrong: stats.wrong,
            testSubject
          });

          const { data: modules } = await supabaseClient
            .from('kg_modules')
            .select('id, code, title, subject, unit')
            .or(`title.ilike.%${topicName}%,unit.ilike.%${topicName}%,subject.ilike.%${testSubject}%`)
            .limit(10);

          let matchedModule = null;

          if (modules && modules.length > 0) {
            const topicLower = topicName.toLowerCase();
            const subjectLower = testSubject.toLowerCase();
            const unitLower = testUnit.toLowerCase();

            matchedModule = modules.find(m => {
              const titleLower = m.title?.toLowerCase() || '';
              const mSubjectLower = m.subject?.toLowerCase() || '';
              const mUnitLower = m.unit?.toLowerCase() || '';

              return (
                (mSubjectLower === subjectLower && titleLower === topicLower) ||
                (mSubjectLower === subjectLower && mUnitLower === unitLower) ||
                (mSubjectLower === subjectLower && titleLower.includes(topicLower)) ||
                (mSubjectLower === subjectLower && topicLower.includes(titleLower))
              );
            });

            if (!matchedModule) {
              matchedModule = modules.find(m =>
                m.subject?.toLowerCase() === subjectLower
              );
            }

            if (!matchedModule) {
              matchedModule = modules[0];
            }
          }

          if (!matchedModule) {
            console.warn('No module found for topic, creating fallback record:', {
              topicName,
              testSubject,
              testUnit,
              availableModulesCount: modules?.length || 0
            });

            try {
              const { data: newModule, error: createError } = await supabaseClient
                .from('kg_modules')
                .insert({
                  code: `AUTO_${Date.now()}`,
                  title: topicName,
                  subject: testSubject,
                  unit: testUnit || topicName,
                  grade: questionBank.grade || 0,
                  difficulty_level: questionBank.difficulty_level || 3,
                  description: `Auto-generated module from question bank: ${questionBank.title}`
                })
                .select()
                .maybeSingle();

              if (createError) {
                console.error('Failed to create fallback module:', createError);
                continue;
              }

              matchedModule = newModule;
              console.log('Created fallback module:', matchedModule);
            } catch (createModuleError) {
              console.error('Error creating fallback module:', createModuleError);
              continue;
            }
          }

          const performanceScore = stats.correct / stats.questions;
          const confidenceLevel = performanceScore >= 0.7 ?
            Math.min(0.95, performanceScore + 0.1) :
            Math.max(0.3, performanceScore - 0.1);

          const { data: existingMastery } = await supabaseClient
            .from('student_mastery')
            .select('*')
            .eq('student_id', user.id)
            .eq('module_id', matchedModule.id)
            .maybeSingle();

          let newScore = performanceScore;
          let previousScore = 0;
          let newAttempts = 1;

          if (existingMastery) {
            previousScore = existingMastery.mastery_score || 0;
            newAttempts = (existingMastery.attempts_count || 0) + 1;
            newScore = ((previousScore * (newAttempts - 1)) + performanceScore) / newAttempts;
          }

          await supabaseClient
            .from('student_mastery')
            .upsert({
              student_id: user.id,
              module_id: matchedModule.id,
              mastery_score: newScore,
              confidence_level: confidenceLevel,
              attempts_count: newAttempts,
              last_practiced_at: new Date().toISOString(),
              first_practiced_at: existingMastery?.first_practiced_at || new Date().toISOString(),
              streak_days: existingMastery?.streak_days || 0,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'student_id,module_id',
            });

          await supabaseClient
            .from('mastery_history')
            .insert({
              student_id: user.id,
              module_id: matchedModule.id,
              mastery_score: newScore,
              change_reason: 'test_completed',
              previous_score: previousScore,
              test_id: assignmentId,
              recorded_at: new Date().toISOString(),
            });

          updatedModules.push({
            moduleId: matchedModule.id,
            moduleCode: matchedModule.code,
            moduleName: matchedModule.title,
            topicName: topicName,
            previousScore: Math.round(previousScore * 100),
            newScore: Math.round(newScore * 100),
            attemptsCount: newAttempts,
            questionsInTest: stats.questions,
            correctInTest: stats.correct
          });

          console.log('✅ Mastery updated:', {
            module: matchedModule.title,
            topic: topicName,
            previousScore: Math.round(previousScore * 100),
            newScore: Math.round(newScore * 100),
            attempts: newAttempts,
            questionsInTest: stats.questions,
            correctInTest: stats.correct
          });
        } catch (topicError) {
          console.error('Error processing topic:', topicName, topicError);
        }
      }

      if (updatedModules.length > 0) {
        const weakModules = updatedModules.filter(m => m.newScore < 50);

        if (weakModules.length > 0) {
          console.log('Weak performance detected:', weakModules.length, 'modules');

          try {
            await supabaseClient
              .from('notifications')
              .insert({
                recipient_id: user.id,
                message: `📊 Test sonuçlarına göre ${weakModules.length} konuda ekstra çalışma öneriliyor. Öğrenme Haritası'nı kontrol et!`,
                read: false,
                timestamp: new Date().toISOString(),
                entity_type: 'mastery_update',
                entity_id: assignmentId,
              });
          } catch (notifError) {
            console.error('Failed to send student notification:', notifError);
          }

          if (weakModules.length >= 2) {
            console.log('Auto-triggering adaptive plan generation due to weak performance');

            try {
              const { data: pendingTasks } = await supabaseClient
                .from('tedris_plan')
                .select('id')
                .eq('student_id', user.id)
                .eq('status', 'pending')
                .limit(1);

              if (!pendingTasks || pendingTasks.length === 0) {
                console.log('No pending tasks, generating new adaptive plan...');

                const generatePlanUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-adaptive-plan`;

                const planResponse = await fetch(generatePlanUrl, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    studentId: user.id,
                    triggerReason: 'test_failed',
                    planDurationDays: 7
                  })
                });

                if (planResponse.ok) {
                  const planResult = await planResponse.json();
                  console.log('Adaptive plan auto-generated:', planResult);
                } else {
                  console.error('Failed to auto-generate plan:', await planResponse.text());
                }
              } else {
                console.log('Pending tasks exist, skipping auto-generation');
              }
            } catch (planError) {
              console.error('Failed to auto-trigger adaptive plan:', planError);
            }
          }
        }
      }

      console.log('Mastery update complete:', updatedModules.length, 'modules updated');

      if (updatedModules.length > 0) {
        try {
          const moduleIds = updatedModules.map(m => m.moduleId);
          const performanceBreakdown: Record<string, any> = {};

          updatedModules.forEach(mod => {
            performanceBreakdown[mod.moduleId] = {
              moduleName: mod.moduleName,
              topicName: mod.topicName,
              correct: mod.correctInTest,
              questions: mod.questionsInTest,
              percentage: Math.round((mod.correctInTest / mod.questionsInTest) * 100),
              masteryScore: mod.newScore,
              previousScore: mod.previousScore,
              attempts: mod.attemptsCount
            };
          });

          await supabaseClient
            .from('question_bank_assignments')
            .update({
              tested_module_ids: moduleIds,
              performance_breakdown: performanceBreakdown,
              mastery_updated: true
            })
            .eq('id', assignmentId);

          console.log('✅ Assignment metadata güncellendi:', {
            moduleCount: updatedModules.length,
            breakdownKeys: Object.keys(performanceBreakdown).length
          });
        } catch (metadataError) {
          console.error('Failed to update assignment metadata:', metadataError);
        }
      }
    } catch (masteryError) {
      console.error('Failed to update mastery scores:', masteryError);
    }

    try {
      const userEmail = String(user.email || 'Bilinmeyen kullanıcı');
      const testTitle = String(questionBank.title || 'Test').trim() || 'Test';
      
      await supabaseClient
        .from('notifications')
        .insert([{
          recipient_id: assignment.teacher_id,
          message: `${userEmail} "${testTitle}" testini tamamladı. Puan: ${score}`,
          read: false,
          timestamp: new Date().toISOString(),
          entity_type: 'question_bank_assignment',
          entity_id: assignmentId,
        }]);
      
      console.log('Notification sent to teacher:', assignment.teacher_id);
    } catch (notificationError) {
      console.error('Failed to send notification (non-critical):', notificationError);
    }

    const percentage = totalQuestions > 0 
      ? Math.round((correctCount / totalQuestions) * 100)
      : 0;

    console.log('Test submission completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        result: {
          score: score,
          correctCount: correctCount,
          totalQuestions: totalQuestions,
          percentage: percentage,
          detailedAnswers: detailedAnswers,
          assignment: updatedAssignment,
          updatedModules: updatedModules,
          masteryUpdated: updatedModules.length > 0,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Unexpected error in submit-question-bank-test:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorStack = error instanceof Error ? error.stack : '';
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: errorStack,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});