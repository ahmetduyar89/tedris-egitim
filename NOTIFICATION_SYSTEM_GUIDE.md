# 📱 Çok Kanallı Bildirim Sistemi - Kurulum ve Kullanım Kılavuzu

## 🎯 Genel Bakış

Sistemde öğretmen bir öğrenciye ödev, test veya başka bir çalışma atadığında, öğrenciye **otomatik olarak** aşağıdaki kanallardan bildirim gönderilir:

1. **📱 Push Notifications (PWA)** - Telefon/tablet/bilgisayara tarayıcı bildirimi
2. **💬 WhatsApp** - WhatsApp mesajı
3. **📧 Email** - Email bildirimi
4. **🔔 Uygulama İçi** - Mevcut bildirim sistemi

Her öğrenci hangi kanallardan bildirim almak istediğini **Bildirim Ayarları** sayfasından seçebilir.

---

## 📋 Kurulum Adımları

### 1. Veritabanı Migration'ını Çalıştırın

```bash
# Supabase Dashboard'a gidin
# SQL Editor'ü açın
# Aşağıdaki dosyayı çalıştırın:
supabase/migrations/20251207_notification_system.sql
```

Bu migration şunları oluşturur:
- `student_notification_preferences` - Öğrenci bildirim tercihleri
- `push_subscriptions` - Push notification abonelikleri
- `notification_history` - Gönderilen bildirimlerin geçmişi

### 2. VAPID Keys Oluşturun (Push Notifications için)

Push notifications için VAPID (Voluntary Application Server Identification) anahtarları gereklidir:

```bash
# Node.js kullanarak VAPID keys oluşturun
npx web-push generate-vapid-keys
```

Bu size şöyle bir çıktı verecek:
```
Public Key: BNxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Private Key: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 3. Environment Variables Ekleyin

`.env` dosyanıza ekleyin:

```env
# VAPID Keys for Push Notifications
VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
VAPID_SUBJECT=mailto:your-email@tedris.com
```

Supabase Dashboard → Project Settings → Edge Functions → Secrets'a da ekleyin:
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`

### 4. Service Worker'ı Kaydedin

`public/sw.js` dosyası zaten oluşturuldu. Şimdi `index.html`'e service worker kaydını ekleyin:

```html
<!-- index.html'in sonuna, </body> etiketinden önce ekleyin -->
<script>
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('Service Worker registered:', reg))
      .catch(err => console.error('Service Worker registration failed:', err));
  }
</script>
```

### 5. PWA Manifest Ekleyin

`public/manifest.json` oluşturun:

```json
{
  "name": "TedrisEDU Platform",
  "short_name": "TedrisEDU",
  "description": "Özel Ders Takip Sistemi",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#F7F8FC",
  "theme_color": "#2BB4A9",
  "icons": [
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

`index.html` head bölümüne ekleyin:

```html
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#2BB4A9">
```

### 6. Push Notification Icon'ları Ekleyin

`public/` klasörüne şu dosyaları ekleyin:
- `icon-192x192.png` - 192x192 boyutunda uygulama ikonu
- `icon-512x512.png` - 512x512 boyutunda uygulama ikonu
- `badge-72x72.png` - 72x72 boyutunda bildirim badge'i

### 7. Supabase Edge Function Deploy Edin

```bash
# Push notification gönderme fonksiyonunu deploy edin
supabase functions deploy send-push-notification

# Email notification gönderme fonksiyonunu deploy edin (opsiyonel)
supabase functions deploy send-email-notification
```

### 8. pushNotificationService.ts'i Güncelleyin

`services/pushNotificationService.ts` dosyasında VAPID_PUBLIC_KEY'i güncelleyin:

```typescript
// Satır 7'yi bulun ve gerçek public key'inizi ekleyin
const VAPID_PUBLIC_KEY = 'BNxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
```

---

## 🚀 Kullanım

### Öğrenci Tarafı

#### 1. Bildirim Ayarlarını Açma

`StudentDashboard.tsx` veya istediğiniz bir sayfaya bildirim ayarları butonu ekleyin:

```tsx
import NotificationSettingsModal from '../components/NotificationSettingsModal';

function StudentDashboard() {
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  
  return (
    <>
      <button onClick={() => setShowNotificationSettings(true)}>
        📱 Bildirim Ayarları
      </button>
      
      <NotificationSettingsModal
        isOpen={showNotificationSettings}
        onClose={() => setShowNotificationSettings(false)}
        studentId={currentStudent.id}
      />
    </>
  );
}
```

#### 2. Push Notification İzni İsteme

Öğrenci ilk giriş yaptığında push notification izni isteyin:

```tsx
import { requestNotificationPermission, subscribeToPushNotifications } from '../services/pushNotificationService';

useEffect(() => {
  const setupPushNotifications = async () => {
    const permission = await requestNotificationPermission();
    if (permission === 'granted') {
      await subscribeToPushNotifications();
    }
  };
  
  setupPushNotifications();
}, []);
```

### Öğretmen Tarafı

#### Otomatik Bildirim Gönderme

Artık test, ödev veya başka bir şey atadığınızda **otomatik olarak** bildirim gönderilir!

**Örnek: Test Atama**
```typescript
// diagnosisTestManagementService.ts içinde zaten entegre edildi
await diagnosisTestManagementService.assignTest(config, teacherId);
// ✅ Otomatik olarak tüm öğrencilere bildirim gönderilir!
```

#### Manuel Bildirim Gönderme

İsterseniz manuel olarak da bildirim gönderebilirsiniz:

```typescript
import { 
  sendStudentNotification,
  notifyAssignmentCreated,
  notifyTestAssigned,
  notifyHomeworkReminder 
} from '../services/multiChannelNotificationService';

// Ödev atandığında
await notifyAssignmentCreated(
  studentId,
  'Matematik Ödev 5',
  assignmentId,
  '2025-12-15'
);

// Test atandığında
await notifyTestAssigned(
  studentId,
  'Fizik Tanı Testi',
  testId,
  'diagnosis'
);

// Ödev hatırlatması
await notifyHomeworkReminder(
  studentId,
  'Bu hafta matematik ödevini tamamlamayı unutma!'
);

// Özel bildirim
await sendStudentNotification({
  studentId: 'student-id',
  type: 'general',
  title: 'Önemli Duyuru',
  message: 'Yarın sınav var, hazırlanmayı unutma!',
  actionUrl: '/student-dashboard'
});
```

#### Toplu Bildirim Gönderme

Birden fazla öğrenciye aynı anda bildirim gönderin:

```typescript
import { sendBulkNotifications } from '../services/multiChannelNotificationService';

await sendBulkNotifications(
  ['student-id-1', 'student-id-2', 'student-id-3'],
  {
    type: 'homework',
    title: 'Ödev Hatırlatması',
    message: 'Bu hafta verilen ödevleri tamamlamayı unutmayın!'
  }
);
```

---

## 🔧 Diğer Servislere Entegrasyon

### Question Bank Service

`services/questionBankService.ts` dosyasına ekleyin:

```typescript
import { notifyTestAssigned } from './multiChannelNotificationService';

// assignQuestionBank fonksiyonuna ekleyin
async assignQuestionBank(studentId: string, questionBankId: string, title: string) {
  // ... mevcut kod ...
  
  // Bildirim gönder
  await notifyTestAssigned(studentId, title, questionBankId, 'question_bank');
}
```

### PDF Test Service

`services/pdfTestService.ts` dosyasına ekleyin:

```typescript
import { notifyTestAssigned } from './multiChannelNotificationService';

// assignPDFTest fonksiyonuna ekleyin
async assignPDFTest(studentId: string, testId: string, title: string) {
  // ... mevcut kod ...
  
  // Bildirim gönder
  await notifyTestAssigned(studentId, title, testId, 'pdf');
}
```

### Assignment Service

Ödev atama servisinize ekleyin:

```typescript
import { notifyAssignmentCreated } from './multiChannelNotificationService';

async createAssignment(studentId: string, title: string, dueDate: string) {
  // ... assignment oluştur ...
  
  // Bildirim gönder
  await notifyAssignmentCreated(studentId, title, assignmentId, dueDate);
}
```

---

## 📊 Bildirim Geçmişini Görüntüleme

Gönderilen bildirimlerin geçmişini görüntüleyin:

```typescript
const { data: history } = await supabase
  .from('notification_history')
  .select('*')
  .eq('student_id', studentId)
  .order('created_at', { ascending: false });
```

---

## 🧪 Test Etme

### 1. Push Notifications Test

```typescript
import { sendLocalNotification } from '../services/pushNotificationService';

// Test bildirimi gönder
await sendLocalNotification('Test Bildirimi', {
  body: 'Bu bir test bildirimidir',
  icon: '/icon-192x192.png'
});
```

### 2. Tam Sistem Testi

1. Öğrenci olarak giriş yapın
2. Bildirim Ayarları'nı açın
3. Push notifications'ı etkinleştirin
4. Öğretmen olarak giriş yapın
5. O öğrenciye bir test atayın
6. Öğrencinin telefonuna bildirim gelmeli!

---

## 🎨 Özelleştirme

### Bildirim Mesajlarını Özelleştirme

`services/multiChannelNotificationService.ts` dosyasında mesaj formatlarını değiştirebilirsiniz:

```typescript
const formatWhatsAppMessage = (payload: NotificationPayload): string => {
  // Kendi formatınızı oluşturun
  return `🎓 *TedrisEDU*\n\n${payload.title}\n\n${payload.message}`;
};
```

### Yeni Bildirim Türleri Ekleme

```typescript
export type NotificationType = 
  | 'assignment' 
  | 'test' 
  | 'homework' 
  | 'lesson' 
  | 'achievement' 
  | 'general'
  | 'your_new_type'; // Yeni tür ekleyin

// Emoji ekleyin
const getNotificationEmoji = (type: NotificationType): string => {
  const emojis: Record<NotificationType, string> = {
    // ... mevcut emojiler ...
    your_new_type: '🎉'
  };
  return emojis[type] || '📢';
};
```

---

## 🔒 Güvenlik Notları

1. **VAPID Keys'i Güvende Tutun**: Private key'i asla client-side kod'a eklemeyin
2. **RLS Policies**: Veritabanı migration'ında RLS policies zaten eklenmiş
3. **Rate Limiting**: Çok fazla bildirim gönderilmesini önlemek için rate limiting ekleyebilirsiniz

---

## 🐛 Sorun Giderme

### Push Notifications Çalışmıyor

1. HTTPS kullandığınızdan emin olun (localhost hariç)
2. Service Worker'ın kayıtlı olduğunu kontrol edin: `chrome://serviceworker-internals/`
3. Tarayıcı izinlerini kontrol edin
4. VAPID keys'in doğru olduğundan emin olun

### WhatsApp Bildirimleri Gönderilmiyor

1. Telefon numarasının doğru formatta olduğundan emin olun
2. WhatsApp Business API için ödeme planınızı kontrol edin
3. Şu an için WhatsApp bildirimleri manuel gönderim için hazırlanıyor

### Email Bildirimleri Çalışmıyor

1. Email Edge Function'ının deploy edildiğinden emin olun
2. SMTP ayarlarını kontrol edin
3. Supabase logs'u kontrol edin

---

## 📚 Ek Kaynaklar

- [Web Push Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [PWA Best Practices](https://web.dev/progressive-web-apps/)
- [VAPID Protocol](https://datatracker.ietf.org/doc/html/rfc8292)

---

## ✅ Checklist

Kurulumu tamamladıktan sonra kontrol edin:

- [ ] Migration çalıştırıldı
- [ ] VAPID keys oluşturuldu ve .env'e eklendi
- [ ] Service Worker kayıtlı
- [ ] PWA manifest eklendi
- [ ] Icon'lar eklendi
- [ ] Edge Function deploy edildi
- [ ] pushNotificationService.ts'de public key güncellendi
- [ ] Test bildirimi başarıyla gönderildi
- [ ] Öğrenci bildirim ayarlarını açabiliyor
- [ ] Öğretmen test atadığında bildirim gidiyor

---

## 🎉 Tebrikler!

Artık öğrencileriniz telefonlarına bildirim alabilir! 🚀

Sorularınız için: [GitHub Issues](https://github.com/your-repo/issues)
