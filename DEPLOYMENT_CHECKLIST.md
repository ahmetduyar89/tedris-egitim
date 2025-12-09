# TedrisEDU Deployment Checklist

Bu dosyayı deployment sürecinde rehber olarak kullanın. Her adımı tamamladıkça işaretleyin.

## 📋 Ön Hazırlık

### Hesaplar
- [ ] Supabase hesabı oluşturuldu (https://supabase.com)
- [ ] Vercel hesabı oluşturuldu (https://vercel.com)
- [ ] Google AI Studio hesabı var (https://aistudio.google.com)
- [ ] GitHub hesabı var

### Bilgiler Toplandı
- [ ] Supabase Project URL kaydedildi
- [ ] Supabase Anon Key kaydedildi
- [ ] Gemini API Key kaydedildi
- [ ] Database şifresi güvenli yerde saklandı

---

## 🗄️ Supabase Kurulumu

### Proje Oluşturma
- [ ] Yeni Supabase projesi oluşturuldu
- [ ] Proje adı: ________________
- [ ] Region: Europe (Frankfurt) seçildi
- [ ] Database şifresi oluşturuldu ve kaydedildi

### Veritabanı
- [ ] `full_schema.sql` dosyası SQL Editor'e yüklendi
- [ ] Schema başarıyla çalıştırıldı (hata yok)
- [ ] Tablolar oluşturuldu (Authentication → Users kontrol)

### Admin Kullanıcısı
- [ ] `make_admin.sql` dosyası düzenlendi (email/şifre)
- [ ] Admin kullanıcısı oluşturuldu
- [ ] Admin girişi test edildi

### API Credentials
- [ ] Project URL kopyalandı: ________________
- [ ] Anon Key kopyalandı: ________________

---

## 🤖 Google Gemini API

- [ ] AI Studio'da API key oluşturuldu
- [ ] API key kaydedildi: ________________
- [ ] API limitleri kontrol edildi (15 req/min)

---

## 💻 GitHub Repository

### Repository Oluşturma
- [ ] GitHub'da yeni repository oluşturuldu
- [ ] Repository adı: ________________
- [ ] Public/Private seçimi yapıldı

### Kod Yükleme
```bash
cd "/Users/ahmetduyar/Downloads/project 2"
git init
git add .
git commit -m "Initial commit - TedrisEDU Platform"
git remote add origin https://github.com/KULLANICI_ADI/REPO_ADI.git
git branch -M main
git push -u origin main
```

- [ ] Git repository başlatıldı
- [ ] İlk commit yapıldı
- [ ] GitHub'a push edildi
- [ ] GitHub'da kod görünüyor

---

## 🚀 Vercel Deployment

### Proje Kurulumu
- [ ] Vercel'de GitHub ile giriş yapıldı
- [ ] GitHub repository import edildi
- [ ] Framework: Vite otomatik algılandı

### Environment Variables
Aşağıdaki değişkenler Vercel'e eklendi:

- [ ] `VITE_SUPABASE_URL` = ________________
- [ ] `VITE_SUPABASE_ANON_KEY` = ________________
- [ ] `VITE_GEMINI_API_KEY` = ________________

**Önemli**: Her değişken için Production, Preview, Development seçildi

### Deployment
- [ ] "Deploy" butonuna tıklandı
- [ ] Build başarılı (✅ Deployment Ready)
- [ ] Deployment URL: ________________

---

## ✅ Test ve Doğrulama

### Temel Fonksiyonlar
- [ ] Landing page açılıyor
- [ ] Giriş sayfası çalışıyor
- [ ] Kayıt olma çalışıyor
- [ ] Admin paneli erişilebilir
- [ ] Öğretmen dashboard'u çalışıyor
- [ ] Öğrenci dashboard'u çalışıyor

### Özellikler
- [ ] Test oluşturma çalışıyor
- [ ] AI test oluşturma çalışıyor
- [ ] Öğrenci ekleme çalışıyor
- [ ] Ödev atama çalışıyor
- [ ] Soru bankası çalışıyor
- [ ] PDF test yükleme çalışıyor
- [ ] AI asistan çalışıyor

### Performans
- [ ] Sayfa yükleme hızı kabul edilebilir (<3 saniye)
- [ ] Mobil görünüm test edildi
- [ ] Tablet görünüm test edildi
- [ ] Desktop görünüm test edildi

---

## 🔧 Supabase Edge Functions (Opsiyonel)

```bash
brew install supabase/tap/supabase
supabase login
cd "/Users/ahmetduyar/Downloads/project 2"
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy
```

- [ ] Supabase CLI kuruldu
- [ ] Projeye bağlanıldı
- [ ] Functions deploy edildi

---

## 🌐 Domain Ayarları (Opsiyonel)

- [ ] Özel domain satın alındı: ________________
- [ ] Vercel'de domain eklendi
- [ ] DNS ayarları yapıldı
- [ ] SSL sertifikası aktif

---

## 🔒 Güvenlik Kontrolleri

- [ ] .env dosyası .gitignore'da
- [ ] API keys GitHub'da yok
- [ ] Supabase RLS politikaları aktif
- [ ] HTTPS çalışıyor (Vercel otomatik)
- [ ] Admin şifresi güçlü

---

## 📊 Monitoring (Opsiyonel)

- [ ] Vercel Analytics aktif
- [ ] Google Analytics eklendi
- [ ] Sentry kuruldu (hata takibi)
- [ ] Uptime monitoring kuruldu

---

## 📝 Notlar ve Sorunlar

### Karşılaşılan Sorunlar:
1. ________________
2. ________________
3. ________________

### Çözümler:
1. ________________
2. ________________
3. ________________

---

## 🎉 Deployment Tamamlandı!

- [ ] Tüm testler geçti
- [ ] Kullanıcılara duyuru yapıldı
- [ ] Dokümantasyon güncellendi
- [ ] Backup planı hazırlandı

**Deployment Tarihi**: ________________
**Deployment URL**: ________________
**Deployment Yapan**: ________________

---

## 📞 Acil Durum İletişim

- Vercel Support: https://vercel.com/support
- Supabase Support: https://supabase.com/support
- GitHub Support: https://support.github.com

---

**Sonraki Adımlar**:
1. Kullanıcı geri bildirimlerini topla
2. Analytics verilerini izle
3. Performans optimizasyonu yap
4. Yeni özellikler ekle
5. Düzenli backup al
