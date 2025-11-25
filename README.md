# 🎓 TEDRİS - AI Destekli Eğitim Platformu

TEDRİS, öğretmenlerin iş yükünü azaltan ve öğrenci başarısını artıran yapay zeka destekli bir eğitim yönetim platformudur.

## ✨ Özellikler

### 🤖 AI Destekli Özellikler
- **Otomatik Test Oluşturma**: Gemini AI ile saniyeler içinde müfredata uygun testler
- **Akıllı Analiz**: Öğrenci performansının konu bazlı detaylı analizi
- **Kişiselleştirilmiş Planlar**: Her öğrenciye özel haftalık çalışma programları
- **AI Asistan**: 7/24 öğrencilere yardımcı olan yapay zeka asistanı

### 👨‍🏫 Öğretmen Özellikleri
- Öğrenci yönetimi ve takibi
- Test ve ödev oluşturma
- Soru bankası yönetimi
- PDF test yükleme
- Detaylı performans raporları
- İçerik kütüphanesi
- Haftalık program oluşturma

### 👨‍🎓 Öğrenci Özellikleri
- Kişiselleştirilmiş dashboard
- Test ve ödev takibi
- Öğrenme haritası
- Flashcard sistemi (aralıklı tekrar)
- Gamification (XP, seviye, rozetler)
- AI asistan desteği
- Haftalık görevler

### 🔐 Admin Özellikleri
- Öğretmen onay sistemi
- Kullanıcı yönetimi
- Sistem ayarları

## 🚀 Hızlı Başlangıç

### Yerel Geliştirme

**Gereksinimler**: Node.js 18+

```bash
# Bağımlılıkları yükle
npm install

# .env dosyasını oluştur
cp .env.example .env

# .env dosyasını düzenle ve API anahtarlarını ekle
# VITE_SUPABASE_URL=...
# VITE_SUPABASE_ANON_KEY=...
# VITE_GEMINI_API_KEY=...

# Geliştirme sunucusunu başlat
npm run dev
```

Uygulama http://localhost:3000 adresinde çalışacaktır.

### Production Build

```bash
npm run build
npm run preview
```

## 📦 Deployment

Platform Vercel, Netlify veya benzeri servislerde kolayca deploy edilebilir.

### Hızlı Deployment (30 dakika)
Detaylı adımlar için: **[QUICK_START.md](./QUICK_START.md)**

### Tam Deployment Rehberi
Kapsamlı talimatlar için: **[DEPLOYMENT_PLAN.md](./DEPLOYMENT_PLAN.md)**

### Deployment Checklist
İlerleme takibi için: **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)**

## 🛠️ Teknoloji Stack

- **Frontend**: React 19, TypeScript, Vite
- **Backend**: Supabase (PostgreSQL, Authentication, Storage)
- **AI**: Google Gemini 2.5 Flash
- **Styling**: Tailwind CSS (inline)
- **Charts**: Recharts
- **Deployment**: Vercel/Netlify

## 📁 Proje Yapısı

```
project/
├── components/          # React bileşenleri
├── pages/              # Sayfa bileşenleri
├── services/           # API servisleri
├── public/             # Statik dosyalar
├── types.ts            # TypeScript tipleri
├── constants.ts        # Sabitler
├── full_schema.sql     # Veritabanı şeması
├── make_admin.sql      # Admin kullanıcı oluşturma
└── DEPLOYMENT_*.md     # Deployment dokümantasyonu
```

## 🔑 Environment Variables

Gerekli environment variables:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

## 🗄️ Veritabanı Kurulumu

1. Supabase'de yeni proje oluşturun
2. SQL Editor'de `full_schema.sql` dosyasını çalıştırın
3. `make_admin.sql` dosyasını düzenleyip çalıştırın (admin kullanıcı için)

## 🔒 Güvenlik

- ✅ Row Level Security (RLS) aktif
- ✅ JWT tabanlı authentication
- ✅ API key'ler environment variables'da
- ✅ HTTPS zorunlu (production)
- ✅ Leaked password protection (Supabase)

### Güvenlik Yapılandırması

Supabase Dashboard'da:
1. Authentication > Settings
2. "Password Protection" bölümünü bulun
3. "Check passwords against HaveIBeenPwned.org" aktif edin

## 📊 Özellik Listesi

### Tamamlanan Özellikler
- ✅ Kullanıcı authentication (Admin, Öğretmen, Öğrenci)
- ✅ AI destekli test oluşturma
- ✅ Öğrenci yönetimi
- ✅ Test ve ödev sistemi
- ✅ Soru bankası
- ✅ PDF test yükleme
- ✅ Öğrenme haritası
- ✅ Flashcard sistemi
- ✅ Gamification
- ✅ AI asistan
- ✅ Haftalık program
- ✅ İçerik kütüphanesi
- ✅ Detaylı raporlama
- ✅ Modern landing page

### Planlanan Özellikler
- 🔄 Mobil uygulama
- 🔄 Veli paneli
- 🔄 Canlı ders sistemi
- 🔄 Mesajlaşma sistemi
- 🔄 Bildirim sistemi
- 🔄 Gelişmiş analytics

## 🐛 Sorun Giderme

### Build Hataları
```bash
# Önce yerel olarak test edin
npm run build

# Hata varsa bağımlılıkları temizleyin
rm -rf node_modules package-lock.json
npm install
```

### Supabase Bağlantı Sorunları
- Environment variables'ları kontrol edin
- Supabase Dashboard → Settings → API
- RLS politikalarını kontrol edin

### AI Özellikleri Çalışmıyor
- Gemini API key'in geçerli olduğunu kontrol edin
- API quota'nızı kontrol edin (15 req/min ücretsiz tier)

## 📈 Performans

- **Lighthouse Score**: 90+
- **First Contentful Paint**: <1.5s
- **Time to Interactive**: <3s
- **Bundle Size**: ~500KB (gzipped)

## 💰 Maliyet Tahmini

### Ücretsiz Tier (Başlangıç)
- **Vercel**: 100 GB bandwidth/ay
- **Supabase**: 500 MB database, 2 GB bandwidth/ay
- **Gemini**: 15 request/dakika

### Ücretli Planlar (Büyüme)
- **Vercel Pro**: $20/ay
- **Supabase Pro**: $25/ay
- **Gemini API**: Kullanıma göre

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/AmazingFeature`)
3. Commit edin (`git commit -m 'Add some AmazingFeature'`)
4. Push edin (`git push origin feature/AmazingFeature`)
5. Pull Request açın

## 📝 Lisans

Bu proje özel kullanım içindir.

## 📞 Destek

Sorularınız için:
- 📧 Email: support@tedris.com
- 📚 Dokümantasyon: [DEPLOYMENT_PLAN.md](./DEPLOYMENT_PLAN.md)
- 🐛 Issues: GitHub Issues

## 🙏 Teşekkürler

- [Supabase](https://supabase.com) - Backend infrastructure
- [Google Gemini](https://ai.google.dev) - AI capabilities
- [Vercel](https://vercel.com) - Hosting
- [React](https://react.dev) - UI framework

---

**Yapımcı**: TEDRİS Team  
**Versiyon**: 1.0.0  
**Son Güncelleme**: 2025-11-25
