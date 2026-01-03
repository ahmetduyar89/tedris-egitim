import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  // CORS: Handle pre-flight OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header is required');
    }

    // Create a user client to verify the requester's identity
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create an admin client to perform the deletion
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get the student ID from the request body
    const body = await req.json();
    const studentId = body.studentId || body.student_id;

    if (!studentId) {
      return new Response(JSON.stringify({ error: 'Student ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Check if the requester has permission to delete this student
    // A student can be deleted if:
    // - The requester is the tutor of the student
    // - OR the requester is an admin

    // Check student ownership
    const { data: student, error: studentFetchError } = await adminClient
      .from('students')
      .select('tutor_id')
      .eq('id', studentId)
      .maybeSingle();

    if (studentFetchError) {
      throw studentFetchError;
    }

    if (!student) {
      return new Response(JSON.stringify({ error: 'Student not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check requester role
    const { data: requester, error: requesterError } = await adminClient
      .from('users')
      .select('role, is_admin')
      .eq('id', user.id)
      .single();

    if (requesterError) {
      throw requesterError;
    }

    const isOwner = student.tutor_id === user.id;
    const isAdmin = requester.is_admin === true || requester.role === 'admin';

    if (!isOwner && !isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden: You do not have permission to delete this student' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Deleting student ${studentId} requested by ${user.id}`);

    // 2. Delete the user from Supabase Auth
    // Because of ON DELETE CASCADE on students and users tables, this will delete everything.
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(studentId);

    if (deleteError) {
      console.error('Error deleting student from auth:', deleteError);
      // If auth delete fails, try manual delete from tables as fallback if it's a DB consistency issue
      const { error: dbDeleteError } = await adminClient
        .from('students')
        .delete()
        .eq('id', studentId);

      if (dbDeleteError) {
        throw new Error(`Failed to delete student: ${deleteError.message} (DB error: ${dbDeleteError.message})`);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Student and associated account deleted successfully'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in delete-student function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
