# ✅ API Güvenlik Düzeltmesi - Hızlı Checklist

## 🎯 Yapılması Gerekenler (Sırayla)

### 1. Supabase CLI Kurulumu
```bash
npm install -g supabase
```

### 2. Supabase Login
```bash
supabase login
```

### 3. Projeye Bağlan
```bash
supabase link --project-ref YOUR_PROJECT_REF
```
**NOT:** `YOUR_PROJECT_REF` yerine Supabase project ID'nizi yazın

### 4. Edge Function Deploy
```bash
supabase functions deploy ai-generate
```

### 5. Environment Variable Ekle
Supabase Dashboard → Settings → Edge Functions → Secrets:
- Name: `GEMINI_API_KEY`
- Value: `.env` dosyanızdaki `VITE_GEMINI_API_KEY` değeri (VITE_ olmadan)

### 6. Test Et
```bash
# Edge function test
curl -i --location --request POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/ai-generate' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"action":"explainTopic","payload":{"topic":"Matematik","grade":5}}'
```

### 7. Client-Side Kodu Güncelle
Tüm `geminiService` import'larını `secureAIService` ile değiştir

### 8. .env Temizle
`VITE_GEMINI_API_KEY` satırını sil veya yorum yap

### 9. Test
```bash
npm run dev
```
- Test oluştur
- AI asistan kullan
- Analiz yap

### 10. Production Deploy
Vercel/Netlify environment variables:
- ✅ `VITE_SUPABASE_URL`
- ✅ `VITE_SUPABASE_ANON_KEY`
- ❌ `VITE_GEMINI_API_KEY` (KALDIR!)

---

## 🔍 Doğrulama

✅ Network tab'de Gemini API key görünmemeli  
✅ Sadece `/functions/v1/ai-generate` çağrıları olmalı  
✅ Tüm AI özellikleri çalışmalı  

---

## 📞 Yardım

Sorun yaşarsanız:
1. `API_SECURITY_MIGRATION.md` dosyasını okuyun
2. Edge function loglarını kontrol edin: `supabase functions logs ai-generate`
3. Browser console'da hata mesajlarını kontrol edin
