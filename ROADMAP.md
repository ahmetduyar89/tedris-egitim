# TedrisEDU - Geliştirme Yol Haritası

> Bu doküman, sistemin kapsamlı analizine dayanarak hazırlanmış iyileştirme ve geliştirme planını içermektedir.

---

## Faz 1: Kritik Düzeltmeler (Acil - 1-2 Hafta)

### 1.1 Güvenlik İyileştirmeleri

- [ ] **CORS Politikasını Sıkılaştır**
  - `Access-Control-Allow-Origin: '*'` yerine spesifik domain'ler tanımla
  - Dosya: `supabase/functions/*/index.ts`
  ```typescript
  // Önce
  'Access-Control-Allow-Origin': '*'

  // Sonra
  'Access-Control-Allow-Origin': 'https://tedrisedu.com'
  ```

- [ ] **Rate Limiting Ekle**
  - AI endpoint'lerine kullanıcı bazlı rate limit
  - Supabase Edge Function'larda Redis veya in-memory cache ile
  - Önerilen limitler:
    - Test oluşturma: 10/saat
    - Cevap kontrolü: 50/saat
    - Analiz: 20/saat

- [ ] **Input Validation Güçlendir**
  - Tüm form input'larını validate et (zod veya yup)
  - SQL injection ve XSS kontrollerini gözden geçir
  - AI prompt'larında injection kontrolü artır

- [ ] **Session Yönetimini İyileştir**
  - Token invalidation server-side implement et
  - Concurrent session limiti ekle
  - Session timeout süresini yapılandırılabilir yap

### 1.2 Kritik Bug Düzeltmeleri

- [ ] **Memory Leak Kontrolü**
  - Realtime subscription cleanup'larını doğrula
  - useEffect cleanup fonksiyonlarını kontrol et
  - Event listener'ların düzgün kaldırıldığından emin ol

- [ ] **Error Boundary Ekle**
  - Root level error boundary
  - Sayfa bazlı error boundary'ler
  - Kullanıcı dostu hata mesajları

```typescript
// components/ErrorBoundary.tsx oluştur
class ErrorBoundary extends React.Component {
  // Implement error catching and fallback UI
}
```

---

## Faz 2: Mimari İyileştirmeler (2-4 Hafta)

### 2.1 State Management Entegrasyonu

- [ ] **Zustand Kur ve Yapılandır**
  ```bash
  npm install zustand
  ```

- [ ] **Global Store'lar Oluştur**
  - [ ] `stores/authStore.ts` - Kullanıcı oturumu
  - [ ] `stores/studentStore.ts` - Öğrenci verileri
  - [ ] `stores/notificationStore.ts` - Bildirimler
  - [ ] `stores/uiStore.ts` - Modal, sidebar, tema durumları

- [ ] **Mevcut useState Kullanımlarını Migrate Et**
  - Auth context'i Zustand'a taşı
  - Öğrenci listesi gibi paylaşılan state'leri merkeze al

### 2.2 Data Fetching Katmanı

- [ ] **React Query (TanStack Query) Ekle**
  ```bash
  npm install @tanstack/react-query
  ```

- [ ] **Query Client Yapılandır**
  ```typescript
  // lib/queryClient.ts
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 dakika
        cacheTime: 10 * 60 * 1000, // 10 dakika
        retry: 2,
      },
    },
  });
  ```

- [ ] **Custom Hook'lar Oluştur**
  - [ ] `hooks/queries/useStudents.ts`
  - [ ] `hooks/queries/useTests.ts`
  - [ ] `hooks/queries/useNotifications.ts`
  - [ ] `hooks/mutations/useCreateTest.ts`

### 2.3 Klasör Yapısını Yeniden Düzenle

```
src/
├── features/                    # Feature-based modüller
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types.ts
│   ├── students/
│   ├── tests/
│   ├── gamification/
│   ├── turkish-learning/
│   └── private-lessons/
├── shared/                      # Paylaşılan kodlar
│   ├── components/
│   ├── hooks/
│   ├── utils/
│   └── types/
├── lib/                         # Üçüncü parti konfigürasyonlar
│   ├── supabase.ts
│   ├── queryClient.ts
│   └── gemini.ts
└── app/                         # Sayfa routing
    └── pages/
```

- [ ] Feature modüllerini oluştur
- [ ] Shared component'ları ayır
- [ ] Import path'leri güncelle

---

## Faz 3: Kod Kalitesi (3-5 Hafta)

### 3.1 Büyük Component'ları Parçala

- [ ] **WhatsAppMessageModal.tsx**
  - Şu an: Çok büyük, birden fazla sorumluluk
  - Hedef: 5-6 küçük component'a böl
  - [ ] `ContactSelector.tsx`
  - [ ] `MessageComposer.tsx`
  - [ ] `TemplateSelector.tsx`
  - [ ] `MessagePreview.tsx`
  - [ ] `SendProgress.tsx`

- [ ] **PrivateLessonSchedule.tsx**
  - [ ] `CalendarView.tsx`
  - [ ] `LessonCard.tsx`
  - [ ] `ScheduleForm.tsx`
  - [ ] `AttendanceTracker.tsx`

- [ ] **TutorDashboard.tsx**
  - [ ] Dashboard widget'larını ayrı component'lara çıkar
  - [ ] Her widget kendi data fetching'ini yapsın

### 3.2 TypeScript İyileştirmeleri

- [ ] **`any` Tiplerini Kaldır**
  ```bash
  # Tüm any kullanımlarını bul
  grep -r ": any" --include="*.ts" --include="*.tsx"
  ```
  - Her `any`'yi uygun tiple değiştir
  - Generic tipler kullan

- [ ] **Strict Mode Kontrolü**
  - `tsconfig.json`'da strict mode aktif mi kontrol et
  - `noImplicitAny: true` olduğundan emin ol

- [ ] **Type-safe Supabase Queries**
  ```bash
  npx supabase gen types typescript --local > types/database.ts
  ```

### 3.3 Linting ve Formatting

- [ ] **ESLint Kurallarını Güçlendir**
  ```bash
  npm install eslint-plugin-react-hooks eslint-plugin-jsx-a11y
  ```

- [ ] **Prettier Yapılandır**
  ```json
  // .prettierrc
  {
    "semi": true,
    "singleQuote": true,
    "tabWidth": 2,
    "trailingComma": "es5"
  }
  ```

- [ ] **Pre-commit Hook Ekle**
  ```bash
  npm install husky lint-staged
  npx husky install
  ```

---

## Faz 4: Test Altyapısı (4-6 Hafta)

### 4.1 Unit Test Kurulumu

- [ ] **Vitest Yapılandırmasını Tamamla**
  ```typescript
  // vitest.config.ts
  export default defineConfig({
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './test/setup.ts',
      coverage: {
        reporter: ['text', 'html'],
        threshold: {
          lines: 70,
          functions: 70,
          branches: 70,
        },
      },
    },
  });
  ```

- [ ] **Kritik Servisleri Test Et**
  - [ ] `gamificationService.test.ts`
  - [ ] `spacedRepetitionService.test.ts`
  - [ ] `secureAIService.test.ts`
  - [ ] `turkishLearningService.test.ts`

### 4.2 Component Testleri

- [ ] **Test Utilities Oluştur**
  ```typescript
  // test/utils.tsx
  const customRender = (ui, options) =>
    render(ui, { wrapper: AllProviders, ...options });
  ```

- [ ] **Kritik Component'ları Test Et**
  - [ ] `LoginPage.test.tsx`
  - [ ] `TestTakingPage.test.tsx`
  - [ ] `StudentDashboard.test.tsx`
  - [ ] `QuestionBankPage.test.tsx`

### 4.3 E2E Test Kurulumu

- [ ] **Playwright veya Cypress Kur**
  ```bash
  npm install -D @playwright/test
  npx playwright install
  ```

- [ ] **Kritik Flow'ları Test Et**
  - [ ] Kullanıcı girişi
  - [ ] Test oluşturma
  - [ ] Test çözme
  - [ ] Öğrenci ekleme

---

## Faz 5: Performans Optimizasyonu (5-7 Hafta)

### 5.1 Bundle Analizi ve Optimizasyonu

- [ ] **Bundle Analyzer Ekle**
  ```bash
  npm install -D rollup-plugin-visualizer
  ```
  ```typescript
  // vite.config.ts
  import { visualizer } from 'rollup-plugin-visualizer';
  plugins: [visualizer({ open: true })]
  ```

- [ ] **Code Splitting İyileştir**
  - Route-based splitting zaten var
  - Component-level lazy loading ekle
  - Büyük kütüphaneleri dynamic import yap

- [ ] **Tree Shaking Kontrolü**
  - Lucide-react: Sadece kullanılan ikonları import et
  - Recharts: Sadece kullanılan chart'ları import et

### 5.2 React Optimizasyonları

- [ ] **Memoization Ekle**
  ```typescript
  // Ağır hesaplamalar için useMemo
  const sortedStudents = useMemo(() =>
    students.sort((a, b) => b.xp - a.xp),
    [students]
  );

  // Callback'ler için useCallback
  const handleSubmit = useCallback(() => {...}, [deps]);
  ```

- [ ] **React.memo Kullan**
  - Liste item component'larını memo'la
  - Sık render olan component'ları memo'la

- [ ] **Virtualization Ekle**
  ```bash
  npm install @tanstack/react-virtual
  ```
  - Öğrenci listeleri için
  - Soru bankası listeleri için

### 5.3 Veritabanı Optimizasyonu

- [ ] **Query Optimizasyonu**
  - N+1 query'leri tespit et ve düzelt
  - Gereksiz select('*') kullanımlarını kaldır
  - Index'leri gözden geçir

- [ ] **Pagination Ekle**
  - Öğrenci listesi
  - Test geçmişi
  - Bildirimler

---

## Faz 6: Kullanıcı Deneyimi (6-8 Hafta)

### 6.1 Loading States

- [ ] **Skeleton Loader'lar Ekle**
  - Dashboard skeleton
  - Liste skeleton
  - Card skeleton

- [ ] **Optimistic Updates**
  - Form submit'lerde anında UI güncellemesi
  - Hata durumunda rollback

### 6.2 Error Handling UX

- [ ] **Toast Notification Sistemi**
  ```bash
  npm install react-hot-toast
  ```
  - Başarı mesajları
  - Hata mesajları
  - Bilgi mesajları

- [ ] **Form Validation UX**
  - Anlık validation feedback
  - Açıklayıcı hata mesajları

### 6.3 Accessibility (a11y)

- [ ] **ARIA Labels Ekle**
- [ ] **Keyboard Navigation**
- [ ] **Color Contrast Kontrolü**
- [ ] **Screen Reader Uyumluluğu**

### 6.4 Responsive İyileştirmeler

- [ ] **Mobile-first Refactor**
- [ ] **Touch Gesture Desteği**
- [ ] **PWA Özelliklerini Aktif Et**
  - Service Worker
  - Offline desteği
  - Install prompt

---

## Faz 7: i18n ve Lokalizasyon (Opsiyonel - 8-10 Hafta)

### 7.1 i18n Altyapısı

- [ ] **react-i18next Kur**
  ```bash
  npm install react-i18next i18next
  ```

- [ ] **Çeviri Dosyaları Oluştur**
  ```
  locales/
  ├── tr/
  │   ├── common.json
  │   ├── dashboard.json
  │   └── tests.json
  └── en/
      ├── common.json
      └── ...
  ```

- [ ] **Hardcoded String'leri Migrate Et**
  - Manuel gün/ay çevirilerini kaldır
  - Tüm UI text'lerini i18n key'leriyle değiştir

---

## Faz 8: DevOps ve Monitoring (Ongoing)

### 8.1 CI/CD Pipeline

- [ ] **GitHub Actions Workflow**
  ```yaml
  # .github/workflows/ci.yml
  name: CI
  on: [push, pull_request]
  jobs:
    test:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - run: npm ci
        - run: npm run lint
        - run: npm run test
        - run: npm run build
  ```

### 8.2 Monitoring

- [ ] **Error Tracking**
  ```bash
  npm install @sentry/react
  ```

- [ ] **Analytics**
  - Kullanıcı davranış analizi
  - Feature kullanım metrikleri

- [ ] **Performance Monitoring**
  - Core Web Vitals takibi
  - API response time

### 8.3 Logging

- [ ] **Structured Logging**
  - Client-side error logging
  - API call logging
  - User action logging

---

## Öncelik Matrisi

| Faz | Öncelik | Etki | Efor | Tavsiye |
|-----|---------|------|------|---------|
| Faz 1: Kritik Düzeltmeler | 🔴 Acil | Yüksek | Düşük | Hemen başla |
| Faz 2: Mimari | 🟠 Yüksek | Yüksek | Orta | 2. sprint |
| Faz 3: Kod Kalitesi | 🟠 Yüksek | Orta | Orta | Paralel |
| Faz 4: Test | 🟡 Orta | Yüksek | Yüksek | 3. sprint |
| Faz 5: Performans | 🟡 Orta | Orta | Orta | 4. sprint |
| Faz 6: UX | 🟢 Normal | Orta | Orta | 5. sprint |
| Faz 7: i18n | 🔵 Düşük | Düşük | Orta | Gerekirse |
| Faz 8: DevOps | 🟠 Yüksek | Yüksek | Düşük | Sürekli |

---

## Zaman Çizelgesi (Tahmini)

```
Hafta 1-2:   [████████████████████] Faz 1 - Kritik Düzeltmeler
Hafta 2-4:   [████████████████████] Faz 2 - Mimari
Hafta 3-5:   [████████████████████] Faz 3 - Kod Kalitesi
Hafta 4-6:   [████████████████████] Faz 4 - Test
Hafta 5-7:   [████████████████████] Faz 5 - Performans
Hafta 6-8:   [████████████████████] Faz 6 - UX
Hafta 8-10:  [████████████████████] Faz 7 - i18n (opsiyonel)
Sürekli:     [████████████████████] Faz 8 - DevOps
```

---

## Başarı Kriterleri

### Faz 1 Tamamlandığında
- [ ] Güvenlik açıkları kapatıldı
- [ ] Kritik hatalar düzeltildi
- [ ] Error boundary aktif

### Faz 2 Tamamlandığında
- [ ] State management çalışıyor
- [ ] React Query entegre
- [ ] Klasör yapısı düzenlendi

### Faz 4 Tamamlandığında
- [ ] Test coverage > %70
- [ ] CI pipeline çalışıyor
- [ ] E2E testler geçiyor

### Tüm Fazlar Tamamlandığında
- [ ] Lighthouse score > 90
- [ ] Bundle size < 500KB (gzipped)
- [ ] Error rate < %0.1
- [ ] User satisfaction > %80

---

## Notlar

- Her faz sonunda code review yapılmalı
- Büyük değişiklikler feature branch'lerde geliştirilmeli
- Her faz için dokümantasyon güncellenmeli
- Kullanıcı feedback'i sürekli toplanmalı

---

*Bu doküman yaşayan bir dokümandır ve proje ilerledikçe güncellenmelidir.*

*Son güncelleme: 2026-02-05*
