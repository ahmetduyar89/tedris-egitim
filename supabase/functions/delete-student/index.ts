import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, DELETE',
}

serve(async (req) => {
  // CORS: Ön kontrol (OPTIONS) isteğini hemen onayla
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Supabase istemcisini oluştur (Kullanıcının yetkisiyle)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // İstekten öğrenci ID'sini al
    const { student_id } = await req.json()

    // Silme işlemini yap (Tablo adı: students)
    const { error } = await supabase
      .from('students') 
      .delete()
      .eq('id', student_id)

    if (error) throw error

    // BAŞARILI: Mutlaka 200 OK ve JSON mesaj dön
    return new Response(JSON.stringify({ message: "Silme başarılı" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    // HATA: 400 Hatası dön
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
