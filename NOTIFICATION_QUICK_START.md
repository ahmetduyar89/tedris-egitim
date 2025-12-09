# 📱 Bildirim Sistemi - Hızlı Başlangıç

## ✅ Yapılanlar

### 1. Veritabanı Yapısı
- ✅ `student_notification_preferences` - Öğrenci bildirim tercihleri
- ✅ `push_subscriptions` - Push notification abonelikleri  
- ✅ `notification_history` - Bildirim geçmişi

### 2. Servisler
- ✅ `pushNotificationService.ts` - Push notification yönetimi
- ✅ `multiChannelNotificationService.ts` - Merkezi bildirim servisi
- ✅ `diagnosisTestManagementService.ts` - Test atama bildirimleri entegre edildi

### 3. Bileşenler
- ✅ `NotificationSettingsModal.tsx` - Öğrenci bildirim ayarları
- ✅ `public/sw.js` - Service Worker (PWA)

### 4. Edge Functions
- ✅ `send-push-notification/index.ts` - Push notification gönderme

### 5. Dokümantasyon
- ✅ `NOTIFICATION_SYSTEM_GUIDE.md` - Detaylı kurulum kılavuzu
- ✅ `.env.example` - VAPID key eklendi

---

## 🚀 Hızlı Kurulum (5 Dakika)

### Adım 1: Migration'ı Çalıştırın
```sql
-- Supabase Dashboard → SQL Editor'de çalıştırın
-- Dosya: supabase/migrations/20251207_notification_system.sql
```

### Adım 2: VAPID Keys Oluşturun
```bash
npx web-push generate-vapid-keys
```

### Adım 3: .env Dosyasına Ekleyin
```bash
# .env dosyanıza ekleyin
VITE_VAPID_PUBLIC_KEY=BNxxxxxxxxxxxxxxxxx...
```

Supabase Dashboard → Settings → Edge Functions → Secrets'a da ekleyin:
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT=mailto:your-email@tedris.com`

### Adım 4: Service Worker Kaydı
`index.html` dosyasının sonuna (</body> öncesi) ekleyin:

```html
<script>
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('SW registered'))
      .catch(err => console.error('SW failed:', err));
  }
</script>
```

### Adım 5: PWA Manifest
`index.html` head bölümüne ekleyin:

```html
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#2BB4A9">
```

`public/manifest.json` oluşturun:
```json
{
  "name": "TedrisEDU Platform",
  "short_name": "TedrisEDU",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#F7F8FC",
  "theme_color": "#2BB4A9",
  "icons": [
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

### Adım 6: Icon Ekleyin
`public/` klasörüne ekleyin:
- `icon-192x192.png` (192x192 boyutunda logo)
- `badge-72x72.png` (72x72 boyutunda küçük icon)

### Adım 7: Edge Function Deploy
```bash
supabase functions deploy send-push-notification
```

---

## 💡 Kullanım Örnekleri

### Otomatik Bildirim (Zaten Çalışıyor!)
```typescript
// Test atandığında otomatik bildirim gider
await diagnosisTestManagementService.assignTest(config, teacherId);
// ✅ Öğrenciye bildirim gönderildi!
```

### Manuel Bildirim Gönderme
```typescript
import { notifyTestAssigned } from './services/multiChannelNotificationService';

// Test atandı bildirimi
await notifyTestAssigned(studentId, 'Matematik Testi', testId, 'diagnosis');

// Ödev hatırlatması
await notifyHomeworkReminder(studentId, 'Ödevini tamamlamayı unutma!');

// Özel bildirim
await sendStudentNotification({
  studentId: 'student-id',
  type: 'general',
  title: 'Önemli!',
  message: 'Yarın sınav var',
  actionUrl: '/student-dashboard'
});
```

### Öğrenci Bildirim Ayarları
```tsx
import NotificationSettingsModal from './components/NotificationSettingsModal';

<NotificationSettingsModal
  isOpen={showSettings}
  onClose={() => setShowSettings(false)}
  studentId={student.id}
/>
```

---

## 🎯 Bildirim Kanalları

| Kanal | Durum | Açıklama |
|-------|-------|----------|
| 🔔 **Push** | ✅ Hazır | Tarayıcı bildirimi (PWA) |
| 💬 **WhatsApp** | ⚠️ Manuel | WhatsApp Business API gerekli |
| 📧 **Email** | ⚠️ Opsiyonel | SMTP yapılandırması gerekli |
| 📱 **Uygulama İçi** | ✅ Çalışıyor | Mevcut sistem |

---

## 🔧 Diğer Servislere Entegrasyon

### Question Bank
```typescript
// services/questionBankService.ts
import { notifyTestAssigned } from './multiChannelNotificationService';

async assignQuestionBank(studentId, qbId, title) {
  // ... mevcut kod ...
  await notifyTestAssigned(studentId, title, qbId, 'question_bank');
}
```

### PDF Test
```typescript
// services/pdfTestService.ts
import { notifyTestAssigned } from './multiChannelNotificationService';

async assignPDFTest(studentId, testId, title) {
  // ... mevcut kod ...
  await notifyTestAssigned(studentId, title, testId, 'pdf');
}
```

### Ödev Atama
```typescript
import { notifyAssignmentCreated } from './multiChannelNotificationService';

async createAssignment(studentId, title, dueDate) {
  // ... assignment oluştur ...
  await notifyAssignmentCreated(studentId, title, assignmentId, dueDate);
}
```

---

## 🧪 Test Etme

### 1. Basit Test
```typescript
import { sendLocalNotification } from './services/pushNotificationService';

await sendLocalNotification('Test', {
  body: 'Bildirim çalışıyor! 🎉'
});
```

### 2. Tam Test
1. ✅ Öğrenci olarak giriş yap
2. ✅ Bildirim ayarlarını aç
3. ✅ Push notifications'ı etkinleştir
4. ✅ Öğretmen olarak test ata
5. ✅ Öğrencinin telefonuna bildirim gelsin!

---

## 📊 Bildirim Tercihleri

Öğrenciler şunları seçebilir:

### Kanallar
- [ ] Push Bildirimleri
- [ ] WhatsApp Bildirimleri  
- [ ] Email Bildirimleri

### Bildirim Türleri
- [ ] Ödev Atamaları
- [ ] Test Atamaları
- [ ] Ödev Hatırlatmaları
- [ ] Ders Hatırlatmaları
- [ ] Başarı Bildirimleri

---

## 🐛 Sorun Giderme

### Push Çalışmıyor?
1. ✅ HTTPS kullanıyor musunuz? (localhost hariç)
2. ✅ Service Worker kayıtlı mı? → `chrome://serviceworker-internals/`
3. ✅ Tarayıcı izni verildi mi?
4. ✅ VAPID keys doğru mu?

### Bildirim Gelmiyor?
1. ✅ Migration çalıştırıldı mı?
2. ✅ Öğrenci tercihleri aktif mi?
3. ✅ Console'da hata var mı?
4. ✅ Network tab'ında istek gidiyor mu?

---

## 📚 Dosya Yapısı

```
project/
├── services/
│   ├── pushNotificationService.ts          # Push notification yönetimi
│   ├── multiChannelNotificationService.ts  # Merkezi bildirim servisi
│   └── diagnosisTestManagementService.ts   # ✅ Entegre edildi
├── components/
│   └── NotificationSettingsModal.tsx       # Bildirim ayarları UI
├── public/
│   ├── sw.js                               # Service Worker
│   ├── manifest.json                       # PWA manifest
│   ├── icon-192x192.png                    # App icon
│   └── badge-72x72.png                     # Notification badge
├── supabase/
│   ├── migrations/
│   │   └── 20251207_notification_system.sql
│   └── functions/
│       └── send-push-notification/
│           └── index.ts
└── NOTIFICATION_SYSTEM_GUIDE.md            # Detaylı kılavuz
```

---

## ✨ Özellikler

- ✅ **Çok Kanallı**: Push, WhatsApp, Email, Uygulama İçi
- ✅ **Özelleştirilebilir**: Öğrenci kendi tercihlerini seçer
- ✅ **Otomatik**: Test/ödev atandığında otomatik gönderim
- ✅ **Geçmiş**: Tüm bildirimler kaydedilir
- ✅ **PWA Desteği**: Offline çalışma, home screen
- ✅ **Güvenli**: RLS policies, VAPID encryption

---

## 🎉 Sonuç

Artık öğrencileriniz:
- 📱 Telefonlarına push notification alabilir
- 💬 WhatsApp'tan bildirim alabilir (manuel)
- 📧 Email bildirimi alabilir (opsiyonel)
- 🔔 Uygulama içinde bildirim görür

**Detaylı bilgi için:** `NOTIFICATION_SYSTEM_GUIDE.md`

---

## 📞 Destek

Sorularınız için:
- 📖 Detaylı Kılavuz: `NOTIFICATION_SYSTEM_GUIDE.md`
- 🐛 Sorun Bildirimi: GitHub Issues
- 💬 Topluluk: Discord/Slack

**Başarılar! 🚀**
