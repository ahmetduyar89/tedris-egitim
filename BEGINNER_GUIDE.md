# 🎓 TEDRİS Deployment - Adım Adım Detaylı Rehber

Bu rehber, hiç teknik bilginiz olmasa bile TEDRİS platformunu canlıya almanız için hazırlanmıştır.
Her adım resimli ve detaylı anlatılmıştır.

---

## 📚 İÇİNDEKİLER

- [BÖLÜM 1: Hesap Oluşturma](#bölüm-1-hesap-oluşturma)
- [BÖLÜM 2: Supabase Kurulumu](#bölüm-2-supabase-kurulumu)
- [BÖLÜM 3: Google Gemini API](#bölüm-3-google-gemini-api)
- [BÖLÜM 4: GitHub Repository](#bölüm-4-github-repository)
- [BÖLÜM 5: Vercel Deployment](#bölüm-5-vercel-deployment)
- [BÖLÜM 6: Test ve Doğrulama](#bölüm-6-test-ve-doğrulama)

---

# BÖLÜM 1: HESAP OLUŞTURMA

## 1.1 Supabase Hesabı Oluşturma

### Ne yapacağız?
Veritabanımızı barındıracak Supabase platformuna üye olacağız.

### Adım Adım:

**1. Web sitesini açın:**
- Tarayıcınızı açın (Chrome, Safari, Firefox)
- Adres çubuğuna yazın: `https://supabase.com`
- Enter'a basın

**2. Kayıt olun:**
- Sağ üstte **"Start your project"** veya **"Sign Up"** butonunu bulun
- Butona tıklayın

**3. Kayıt yöntemini seçin:**
Üç seçenek göreceksiniz:
- ✅ **GitHub ile devam et** (ÖNERİLEN - en kolay)
- Email ile kayıt
- Google ile kayıt

**GitHub ile kayıt (önerilen):**
- "Continue with GitHub" butonuna tıklayın
- GitHub hesabınız yoksa:
  - "Create an account" linkine tıklayın
  - Email, kullanıcı adı, şifre girin
  - Email'inizi doğrulayın
- GitHub hesabınız varsa:
  - Kullanıcı adı ve şifrenizi girin
  - "Sign in" tıklayın
- Supabase'e izin verin:
  - "Authorize Supabase" butonuna tıklayın

**4. Doğrulama:**
- ✅ Supabase dashboard'u görüyorsanız başarılı!
- Ekranda "Create a new project" butonu olmalı

---

## 1.2 Vercel Hesabı Oluşturma

### Ne yapacağız?
Web sitemizi yayınlayacak Vercel platformuna üye olacağız.

### Adım Adım:

**1. Web sitesini açın:**
- Yeni bir sekme açın
- Adres çubuğuna yazın: `https://vercel.com`
- Enter'a basın

**2. Kayıt olun:**
- Sağ üstte **"Sign Up"** butonunu bulun
- Butona tıklayın

**3. GitHub ile kayıt:**
- **"Continue with GitHub"** butonuna tıklayın
- (Zaten GitHub'a giriş yaptıysanız otomatik devam eder)
- "Authorize Vercel" butonuna tıklayın

**4. Hobby plan seçin:**
- "Hobby" planını seçin (ücretsiz)
- "Continue" tıklayın

**5. İsim girin:**
- Adınızı girin
- "Continue" tıklayın

**6. Doğrulama:**
- ✅ Vercel dashboard'u görüyorsanız başarılı!
- "Add New..." butonu olmalı

---

## 1.3 Google AI Studio Hesabı

### Ne yapacağız?
Yapay zeka özelliklerimiz için Google Gemini API'ye erişeceğiz.

### Adım Adım:

**1. Web sitesini açın:**
- Yeni bir sekme açın
- Adres çubuğuna yazın: `https://aistudio.google.com`
- Enter'a basın

**2. Giriş yapın:**
- Google hesabınızla giriş yapın
- Hesabınız yoksa:
  - "Create account" tıklayın
  - Adımları takip edin

**3. Doğrulama:**
- ✅ AI Studio ana sayfasını görüyorsanız başarılı!
- Sol menüde "Get API key" seçeneği olmalı

---

# BÖLÜM 2: SUPABASE KURULUMU

## 2.1 Yeni Proje Oluşturma

### Ne yapacağız?
Veritabanımızı barındıracak yeni bir Supabase projesi oluşturacağız.

### Adım Adım:

**1. Supabase Dashboard'a gidin:**
- Tarayıcınızda `https://app.supabase.com` açın
- Giriş yapın (gerekirse)

**2. Yeni proje oluşturun:**
- **"New Project"** butonuna tıklayın
- Yeşil renkli, büyük bir buton

**3. Organization seçin/oluşturun:**
- İlk kez kullanıyorsanız:
  - "Create a new organization" seçin
  - İsim girin (örn: "Tedris")
  - "Create organization" tıklayın

**4. Proje bilgilerini girin:**

**a) Name (Proje Adı):**
- Kutucuğa yazın: `tedris-production`
- (İstediğiniz başka bir isim de olabilir)

**b) Database Password (Veritabanı Şifresi):**
- **ÇOK ÖNEMLİ**: Bu şifreyi kaydedin!
- Güçlü bir şifre oluşturun:
  - En az 12 karakter
  - Büyük harf, küçük harf, rakam, özel karakter
  - Örnek: `Tedris2024!@#$`
- Şifreyi bir yere yazın:
  - Not defterine
  - Şifre yöneticisine (1Password, LastPass)
  - Güvenli bir dosyaya

**c) Region (Bölge):**
- Açılır menüden seçin: **"Europe (Frankfurt)"**
- Türkiye'ye en yakın sunucu

**d) Pricing Plan:**
- **"Free"** seçili olmalı (varsayılan)

**5. Projeyi oluşturun:**
- **"Create new project"** butonuna tıklayın
- Yeşil renkli buton

**6. Bekleyin:**
- Ekranda "Setting up project..." yazısı çıkacak
- 2-3 dakika bekleyin
- ☕ Kahve molası verin!

**7. Doğrulama:**
- ✅ Proje dashboard'u açıldı mı?
- Sol tarafta menü var mı?
- Üstte proje adınız görünüyor mu?

---

## 2.2 Veritabanı Şemasını Yükleme

### Ne yapacağız?
Hazır veritabanı yapımızı Supabase'e yükleyeceğiz.

### Adım Adım:

**1. SQL Editor'ü açın:**
- Sol menüde **"SQL Editor"** yazısını bulun
- Tıklayın
- Yeni bir sayfa açılacak

**2. Yeni sorgu oluşturun:**
- Sağ üstte **"New query"** butonunu bulun
- Tıklayın
- Boş bir editör açılacak

**3. Schema dosyasını açın:**
- Bilgisayarınızda şu klasörü açın:
  ```
  /Users/ahmetduyar/Downloads/project 2
  ```
- `full_schema.sql` dosyasını bulun
- Dosyaya çift tıklayın
- Bir metin editöründe açılacak

**4. İçeriği kopyalayın:**
- Dosyanın **TÜM** içeriğini seçin:
  - Mac: `Cmd + A` (hepsini seç)
  - Windows: `Ctrl + A`
- Kopyalayın:
  - Mac: `Cmd + C`
  - Windows: `Ctrl + C`

**5. Supabase'e yapıştırın:**
- Supabase SQL Editor penceresine geri dönün
- Boş alana tıklayın
- Yapıştırın:
  - Mac: `Cmd + V`
  - Windows: `Ctrl + V`

**6. Çalıştırın:**
- Sağ alt köşede **"RUN"** butonunu bulun
- Tıklayın
- Bekleyin (10-20 saniye)

**7. Sonucu kontrol edin:**
- ✅ Başarılı ise:
  - Yeşil bir onay işareti göreceksiniz
  - "Success. No rows returned" yazısı çıkacak
- ❌ Hata varsa:
  - Kırmızı bir hata mesajı göreceksiniz
  - Adım 3'ten tekrar başlayın
  - Tüm içeriği kopyaladığınızdan emin olun

**8. Tabloları kontrol edin:**
- Sol menüden **"Table Editor"** tıklayın
- Tablolar listesini görmelisiniz:
  - users
  - students
  - tests
  - assignments
  - submissions
  - ve daha fazlası...
- ✅ Tabloları görüyorsanız başarılı!

---

## 2.3 Admin Kullanıcısı Oluşturma

### Ne yapacağız?
Sisteme giriş yapabilmek için bir admin hesabı oluşturacağız.

### Adım Adım:

**1. SQL Editor'e dönün:**
- Sol menüden **"SQL Editor"** tıklayın

**2. Yeni sorgu açın:**
- **"New query"** butonuna tıklayın

**3. Admin dosyasını açın:**
- Bilgisayarınızda şu dosyayı bulun:
  ```
  /Users/ahmetduyar/Downloads/project 2/make_admin.sql
  ```
- Dosyayı bir metin editöründe açın

**4. Email ve şifreyi değiştirin:**

**ÖNEMLİ**: Dosyada şu satırları bulun:
```sql
'admin@example.com'
'admin123'
```

Bunları KENDİ bilgilerinizle değiştirin:
```sql
'sizin@emailiniz.com'
'GüçlüŞifreniz123!'
```

**Örnek:**
```sql
-- Öncesi:
'admin@example.com'
'admin123'

-- Sonrası:
'ahmet@tedris.com'
'Tedris2024!@#'
```

**5. Değiştirilmiş kodu kopyalayın:**
- Dosyanın TÜM içeriğini seçin (`Cmd/Ctrl + A`)
- Kopyalayın (`Cmd/Ctrl + C`)

**6. Supabase'e yapıştırın:**
- SQL Editor'e yapıştırın (`Cmd/Ctrl + V`)

**7. Çalıştırın:**
- **"RUN"** butonuna tıklayın
- Bekleyin

**8. Doğrulayın:**
- ✅ "Success" mesajı görmelisiniz
- Sol menüden **"Authentication"** tıklayın
- **"Users"** sekmesine gidin
- Admin email'inizi görmelisiniz

**9. Bilgileri kaydedin:**
Bir yere yazın:
```
Admin Email: ahmet@tedris.com
Admin Şifre: Tedris2024!@#
```

---

## 2.4 API Anahtarlarını Alma

### Ne yapacağız?
Uygulamamızın Supabase'e bağlanması için gerekli anahtarları alacağız.

### Adım Adım:

**1. Settings'e gidin:**
- Sol menünün en altında **⚙️ Settings** (dişli simgesi) bulun
- Tıklayın

**2. API sayfasını açın:**
- Sol tarafta **"API"** yazısını bulun
- Tıklayın

**3. Project URL'i kopyalayın:**

**a) Bulun:**
- Sayfada **"Project URL"** başlığını bulun
- Altında bir URL göreceksiniz:
  ```
  https://xxxxxxxxxxxxx.supabase.co
  ```

**b) Kopyalayın:**
- URL'nin yanındaki **📋 kopyala** simgesine tıklayın
- VEYA URL'yi seçip `Cmd/Ctrl + C` yapın

**c) Kaydedin:**
- Bir metin dosyası açın
- Şöyle yazın:
  ```
  SUPABASE URL:
  https://xxxxxxxxxxxxx.supabase.co
  ```

**4. Anon Key'i kopyalayın:**

**a) Bulun:**
- Aşağı kaydırın
- **"Project API keys"** bölümünü bulun
- **"anon public"** yazısını bulun
- Altında çok uzun bir metin göreceksiniz:
  ```
  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS...
  ```

**b) Kopyalayın:**
- Metnin yanındaki **📋 kopyala** simgesine tıklayın

**c) Kaydedin:**
- Metin dosyanıza ekleyin:
  ```
  SUPABASE ANON KEY:
  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  ```

**5. Dosyayı kaydedin:**
- Dosyayı şu isimle kaydedin: `supabase-credentials.txt`
- Güvenli bir yere koyun

---

# BÖLÜM 3: GOOGLE GEMINI API

## 3.1 API Key Alma

### Ne yapacağız?
Yapay zeka özelliklerimiz için Google Gemini API anahtarı alacağız.

### Adım Adım:

**1. AI Studio'yu açın:**
- Tarayıcınızda `https://aistudio.google.com` açın
- Google hesabınızla giriş yapın

**2. API Key sayfasına gidin:**
- Sol menüde **"Get API key"** yazısını bulun
- Tıklayın

**3. Yeni API key oluşturun:**
- **"Create API key"** butonunu bulun
- Tıklayın

**4. Proje seçin:**
- Bir açılır menü göreceksiniz
- **"Create API key in new project"** seçin
- Tıklayın

**5. API key'i kopyalayın:**
- Ekranda bir API key göreceksiniz:
  ```
  AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
  ```
- **"Copy"** butonuna tıklayın

**6. Kaydedin:**
- `supabase-credentials.txt` dosyanızı açın
- Ekleyin:
  ```
  GEMINI API KEY:
  AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
  ```
- Dosyayı kaydedin

**7. Güvenlik uyarısı:**
- ⚠️ Bu anahtarı kimseyle paylaşmayın
- ⚠️ GitHub'a yüklemeyin
- ⚠️ Güvenli saklayın

---

# BÖLÜM 4: GITHUB REPOSITORY

## 4.1 Terminal Nedir?

### Basit Açıklama:
Terminal, bilgisayara yazı ile komut verdiğiniz bir programdır.
Fare ile tıklamak yerine, yazarak işlem yaparsınız.

### Mac'te Terminal Açma:

**Yöntem 1 - Spotlight:**
1. `Cmd + Space` tuşlarına basın
2. "Terminal" yazın
3. Enter'a basın

**Yöntem 2 - Launchpad:**
1. Launchpad'i açın (F4 veya trackpad hareketi)
2. "Other" klasörünü açın
3. "Terminal" uygulamasını bulun
4. Tıklayın

**Terminal açıldı mı?**
- ✅ Siyah veya beyaz bir pencere açıldı
- ✅ İçinde yazılar var
- ✅ Yanıp sönen bir imleç var

---

## 4.2 Proje Klasörüne Gitme

### Ne yapacağız?
Terminal'de proje klasörümüze gideceğiz.

### Adım Adım:

**1. Terminal'i açın:**
- Yukarıdaki adımları takip edin

**2. Komutu yazın:**
Terminal'de şunu yazın (TAM OLARAK):
```bash
cd "/Users/ahmetduyar/Downloads/project 2"
```

**Nasıl yazılır?**
- `cd` yazın
- Boşluk bırakın
- Tırnak işareti `"` yazın
- Yolu yazın: `/Users/ahmetduyar/Downloads/project 2`
- Tırnak işareti `"` yazın

**3. Enter'a basın:**
- Komutu yazdıktan sonra Enter'a basın

**4. Doğrulama:**
Şimdi şunu yazın:
```bash
pwd
```
Enter'a basın.

Görmeli siniz:
```
/Users/ahmetduyar/Downloads/project 2
```

✅ Doğru klasördesiniz!

---

## 4.3 Git Repository Başlatma

### Ne yapacağız?
Kodlarımızı versiyon kontrolü altına alacağız.

### Adım Adım:

**1. Git'i başlatın:**
Terminal'de yazın:
```bash
git init
```
Enter'a basın.

**Göreceksiniz:**
```
Initialized empty Git repository...
```

**2. Dosyaları ekleyin:**
Terminal'de yazın:
```bash
git add .
```
Enter'a basın.

**Not:** Nokta (.) önemli! Tüm dosyaları ekler.

**3. İlk commit:**
Terminal'de yazın:
```bash
git commit -m "Initial commit - TEDRİS Platform"
```
Enter'a basın.

**Göreceksiniz:**
```
[main ...] Initial commit - TEDRİS Platform
 XX files changed, XXXX insertions(+)
```

✅ Git repository hazır!

---

## 4.4 GitHub'da Repository Oluşturma

### Ne yapacağız?
Kodlarımızı GitHub'da saklayacağız.

### Adım Adım:

**1. GitHub'ı açın:**
- Tarayıcınızda `https://github.com` açın
- Giriş yapın

**2. Yeni repository:**
- Sağ üstte **"+"** simgesini bulun
- Tıklayın
- **"New repository"** seçin

**3. Repository bilgileri:**

**a) Repository name:**
- Kutucuğa yazın: `tedris-platform`

**b) Description (opsiyonel):**
- Yazın: `AI-powered education platform`

**c) Public / Private:**
- **Private** seçin (önerilen)
- Kodlarınız gizli kalır

**d) Initialize repository:**
- ❌ "Add a README file" SEÇMEYİN
- ❌ ".gitignore" SEÇMEYİN
- ❌ "license" SEÇMEYİN

**4. Oluşturun:**
- **"Create repository"** butonuna tıklayın

**5. URL'i kopyalayın:**
Ekranda bir URL göreceksiniz:
```
https://github.com/KULLANICI_ADINIZ/tedris-platform.git
```
- Kopyalayın

---

## 4.5 Kodu GitHub'a Yükleme

### Ne yapacağız?
Bilgisayarımızdaki kodu GitHub'a göndereceğiz.

### Adım Adım:

**1. Terminal'e dönün:**
- Terminal penceresini bulun
- Hala `/Users/ahmetduyar/Downloads/project 2` klasöründe olmalısınız

**2. Remote ekleyin:**
Terminal'de yazın (KENDİ URL'NİZİ kullanın):
```bash
git remote add origin https://github.com/KULLANICI_ADINIZ/tedris-platform.git
```

**Örnek:**
```bash
git remote add origin https://github.com/ahmetduyar/tedris-platform.git
```

Enter'a basın.

**3. Branch adını ayarlayın:**
Terminal'de yazın:
```bash
git branch -M main
```
Enter'a basın.

**4. Kodu gönderin:**
Terminal'de yazın:
```bash
git push -u origin main
```
Enter'a basın.

**Ne olacak?**
- GitHub kullanıcı adı ve şifre isteyebilir
- Veya GitHub'a tarayıcıda giriş yapmanızı isteyebilir
- Adımları takip edin

**5. Doğrulama:**
- GitHub repository sayfanızı yenileyin
- ✅ Dosyalarınızı görmelisiniz
- ✅ "Initial commit" yazısı olmalı

---

# BÖLÜM 5: VERCEL DEPLOYMENT

## 5.1 Environment Variables Hazırlama

### Ne yapacağız?
Önce yerel bilgisayarımızda test edeceğiz.

### Adım Adım:

**1. .env dosyası oluşturun:**

**a) Proje klasörünü açın:**
- Finder'da şu klasörü açın:
  ```
  /Users/ahmetduyar/Downloads/project 2
  ```

**b) .env.example dosyasını bulun:**
- Listede `.env.example` dosyasını bulun

**c) Kopyalayın:**
- Dosyaya sağ tıklayın
- "Duplicate" seçin
- Yeni dosya oluşacak: `.env.example copy`

**d) Yeniden adlandırın:**
- Yeni dosyaya sağ tıklayın
- "Rename" seçin
- Adını değiştirin: `.env`
- Enter'a basın

**2. .env dosyasını düzenleyin:**

**a) Dosyayı açın:**
- `.env` dosyasına çift tıklayın
- Bir metin editöründe açılacak

**b) Değerleri girin:**
Dosyada şunları göreceksiniz:
```env
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

`supabase-credentials.txt` dosyanızı açın ve değerleri kopyalayın:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

**c) Kaydedin:**
- `Cmd + S` veya File → Save
- Dosyayı kapatın

---

## 5.2 Yerel Test

### Ne yapacağız?
Kendi bilgisayarımızda uygulamayı çalıştırıp test edeceğiz.

### Adım Adım:

**1. Terminal'e dönün:**
- Terminal penceresini bulun
- Hala proje klasöründe olmalısınız

**2. Bağımlılıkları yükleyin:**
Terminal'de yazın:
```bash
npm install
```
Enter'a basın.

**Ne olacak?**
- Ekranda bir sürü yazı akacak
- 1-2 dakika sürebilir
- ☕ Bekleyin...

**Bittiğinde:**
```
added XXX packages
```
göreceksiniz.

**3. Uygulamayı başlatın:**
Terminal'de yazın:
```bash
npm run dev
```
Enter'a basın.

**Göreceksiniz:**
```
  VITE v6.2.0  ready in XXX ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

**4. Tarayıcıda açın:**
- Tarayıcınızı açın
- Adres çubuğuna yazın: `http://localhost:3000`
- Enter'a basın

**5. Test edin:**
- ✅ Landing page görünüyor mu?
- **"Giriş Yap"** butonuna tıklayın
- Admin email ve şifrenizi girin
- **"Giriş Yap"** tıklayın
- ✅ Admin dashboard açıldı mı?

**Başarılı ise:**
- Terminal'e dönün
- `Ctrl + C` basın (uygulamayı durdurun)

---

## 5.3 Vercel'de Proje Oluşturma

### Ne yapacağız?
Uygulamamızı internete yayınlayacağız.

### Adım Adım:

**1. Vercel'i açın:**
- Tarayıcınızda `https://vercel.com` açın
- Giriş yapın

**2. Yeni proje:**
- **"Add New..."** butonunu bulun (sağ üstte)
- Tıklayın
- **"Project"** seçin

**3. Repository seçin:**
- GitHub repository listesi yüklenecek
- `tedris-platform` repository'nizi bulun
- **"Import"** butonuna tıklayın

**4. Build ayarları:**
Vercel otomatik algılayacak:
- ✅ Framework Preset: **Vite**
- ✅ Build Command: `npm run build`
- ✅ Output Directory: `dist`

**Hiçbir şeyi değiştirmeyin!**

---

## 5.4 Environment Variables Ekleme

### Ne yapacağız?
Supabase ve Gemini anahtarlarını Vercel'e ekleyeceğiz.

### Adım Adım:

**1. Environment Variables bölümünü bulun:**
- Sayfayı aşağı kaydırın
- **"Environment Variables"** başlığını bulun

**2. İlk değişkeni ekleyin:**

**a) Name kutusuna yazın:**
```
VITE_SUPABASE_URL
```

**b) Value kutusuna:**
- `supabase-credentials.txt` dosyanızı açın
- Supabase URL'inizi kopyalayın
- Value kutusuna yapıştırın

**c) Environments seçin:**
- **Production** ✅ (işaretli olmalı)
- **Preview** ✅ (işaretleyin)
- **Development** ✅ (işaretleyin)

**d) Add butonuna tıklayın**

**3. İkinci değişkeni ekleyin:**

**a) Name:**
```
VITE_SUPABASE_ANON_KEY
```

**b) Value:**
- Supabase Anon Key'inizi yapıştırın

**c) Environments:**
- Hepsini işaretleyin ✅✅✅

**d) Add tıklayın**

**4. Üçüncü değişkeni ekleyin:**

**a) Name:**
```
VITE_GEMINI_API_KEY
```

**b) Value:**
- Gemini API Key'inizi yapıştırın

**c) Environments:**
- Hepsini işaretleyin ✅✅✅

**d) Add tıklayın**

**5. Kontrol edin:**
- 3 environment variable görmelisiniz
- Her birinde 3 environment seçili olmalı

---

## 5.5 Deploy!

### Ne yapacağız?
Uygulamayı yayınlayacağız!

### Adım Adım:

**1. Deploy butonuna basın:**
- Sayfanın en altında **"Deploy"** butonunu bulun
- Büyük, mavi bir buton
- Tıklayın!

**2. Build sürecini izleyin:**
Ekranda şunları göreceksiniz:

**a) Building:**
```
⏳ Building...
```
- 1-2 dakika sürer
- Bekleyin...

**b) Loglar:**
- Ekranda bir sürü yazı akacak
- Endişelenmeyin, normal!

**c) Başarılı:**
```
✅ Build Completed
```

**d) Deployment:**
```
⏳ Deploying...
```

**e) Tamamlandı:**
```
🎉 Deployment Ready
```

**3. URL'i alın:**
- Ekranda bir URL göreceksiniz:
  ```
  https://tedris-platform.vercel.app
  ```
- **"Visit"** butonuna tıklayın
- VEYA URL'yi kopyalayıp tarayıcıda açın

**4. İlk test:**
- ✅ Landing page açıldı mı?
- ✅ Görseller yüklendi mi?
- ✅ Sayfa düzgün görünüyor mu?

**BAŞARILI! 🎉**

---

# BÖLÜM 6: TEST VE DOĞRULAMA

## 6.1 Admin Girişi

### Adım Adım:

**1. Siteyi açın:**
- Vercel URL'inizi açın
- Örnek: `https://tedris-platform.vercel.app`

**2. Giriş yapın:**
- **"Giriş Yap"** butonuna tıklayın
- Admin email'inizi girin
- Admin şifrenizi girin
- **"Giriş Yap"** tıklayın

**3. Kontrol edin:**
- ✅ Admin dashboard açıldı mı?
- ✅ "Bekleyen Öğretmenler" görünüyor mu?
- ✅ Menü çalışıyor mu?

---

## 6.2 Öğretmen Hesabı Oluşturma

### Adım Adım:

**1. Çıkış yapın:**
- Sağ üstte **"Çıkış Yap"** butonunu bulun
- Tıklayın

**2. Kayıt olun:**
- **"Kayıt Ol"** butonuna tıklayın

**3. Öğretmen seçin:**
- **"Öğretmen"** seçeneğini işaretleyin

**4. Formu doldurun:**
- **Ad Soyad**: Test Öğretmen
- **Email**: ogretmen@test.com
- **Şifre**: Test123!
- **Şifre Tekrar**: Test123!

**5. Kayıt olun:**
- **"Kayıt Ol"** butonuna tıklayın

**6. Onay bekleyin:**
- "Hesabınız onay bekliyor" mesajı göreceksiniz
- ✅ Normal!

---

## 6.3 Öğretmeni Onaylama

### Adım Adım:

**1. Admin olarak giriş yapın:**
- Çıkış yapın
- Admin email/şifre ile giriş yapın

**2. Bekleyen öğretmenleri görün:**
- "Bekleyen Öğretmenler" bölümünde
- "Test Öğretmen" görmelisiniz

**3. Onaylayın:**
- **"Onayla"** butonuna tıklayın
- ✅ "Onaylı Öğretmenler" listesine geçti

---

## 6.4 Öğretmen Olarak Giriş

### Adım Adım:

**1. Çıkış yapın:**
- Admin hesabından çıkış yapın

**2. Öğretmen olarak giriş yapın:**
- Email: ogretmen@test.com
- Şifre: Test123!

**3. Kontrol edin:**
- ✅ Öğretmen dashboard açıldı mı?
- ✅ "Öğrencilerim" görünüyor mu?
- ✅ "Öğrenci Ekle" butonu var mı?

---

## 6.5 Öğrenci Ekleme

### Adım Adım:

**1. Öğrenci ekle:**
- **"Öğrenci Ekle"** butonuna tıklayın

**2. Formu doldurun:**
- **Ad Soyad**: Test Öğrenci
- **Sınıf**: 9
- **Email**: ogrenci@test.com
- **Şifre**: Test123!

**3. Ekleyin:**
- **"Ekle"** butonuna tıklayın
- ✅ Öğrenci listede görünmeli

---

## 6.6 Öğrenci Olarak Giriş

### Adım Adım:

**1. Çıkış yapın**

**2. Öğrenci olarak giriş yapın:**
- Email: ogrenci@test.com
- Şifre: Test123!

**3. Kontrol edin:**
- ✅ Öğrenci dashboard açıldı mı?
- ✅ "Tedris Plan" görünüyor mu?
- ✅ Tabs çalışıyor mu?

---

## 6.7 AI Test Oluşturma

### Adım Adım:

**1. Öğretmen olarak giriş yapın**

**2. Test oluştur:**
- **"Test Oluştur"** butonuna tıklayın
- **"AI ile Oluştur"** seçin

**3. Ayarları yapın:**
- **Ders**: Matematik
- **Konu**: Denklemler
- **Zorluk**: Orta
- **Soru Sayısı**: 5

**4. Oluştur:**
- **"Oluştur"** butonuna tıklayın
- Bekleyin (10-20 saniye)

**5. Kontrol edin:**
- ✅ Sorular oluşturuldu mu?
- ✅ 5 soru var mı?
- ✅ Sorular mantıklı mı?

**BAŞARILI! AI çalışıyor! 🤖**

---

# 🎉 TEBRİKLER!

## Başardınız!

✅ Supabase kurulumu tamamlandı  
✅ Veritabanı hazır  
✅ GitHub'da kod yedeklendi  
✅ Vercel'de site yayında  
✅ Admin, öğretmen, öğrenci hesapları çalışıyor  
✅ AI özellikleri aktif  

## Siteniz Canlıda!

**URL'niz**: https://tedris-platform.vercel.app

## Sonraki Adımlar

1. **Kullanıcıları ekleyin:**
   - Gerçek öğretmenleri davet edin
   - Öğrencileri sisteme kaydedin

2. **İçerik ekleyin:**
   - Testler oluşturun
   - Ödevler atayın
   - Soru bankası hazırlayın

3. **Takip edin:**
   - Vercel Dashboard'dan istatistikleri izleyin
   - Supabase'de veritabanını kontrol edin

## Yardım Gerekirse

- 📧 Destek: support@tedris.com
- 📚 Dokümantasyon: README.md
- 🐛 Sorun bildirin: GitHub Issues

---

**Hazırlayan**: TEDRİS Team  
**Tarih**: 2025-11-25  
**Versiyon**: 1.0
