# 🔒 API Key Güvenlik Düzeltmesi - Deployment Talimatları

## ⚠️ ÖNEMLİ: Bu adımlar sırayla yapılmalıdır!

### 1️⃣ Supabase Edge Function Deploy

Edge function'ı Supabase'e deploy edin:

```bash
# Supabase CLI kurulu değilse:
npm install -g supabase

# Supabase'e login olun:
supabase login

# Projenize bağlanın:
supabase link --project-ref YOUR_PROJECT_REF

# Edge function'ı deploy edin:
supabase functions deploy ai-generate
```

### 2️⃣ Environment Variables Ayarlama

Supabase Dashboard'da Edge Function için environment variable ekleyin:

1. Supabase Dashboard → Project Settings → Edge Functions
2. "Add new secret" butonuna tıklayın
3. Şu değerleri ekleyin:

```
Name: GEMINI_API_KEY
Value: [Mevcut .env dosyanızdaki VITE_GEMINI_API_KEY değeri]
```

**NOT:** `VITE_` prefix'i OLMADAN ekleyin!

### 3️⃣ Client-Side Kodu Güncelleme

Mevcut `geminiService.ts` import'larını `secureAIService.ts` ile değiştirin.

**Değiştirilmesi Gereken Dosyalar:**
- `pages/TestCreationModal.tsx`
- `pages/AIReportPage.tsx`
- `pages/StudentDetailPage.tsx`
- `pages/AIAssistantPage.tsx`
- `services/motivationService.ts`
- Diğer Gemini API kullanan tüm dosyalar

**Örnek Değişiklik:**

```typescript
// ❌ ESKİ (Güvensiz)
import { generateTestQuestions } from '../services/geminiService';

// ✅ YENİ (Güvenli)
import { generateTestQuestions } from '../services/secureAIService';
```

### 4️⃣ .env Dosyasını Temizleme

`.env` dosyanızdan `VITE_GEMINI_API_KEY` satırını **SİLİN** veya yorum satırı yapın:

```bash
# ❌ Artık gerekli değil - Backend'de tutuluyor
# VITE_GEMINI_API_KEY=AIzaSy...

# ✅ Bunlar kalabilir (public olabilirler)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...
```

### 5️⃣ Test Etme

1. Uygulamayı yeniden başlatın:
```bash
npm run dev
```

2. Test oluşturma özelliğini deneyin
3. AI asistan ile konuşmayı deneyin
4. Test analizi yapın

**Beklenen Davranış:**
- ✅ Tüm AI özellikleri çalışmalı
- ✅ Network tab'de Gemini API key görünmemeli
- ✅ Sadece Supabase Edge Function çağrıları görülmeli

### 6️⃣ Production Deploy

Vercel/Netlify'a deploy ederken:

1. `.env` dosyasındaki `VITE_GEMINI_API_KEY` satırını kaldırın
2. Sadece Supabase credentials'ları ekleyin:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

---

## 🔍 Doğrulama

Edge function'ın çalıştığını doğrulamak için:

```bash
# Edge function loglarını izleyin:
supabase functions logs ai-generate --follow
```

---

## ❓ Sorun Giderme

### "Edge function not found" hatası
```bash
# Function'ı tekrar deploy edin:
supabase functions deploy ai-generate --no-verify-jwt
```

### "Gemini API key not configured" hatası
- Supabase Dashboard'da `GEMINI_API_KEY` environment variable'ının eklendiğinden emin olun
- Edge function'ı tekrar deploy edin

### "Unauthorized" hatası
- Kullanıcının login olduğundan emin olun
- `supabase.auth.getSession()` çağrısının başarılı olduğunu kontrol edin

---

## 📊 Güvenlik İyileştirmesi

### Önce (❌ Güvensiz)
```
Client Browser
  ↓ (API Key görünür!)
  ↓ VITE_GEMINI_API_KEY=AIzaSy...
  ↓
Gemini API
```

### Sonra (✅ Güvenli)
```
Client Browser
  ↓ (Sadece prompt)
  ↓ Authorization: Bearer token
  ↓
Supabase Edge Function
  ↓ (API Key güvenli!)
  ↓ GEMINI_API_KEY (server-side)
  ↓
Gemini API
```

---

## 💰 Maliyet Etkisi

- ✅ Edge Function çağrıları: FREE (2M requests/ay)
- ✅ Gemini API maliyeti: Aynı
- ✅ Ek güvenlik: Priceless! 🔒

---

## 📝 Notlar

1. **Eski `geminiService.ts` dosyasını silmeyin!** Referans olarak tutun.
2. **Tüm import'ları değiştirmeyi unutmayın!**
3. **Production'a geçmeden önce test edin!**
4. **API key'i .env'den kaldırmayı unutmayın!**

---

**Hazırlayan:** AI Security Team  
**Tarih:** 26 Kasım 2025  
**Versiyon:** 1.0
