# 🏗️ Tedris Eğitim Platformu Sistem İskeleti ve Teknik Rehber

Bu belge, Tedris Eğitim Platformu'nun teknik mimarisini, dosya yapısını ve modüller arası işleyişini detaylı bir şekilde açıklar. Sistem **React (Vite)** frontend ve **Supabase (PostgreSQL)** backend mimarisi üzerine kuruludur.

---

## 🛠️ 1. Genel Teknoloji Yığını (Tech Stack)

*   **Frontend:** React 18, TypeScript, Tailwind CSS
*   **Backend:** Supabase (Auth, Database, Realtime, Edge Functions)
*   **Veritabanı:** PostgreSQL (Supabase üzerinde)
*   **Yönlendirme (Routing):** `App.tsx` içerisinde state-based (rol tabanlı) yönlendirme.
*   **Gerçek Zamanlılık:** Supabase Realtime (Bildirimler ve chat için).

---

## 👤 2. Rol Tabanlı Erişim Kontrolü (RBAC)

Sistemde 4 ana rol tanımlıdır:
1.  **Öğretmen (Tutor):** Öğrenci yönetimi, ödev/test atama, içerik kütüphanesi yönetimi.
2.  **Öğrenci (Student):** Ders çalışma, test çözme, ödev teslimi, gelişim takibi.
3.  **Veli (Parent):** Öğrencinin performansını, ödevlerini ve haftalık planını izleme.
4.  **Admin:** Genel sistem yönetimi (Öğretmen dashboard'u üzerinden yetkilendirilmiş).

---

## 👨‍🏫 3. Öğretmen (Tutor) Portalı Detayları

Öğretmen portalı, eğitimin yönetim merkezidir. `pages/TutorDashboard.tsx` ana dosyadır.

### Ana Modüller ve Dosya Yolları:
*   **Genel Bakış (Overview):** `components/DashboardOverview.tsx`
    *   Öğrenci istatistikleri, haftalık ders programı özeti.
*   **Öğrenci Listesi:** `TutorDashboard.tsx` içindeki `renderStudentsList`.
    *   Öğrenci ekleme: `components/tutor-dashboard/AddStudentModal.tsx`
    *   Öğrenci düzenleme: `components/tutor-dashboard/EditStudentModal.tsx`
*   **Öğrenci Detay Sayfası:** `pages/StudentDetailPage.tsx`
    *   Öğretmenin bir öğrenciye özel tüm detayları gördüğü, ödev atadığı yer.
*   **İçerik Kütüphanesi:** `pages/ContentLibraryPage.tsx`
    *   PDF, HTML veya etkileşimli içeriklerin yüklendiği ve yönetildiği alan.
*   **İnteraktif İçerik Oluşturucu:** `pages/CreateInteractiveMaterialPage.tsx`
*   **Soru Bankası & Test Atama:** `pages/QuestionBankPage.tsx` ve `pages/TeacherDiagnosisTestsPage.tsx`
*   **Özel Ders Takvimi:** `components/PrivateLessonSchedule.tsx`
*   **WhatsApp İletişim:** `components/WhatsAppMessageModal.tsx`

### Ne Nereden Yapılıyor?
*   **Öğrenciye Ödev Atama:** Öğrenci Detay -> Ödevler sekmesi -> "Yeni Ödev" butonu.
*   **Haftalık Program Düzenleme:** Öğrenci Detay -> Haftalık Plan sekmesi.
*   **İçerik Paylaşımı:** Kütüphane -> İçerik Seç -> "Öğrenciye Ata".

---

## 🎓 4. Öğrenci (Student) Portalı Detayları

Öğrenci portalı, tamamen "öğrenci dostu" ve oyunlaştırılmış bir yapıdadır. `pages/StudentDashboard.tsx` ana dosyadır.

### Sekmeler (Tabs):
1.  **Anasayfa (Dashboard):** `components/student-dashboard/DashboardTab.tsx`
    *   Günlük motivasyon mesajı, bugünkü görevler, bitmesi yakın ödevler.
2.  **Çalışma Planım (Adaptive):** `pages/AdaptiveDashboard.tsx`
    *   Öğrencinin eksiklerine göre AI tarafından oluşturulan çalışma rotası.
3.  **Ödevlerim:** `components/student-dashboard/HomeworkTab.tsx`
    *   Öğretmen tarafından atanan ödevlerin listesi ve `pages/SubmitHomeworkPage.tsx` bağlantısı.
4.  **Kütüphane:** `components/student-dashboard/LibraryTab.tsx`
    *   Öğrenciye atanan tüm materyaller (PDF/İnteraktif).
5.  **Öğrenme Haritası (Mastery Map):** `components/student-dashboard/MapTab.tsx`
    *   Konu bazlı ustalık seviyeleri ve Tanı Testleri.
6.  **Aralıklı Tekrar:** `components/SpacedRepetitionDashboard.tsx`
    *   Flashcard'lar ile öğrenme kontrolü.

### Oyunlaştırma Motoru:
*   Zeka ve mantık `services/motivationService.ts` dosyasındadır.
*   XP puanları ve Seviye (Level) hesaplamaları burada yapılır.
*   Rozet (Badge) kontrolü `checkAndAwardBadges` fonksiyonu ile yürütülür.

---

## 👪 5. Veli (Parent) Portalı Detayları

Veli portalı, şeffaf bir izleme aracıdır. `pages/ParentDashboard.tsx` ana dosyadır.

### İzleme Alanları:
*   **Haftalık Plan:** `components/ParentWeeklyPlanView.tsx` (Öğrencinin haftalık programı).
*   **Gelişim Analizi:** Dashboard içinde inline (Tanı testi sonuçları ve başarı grafikleri).
*   **Performans:** `components/ParentPerformanceView.tsx` (Test sonuçları, doğruluk oranları).
*   **Ödevler:** `components/ParentAssignmentsView.tsx` (Teslim edilen ve bekleyen ödevler).
*   **Ders Notları:** `components/ParentLessonNotesView.tsx` (Öğretmenin girdiği geri bildirimler).

---

## 💾 6. Veri Modeli ve Veritabanı (Database)

`full_schema.sql` dosyasında tanımlanan ana tabloların mantığı:

| Tablo Adı | Açıklama |
| :--- | :--- |
| `users` | Temel kullanıcı verisi (id, e-posta, rol). |
| `students` | Öğrencilerin profil verileri (grade, xp, level, tutor_id, parent_id). |
| `tutor_students` | Öğretmen-Öğrenci ilişkisini tutan many-to-many tablo. |
| `assignments` | Öğretmenlerin atadığı ödevler. |
| `submissions` | Öğrencilerin ödev teslimleri ve AI/Öğretmen notları. |
| `tests` | Deneme sınavları ve test verileri. |
| `weekly_programs` | Öğrencilerin 7 günlük ders programı (JSONB formatında). |
| `content_library` | Yüklenen ders materyalleri. |
| `chat_messages` | AI Asistan ile yapılan konuşmalar. |

---

## 📂 7. Kritik Dosya Yolları

*   **`App.tsx`**: Sistemin trafik polisi. Giriş yapan kullanıcının rolüne göre hangi dashboard'u açacağını seçer.
*   **`services/dbAdapter.ts`**: Supabase bağlantı noktası.
*   **`types.ts`**: Proje boyunca kullanılan tüm TypeScript arayüzleri (Interface).
*   **`pages/`**: Her bir ana ekran (Landing, Login, Dashboards).
*   **`components/`**: Dashboards içinde kullanılan küçük modüller.
    *   `tutor-dashboard/`: Öğretmen portalına özel parçalar.
    *   `student-dashboard/`: Öğrenci portalına özel parçalar.
*   **`supabase/migrations/`**: Veritabanı şema değişiklikleri.

---

## 🚀 8. Nasıl Değişiklik Yapılır?

1.  **Yeni Bir Sayfa Eklemek:**
    *   `pages/` altına dosyayı oluşturun.
    *   İlgili Dashboard'un (Tutor/Student/Parent) `renderContent` fonksiyonuna yeni bir case ekleyin.
    *   Sidebar'a (`SidebarContent.tsx` vb.) yeni butonu ekleyin.
2.  **Veri Yapısını Değiştirmek:**
    *   `types.ts` dosyasını güncelleyin.
    *   Supabase üzerinden tabloya sütun ekleyin.
    *   İlgili SQL migration dosyasını oluşturun.
3.  **Yeni Bir Rol Eklemek:**
    *   `supabase/migrations/20260306_fix_users_role_constraint.sql` benzeri bir dosyayla veritabanı constraint'ini güncelleyin.
    *   `App.tsx` içindeki yönlendirme mantığını (`renderContent`) güncelleyin.

---

> [!TIP]
> **Tavsiye:** Değişiklik yapmadan önce `types.ts` dosyasındaki ilgili objenin (örneğin `Student` veya `Assignment`) yapısını incelemek, hata yapma riskinizi %90 azaltacaktır.
