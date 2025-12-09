# TedrisEDU Deployment Planı

## Genel Bakış
Bu plan, TedrisEDU eğitim platformunun Supabase veritabanına bağlanması ve Vercel/Netlify gibi bir platformda yayınlanması için adım adım talimatlar içerir.

---

## Ön Hazırlık Kontrol Listesi

### ✅ Gerekli Hesaplar
- [ ] Supabase hesabı (https://supabase.com)
- [ ] Vercel hesabı (https://vercel.com) VEYA Netlify hesabı (https://netlify.com)
- [ ] Google AI Studio hesabı (Gemini API için - https://aistudio.google.com)
- [ ] GitHub hesabı (kod yönetimi için)

---

## AŞAMA 1: Supabase Veritabanı Kurulumu

### 1.1 Supabase Projesi Oluşturma
1. https://supabase.com adresine gidin
2. "Start your project" veya "New Project" butonuna tıklayın
3. Proje bilgilerini girin:
   - **Name**: tedris-production (veya istediğiniz isim)
   - **Database Password**: Güçlü bir şifre oluşturun (kaydedin!)
   - **Region**: Europe (Frankfurt) - Türkiye'ye en yakın
4. "Create new project" butonuna tıklayın
5. Proje oluşturulmasını bekleyin (2-3 dakika)

### 1.2 Veritabanı Şemasını Yükleme
1. Supabase Dashboard'da sol menüden **SQL Editor** seçin
2. "New query" butonuna tıklayın
3. `full_schema.sql` dosyasının içeriğini kopyalayın
4. SQL Editor'e yapıştırın
5. **"Run"** butonuna tıklayın
6. Hata yoksa ✅ işareti görünecek

### 1.3 Admin Kullanıcısı Oluşturma
1. SQL Editor'de yeni bir query açın
2. `make_admin.sql` dosyasının içeriğini kopyalayın
3. **ÖNEMLİ**: Dosyadaki email ve şifreyi kendi bilgilerinizle değiştirin
4. "Run" butonuna tıklayın

### 1.4 Supabase Credentials Alma
1. Supabase Dashboard'da **Settings** → **API** seçin
2. Şu bilgileri kopyalayın ve bir yere kaydedin:
   - **Project URL** (örn: https://xxxxx.supabase.co)
   - **anon public** key (uzun bir string)

---

## AŞAMA 2: Google Gemini API Kurulumu

### 2.1 API Key Alma
1. https://aistudio.google.com adresine gidin
2. "Get API Key" butonuna tıklayın
3. Yeni bir API key oluşturun
4. API key'i kopyalayın ve güvenli bir yere kaydedin

---

## AŞAMA 3: GitHub Repository Oluşturma

### 3.1 Kod Yükleme
```bash
# Terminal'de proje klasörüne gidin
cd "/Users/ahmetduyar/Downloads/project 2"

# Git repository başlatın (eğer yoksa)
git init

# .gitignore dosyasını kontrol edin (zaten var)
# .env dosyasının ignore edildiğinden emin olun

# Tüm dosyaları ekleyin
git add .

# İlk commit
git commit -m "Initial commit - TedrisEDU Platform"

# GitHub'da yeni bir repository oluşturun (https://github.com/new)
# Repository adı: tedris-platform (veya istediğiniz isim)
# Public veya Private seçin

# Remote ekleyin (GitHub'daki repository URL'inizi kullanın)
git remote add origin https://github.com/KULLANICI_ADINIZ/tedris-platform.git

# Kodu GitHub'a yükleyin
git branch -M main
git push -u origin main
```

---

## AŞAMA 4: Environment Variables Hazırlama

### 4.1 .env.example Dosyası Oluşturma
Proje klasöründe `.env.example` dosyası oluşturun:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Gemini AI
VITE_GEMINI_API_KEY=your_gemini_api_key
```

### 4.2 Gerçek .env Dosyası
Yerel geliştirme için `.env` dosyanızı gerçek değerlerle güncelleyin.

---

## AŞAMA 5: Vercel'de Deployment

### 5.1 Vercel Hesabı ve Proje Kurulumu
1. https://vercel.com adresine gidin
2. GitHub ile giriş yapın
3. "Add New..." → "Project" seçin
4. GitHub repository'nizi seçin (tedris-platform)
5. "Import" butonuna tıklayın

### 5.2 Build Settings Yapılandırma
Vercel otomatik olarak Vite projesini algılayacak:
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 5.3 Environment Variables Ekleme
1. "Environment Variables" bölümüne gidin
2. Her bir değişkeni ekleyin:
   - **Name**: `VITE_SUPABASE_URL`
   - **Value**: Supabase Project URL'iniz
   - **Environment**: Production, Preview, Development (hepsini seçin)
   
3. Diğer değişkenler için tekrarlayın:
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_GEMINI_API_KEY`

### 5.4 Deploy
1. "Deploy" butonuna tıklayın
2. Build sürecini izleyin (2-3 dakika)
3. ✅ "Deployment Ready" mesajını bekleyin
4. Verilen URL'yi açın (örn: https://tedris-platform.vercel.app)

---

## AŞAMA 6: Supabase Edge Functions (Opsiyonel ama Önerilen)

Bazı özellikler Supabase Edge Functions gerektirir. Bunları deploy etmek için:

### 6.1 Supabase CLI Kurulumu
```bash
# macOS için
brew install supabase/tap/supabase

# Giriş yapın
supabase login
```

### 6.2 Proje Bağlama
```bash
# Proje klasöründe
cd "/Users/ahmetduyar/Downloads/project 2"

# Supabase projenize bağlanın
supabase link --project-ref YOUR_PROJECT_REF
```

### 6.3 Functions Deploy
```bash
# Tüm functions'ları deploy edin
supabase functions deploy
```

---

## AŞAMA 7: Domain Ayarları (Opsiyonel)

### 7.1 Özel Domain Ekleme
1. Vercel Dashboard'da projenize gidin
2. "Settings" → "Domains" seçin
3. Kendi domain'inizi ekleyin (örn: tedris.com)
4. DNS ayarlarını yapın (Vercel size talimat verecek)

---

## AŞAMA 8: Test ve Doğrulama

### 8.1 Deployment Sonrası Kontroller
- [ ] Landing page açılıyor mu?
- [ ] Giriş yapma çalışıyor mu?
- [ ] Admin paneline erişim var mı?
- [ ] Öğretmen dashboard'u çalışıyor mu?
- [ ] Öğrenci dashboard'u çalışıyor mu?
- [ ] Test oluşturma çalışıyor mu?
- [ ] AI özellikleri çalışıyor mu?

### 8.2 Hata Ayıklama
Vercel Dashboard'da:
- **Deployments** → Son deployment → **Logs** kontrol edin
- **Runtime Logs** bölümünden canlı hataları görün

---

## Sorun Giderme

### Build Hataları
```bash
# Yerel olarak build test edin
npm run build

# Hata varsa düzeltin ve tekrar push edin
git add .
git commit -m "Fix build errors"
git push
```

### Environment Variables Eksik
- Vercel Dashboard → Settings → Environment Variables
- Tüm değişkenlerin doğru girildiğinden emin olun
- Değişiklik yaptıysanız "Redeploy" yapın

### Supabase Bağlantı Sorunları
- Supabase Dashboard → Settings → API
- URL ve Key'lerin doğru olduğunu kontrol edin
- RLS (Row Level Security) politikalarını kontrol edin

---

## Güvenlik Önerileri

1. **API Keys**: Asla GitHub'a yüklemeyin
2. **Database Password**: Güçlü ve benzersiz olsun
3. **RLS Policies**: Tüm tablolarda aktif olduğundan emin olun
4. **HTTPS**: Vercel otomatik sağlar
5. **CORS**: Supabase'de sadece domain'inize izin verin

---

## Maliyet Tahmini

### Ücretsiz Tier Limitleri
- **Vercel**: 100 GB bandwidth/ay
- **Supabase**: 500 MB database, 2 GB bandwidth/ay
- **Google Gemini**: 15 request/dakika (ücretsiz tier)

### Ücretli Planlara Geçiş
Kullanıcı sayısı arttıkça:
- **Vercel Pro**: $20/ay
- **Supabase Pro**: $25/ay
- **Gemini API**: Kullanıma göre ücretlendirme

---

## Sonraki Adımlar

1. ✅ Deployment tamamlandı
2. 📧 Kullanıcılara duyuru yapın
3. 📊 Analytics ekleyin (Google Analytics, Vercel Analytics)
4. 🔄 CI/CD pipeline kurun (otomatik deployment)
5. 📱 Mobile responsive test edin
6. 🐛 Bug tracking sistemi kurun (Sentry)

---

## Destek ve Kaynaklar

- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Vite Docs**: https://vitejs.dev/guide/

---

**Not**: Bu plan adım adım takip edilmelidir. Her aşamayı tamamladıktan sonra bir sonrakine geçin.
