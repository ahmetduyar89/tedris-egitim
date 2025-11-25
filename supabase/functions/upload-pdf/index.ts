import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    console.log('[upload-pdf] Function called');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log('[upload-pdf] Supabase client created');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[upload-pdf] No authorization header');
      return new Response(
        JSON.stringify({ error: 'Yetkilendirme gerekli' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('[upload-pdf] Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Geçersiz token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.log('[upload-pdf] User authenticated:', user.id);

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const teacherId = formData.get('teacherId') as string;

    console.log('[upload-pdf] Form data:', {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      teacherId
    });

    if (!file || !teacherId) {
      console.error('[upload-pdf] Missing file or teacherId');
      return new Response(
        JSON.stringify({ error: 'Dosya ve öğretmen ID gerekli' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (user.id !== teacherId) {
      console.error('[upload-pdf] User ID mismatch:', { userId: user.id, teacherId });
      return new Response(
        JSON.stringify({ error: 'Yetkilendirme hatası' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${teacherId}/${Date.now()}.${fileExt}`;
    console.log('[upload-pdf] Uploading to storage:', fileName);

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    const { data, error } = await supabase.storage
      .from('pdf-tests')
      .upload(fileName, uint8Array, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('[upload-pdf] Storage upload error:', error);
      return new Response(
        JSON.stringify({ error: `Yükleme hatası: ${error.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.log('[upload-pdf] File uploaded successfully:', data);

    const { data: urlData } = supabase.storage
      .from('pdf-tests')
      .getPublicUrl(fileName);

    console.log('[upload-pdf] Public URL generated:', urlData.publicUrl);

    return new Response(
      JSON.stringify({ publicUrl: urlData.publicUrl }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[upload-pdf] Function error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Bilinmeyen hata' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
