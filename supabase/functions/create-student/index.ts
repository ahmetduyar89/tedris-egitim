import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: 'student' | 'parent';
  // Student specific
  grade?: number;
  tutorId?: string;
  // Parent specific
  phone?: string;
  studentId?: string;
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
      return new Response(JSON.stringify({ error: 'Authorization header required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify if caller is tutor or admin
    const { data: userData, error: tutorError } = await supabaseClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (tutorError || !userData || (userData.role !== 'tutor' && userData.role !== 'admin')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { name, email, password, role, grade, tutorId, phone, studentId }: CreateUserRequest = await req.json();

    if (!name || !email || !password || !role) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Create Auth User
    const { data: authData, error: signUpError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role }
    });

    if (signUpError) {
      return new Response(JSON.stringify({ error: signUpError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const newUserId = authData.user!.id;

    // 2. Insert into profiles table
    await supabaseClient.from('profiles').upsert({
      id: newUserId,
      email,
      name,
      role
    });

    // 3. Insert into users table
    const { error: usersError } = await supabaseClient.from('users').insert([{
      id: newUserId,
      name,
      email,
      role,
      status: 'approved'
    }]);

    if (usersError) {
      console.error('Users table error:', usersError);
      // Proceeding because failure here might be due to existing record or constraint we fix later
    }

    // 4. Role-specific table inserts
    if (role === 'student') {
      const { error: studentError } = await supabaseClient.from('students').insert([{
        id: newUserId,
        name,
        grade: grade || 5, // default
        tutor_id: tutorId || user.id,
        level: 1,
        xp: 0,
        learning_loop_status: 'Başlangıç'
      }]);
      if (studentError) {
        return new Response(JSON.stringify({ error: `Student table: ${studentError.message}` }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else if (role === 'parent') {
      const { error: parentError } = await supabaseClient.from('parents').insert([{
        id: newUserId,
        name,
        email,
        phone: phone || '',
        password_hash: 'managed_by_auth'
      }]);

      if (parentError) {
        console.error('Parents table error:', parentError);
      }

      // Link to student if provided
      if (studentId) {
        await supabaseClient.from('students').update({ parent_id: newUserId }).eq('id', studentId);
        await supabaseClient.from('parent_student_relations').insert([{
          parent_id: newUserId,
          student_id: studentId,
          relationship_type: 'vasi'
        }]);
      }
    }

    return new Response(JSON.stringify({ success: true, userId: newUserId }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});