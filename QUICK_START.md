# 🚀 TEDRİS - Hızlı Başlangıç Rehberi

Bu rehber, TEDRİS platformunu 30 dakikada canlıya almak için gereken minimum adımları içerir.

---

## ⚡ Hızlı Adımlar (30 Dakika)

### 1️⃣ Supabase Kurulumu (10 dakika)

1. **Hesap Oluştur**: https://supabase.com → Sign Up
2. **Yeni Proje**: "New Project" → İsim ver → Region: Europe (Frankfurt)
3. **Şifre Kaydet**: Database şifresini güvenli yere kaydet
4. **Bekle**: 2-3 dakika proje hazırlanıyor...

5. **SQL Çalıştır**:
   - Sol menü → SQL Editor → New Query
   - `full_schema.sql` dosyasını aç
   - Tüm içeriği kopyala → SQL Editor'e yapıştır
   - **RUN** butonuna bas
   - ✅ Success mesajını bekle

6. **Admin Oluştur**:
   - Yeni Query aç
   - `make_admin.sql` dosyasını aç
   - **ÖNEMLİ**: Email ve şifreyi DEĞİŞTİR
   - **RUN** butonuna bas

7. **Credentials Al**:
   - Settings → API
   - **Project URL** kopyala (örn: https://xxxxx.supabase.co)
   - **anon public** key kopyala

---

### 2️⃣ Google Gemini API (5 dakika)

1. https://aistudio.google.com → Giriş yap
2. "Get API Key" → "Create API Key"
3. API Key'i kopyala ve kaydet

---

### 3️⃣ GitHub'a Yükle (5 dakika)

```bash
# Terminal'i aç
cd "/Users/ahmetduyar/Downloads/project 2"

# Git başlat
git init
git add .
git commit -m "Initial commit"

# GitHub'da yeni repo oluştur: https://github.com/new
# Repo adı: tedris-platform

# Remote ekle (kendi URL'inizi kullanın)
git remote add origin https://github.com/KULLANICI_ADINIZ/tedris-platform.git
git branch -M main
git push -u origin main
```

---

### 4️⃣ Vercel'de Yayınla (10 dakika)

1. **Hesap**: https://vercel.com → GitHub ile giriş yap
2. **Import**: "Add New..." → "Project" → GitHub repo seç
3. **Configure**:
   - Framework: Vite (otomatik algılanır)
   - Build Command: `npm run build`
   - Output Directory: `dist`

4. **Environment Variables** (ÖNEMLİ!):
   
   | Name | Value |
   |------|-------|
   | `VITE_SUPABASE_URL` | Supabase Project URL'iniz |
   | `VITE_SUPABASE_ANON_KEY` | Supabase Anon Key'iniz |
   | `VITE_GEMINI_API_KEY` | Google Gemini API Key'iniz |
   
   **Her değişken için**: Production, Preview, Development seçin

5. **Deploy**: "Deploy" butonuna bas → 2-3 dakika bekle → ✅

---

## ✅ İlk Test

1. Vercel'in verdiği URL'yi aç (örn: https://tedris-platform.vercel.app)
2. "Giriş Yap" butonuna tıkla
3. Admin email ve şifrenle giriş yap
4. ✅ Admin dashboard görünüyorsa BAŞARILI!

---

## 🐛 Hata Alıyorsanız

### "Failed to fetch" hatası
- Vercel → Settings → Environment Variables
- Tüm değişkenlerin doğru girildiğini kontrol edin
- "Redeploy" yapın

### "Invalid API key" hatası
- Gemini API key'in doğru olduğunu kontrol edin
- AI Studio'da quota'nız dolmamış olmalı

### "Database connection failed"
- Supabase URL ve Key'leri tekrar kontrol edin
- Supabase Dashboard → Settings → API

---

## 📚 Detaylı Dokümantasyon

Daha fazla bilgi için:
- **Tam Plan**: `DEPLOYMENT_PLAN.md`
- **Checklist**: `DEPLOYMENT_CHECKLIST.md`

---

## 🎯 Sonraki Adımlar

1. ✅ Platform canlıda
2. 👥 Öğretmen hesapları oluştur
3. 📊 İlk testleri yükle
4. 🎓 Öğrencileri ekle
5. 🚀 Kullanıma başla!

---

**İyi çalışmalar! 🎉**
