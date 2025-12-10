import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

/**
 * Supabase Client - Güvenli Yapılandırma
 * 
 * Güvenlik Özellikleri:
 * - sessionStorage kullanımı (XSS koruması için localStorage yerine)
 * - Auto refresh token
 * - Session persistence
 * - URL detection
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // sessionStorage kullan (browser kapatılınca session silinir)
    // localStorage yerine daha güvenli
    storage: window.sessionStorage,

    // Token'ı otomatik yenile
    autoRefreshToken: true,

    // Session'ı persist et
    persistSession: true,

    // URL'de session token varsa algıla (email confirmation vb.)
    detectSessionInUrl: true,

    // Flow type (PKCE daha güvenli)
    flowType: 'pkce'
  },

  // Global options
  global: {
    headers: {
      'X-Client-Info': 'tedris-platform'
    }
  }
});

// Development mode'da debug logging
if (import.meta.env.DEV) {
  console.log('🔐 Supabase client initialized with secure configuration');
  console.log('📦 Storage: sessionStorage (secure)');
  console.log('🔄 Auto refresh: enabled');
  console.log('🔒 Flow type: PKCE');
}

