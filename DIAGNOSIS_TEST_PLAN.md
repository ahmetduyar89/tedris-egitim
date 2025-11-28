# Tanı Testi Sistemi - Detaylı İyileştirme Planı

## 📋 Mevcut Durum Analizi

### ✅ Var Olanlar:
1. **DiagnosisTestModal** - Öğrenci tarafında modal var
2. **diagnosisTestService** - Temel servis mevcut
3. **Otomatik soru üretimi** - Modüllere göre basit sorular üretiyor
4. **Mastery tracking** - Sonuçlar mastery score'a kaydediliyor

### ❌ Eksikler:
1. **Öğretmen kontrolü yok** - Öğretmen test oluşturamıyor/atayamıyor
2. **AI analizi yok** - Detaylı, objektif analiz yapılmıyor
3. **Öğretmen aksiyonu yok** - Öğretmen sonuçları göremezse aksiyon alamaz
4. **Atama sistemi yok** - Öğrenciye zorunlu test atanamıyor
5. **Kaliteli sorular yok** - Şu an placeholder sorular var

---

## 🎯 Hedef Sistem

### Öğretmen Tarafı:
1. **Tanı Testi Oluşturma Sayfası**
   - Sınıf seviyesi seçimi
   - Ders seçimi (Matematik, Fen, vb.)
   - Kazanım/modül seçimi
   - Soru sayısı belirleme
   - AI ile kaliteli soru üretimi

2. **Test Atama**
   - Öğrenci seçimi
   - Test atama
   - Zorunlu/isteğe bağlı işaretleme
   - Son tarih belirleme

3. **Sonuç Görüntüleme ve Aksiyon**
   - Öğrenci bazında detaylı AI analizi
   - Güçlü/zayıf kazanımlar
   - Önerilen aksiyon planı
   - Özel haftalık program oluşturma
   - Özel ödev atama

### Öğrenci Tarafı:
1. **Test Bildirimi**
   - Giriş yaptığında zorunlu test varsa uyarı
   - Dashboard'da belirgin gösterge

2. **Test Alma**
   - Kaliteli, kazanım bazlı sorular
   - İlerleme göstergesi
   - Kaydetme/devam etme

3. **Sonuç Görüntüleme**
   - AI tarafından hazırlanmış detaylı analiz
   - Güçlü olduğu konular
   - Gelişmesi gereken konular
   - Öneriler

---

## 🏗️ Teknik Mimari

### 1. Veritabanı Yapısı

```sql
-- Öğretmen tarafından oluşturulan tanı testleri
CREATE TABLE diagnosis_tests (
    id UUID PRIMARY KEY,
    teacher_id UUID REFERENCES teachers(id),
    title VARCHAR(255),
    description TEXT,
    subject VARCHAR(100),
    grade INTEGER,
    total_questions INTEGER,
    duration_minutes INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);

-- Test içindeki sorular (AI tarafından üretilmiş)
CREATE TABLE diagnosis_test_questions (
    id UUID PRIMARY KEY,
    test_id UUID REFERENCES diagnosis_tests(id),
    module_id VARCHAR(50),
    module_name VARCHAR(255),
    question_text TEXT,
    options JSONB, -- ["A) ...", "B) ...", "C) ...", "D) ..."]
    correct_answer VARCHAR(10),
    difficulty INTEGER,
    order_index INTEGER
);

-- Öğrencilere atanan testler
CREATE TABLE diagnosis_test_assignments (
    id UUID PRIMARY KEY,
    test_id UUID REFERENCES diagnosis_tests(id),
    student_id UUID REFERENCES students(id),
    teacher_id UUID REFERENCES teachers(id),
    assigned_at TIMESTAMPTZ,
    due_date TIMESTAMPTZ,
    is_mandatory BOOLEAN DEFAULT true,
    status VARCHAR(50), -- 'pending', 'in_progress', 'completed'
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    score INTEGER,
    ai_analysis JSONB
);

-- Öğrenci cevapları
CREATE TABLE diagnosis_test_answers (
    id UUID PRIMARY KEY,
    assignment_id UUID REFERENCES diagnosis_test_assignments(id),
    question_id UUID REFERENCES diagnosis_test_questions(id),
    student_answer VARCHAR(10),
    is_correct BOOLEAN,
    answered_at TIMESTAMPTZ
);

-- Öğretmen aksiyonları
CREATE TABLE diagnosis_test_actions (
    id UUID PRIMARY KEY,
    assignment_id UUID REFERENCES diagnosis_test_assignments(id),
    teacher_id UUID REFERENCES teachers(id),
    action_type VARCHAR(50), -- 'weekly_plan', 'homework', 'review_package', 'note'
    action_data JSONB,
    created_at TIMESTAMPTZ
);
```

### 2. AI Analiz Yapısı

```typescript
interface DiagnosisAIAnalysis {
  overall_assessment: string; // Genel değerlendirme
  proficiency_level: 'beginner' | 'intermediate' | 'advanced'; // Genel seviye
  
  strong_areas: {
    module_name: string;
    module_code: string;
    mastery_score: number;
    comment: string;
  }[];
  
  weak_areas: {
    module_name: string;
    module_code: string;
    mastery_score: number;
    gap_analysis: string; // Eksiklik analizi
    priority: 'high' | 'medium' | 'low';
  }[];
  
  recommendations: {
    type: 'study_plan' | 'practice' | 'review' | 'advanced';
    description: string;
    modules: string[];
    estimated_duration: string;
  }[];
  
  learning_style_insights: string; // Öğrenme stili hakkında gözlemler
  motivation_message: string; // Motive edici mesaj
}
```

### 3. Servis Katmanı

```typescript
// services/diagnosisTestManagementService.ts
export const diagnosisTestManagementService = {
  // Öğretmen: Test oluşturma
  async createDiagnosisTest(teacherId, config): Promise<DiagnosisTest>
  
  // Öğretmen: AI ile soru üretme
  async generateQuestionsWithAI(subject, grade, modules, count): Promise<Question[]>
  
  // Öğretmen: Öğrenciye atama
  async assignTestToStudent(testId, studentId, options): Promise<Assignment>
  
  // Öğrenci: Atanan testleri getir
  async getAssignedTests(studentId): Promise<Assignment[]>
  
  // Öğrenci: Test başlat
  async startTest(assignmentId): Promise<void>
  
  // Öğrenci: Cevap kaydet
  async saveAnswer(assignmentId, questionId, answer): Promise<void>
  
  // Öğrenci: Test tamamla ve AI analizi al
  async completeTest(assignmentId): Promise<DiagnosisAIAnalysis>
  
  // Öğretmen: Öğrenci sonuçlarını görüntüle
  async getStudentResults(assignmentId): Promise<DetailedResults>
  
  // Öğretmen: Aksiyon al
  async takeAction(assignmentId, actionType, data): Promise<void>
}
```

---

## 📱 UI/UX Akışı

### Öğretmen Akışı:

```
1. Tutor Dashboard
   ↓
2. "Tanı Testi Oluştur" butonu
   ↓
3. Test Oluşturma Sayfası
   - Başlık, açıklama
   - Sınıf, ders seçimi
   - Modül seçimi (çoklu)
   - Soru sayısı
   - "AI ile Soru Üret" butonu
   ↓
4. AI Soru Üretimi
   - Loading göstergesi
   - Üretilen soruları önizleme
   - Düzenleme/onaylama
   ↓
5. Test Kaydedildi
   ↓
6. Öğrenci Atama Ekranı
   - Öğrenci listesi
   - Çoklu seçim
   - Son tarih
   - Zorunlu/isteğe bağlı
   ↓
7. Test Atandı ✅
   ↓
8. Sonuçları Takip
   - Tamamlanan testler listesi
   - Her öğrenci için detaylı analiz
   - Aksiyon alma seçenekleri
```

### Öğrenci Akışı:

```
1. Login
   ↓
2. Zorunlu test varsa → Modal/Banner uyarısı
   ↓
3. "Testi Başlat" butonu
   ↓
4. Test Alma Ekranı
   - Soru gösterimi
   - İlerleme çubuğu
   - Cevap seçimi
   - Sonraki/önceki
   ↓
5. "Testi Tamamla" butonu
   ↓
6. AI Analizi Yapılıyor (Loading)
   ↓
7. Sonuç Ekranı
   - Genel değerlendirme
   - Güçlü alanlar (yeşil)
   - Zayıf alanlar (kırmızı)
   - Öneriler
   - Motivasyon mesajı
   ↓
8. Dashboard'a dön
```

---

## 🚀 Uygulama Adımları

### Faz 1: Veritabanı ve Temel Yapı (1-2 saat)
- [ ] Migration dosyaları oluştur
- [ ] RLS politikaları ekle
- [ ] TypeScript tipleri güncelle

### Faz 2: AI Soru Üretimi (2-3 saat)
- [ ] Edge function'a yeni action ekle: `generateDiagnosisQuestions`
- [ ] Kaliteli soru üretimi için prompt engineering
- [ ] secureAIService'e fonksiyon ekle
- [ ] Test et

### Faz 3: Öğretmen UI (3-4 saat)
- [ ] Test oluşturma sayfası
- [ ] Soru önizleme ve düzenleme
- [ ] Öğrenci atama modal
- [ ] Test listesi ve yönetim

### Faz 4: Öğrenci UI (2-3 saat)
- [ ] Test bildirimi sistemi
- [ ] Test alma ekranı
- [ ] İlerleme takibi
- [ ] Sonuç gösterimi

### Faz 5: AI Analiz (2-3 saat)
- [ ] Edge function'a `analyzeDiagnosisTest` action
- [ ] Detaylı analiz prompt'u
- [ ] Sonuç parsing ve kaydetme

### Faz 6: Öğretmen Aksiyon Sistemi (2-3 saat)
- [ ] Sonuç görüntüleme sayfası
- [ ] Aksiyon alma butonları
- [ ] Haftalık plan oluşturma entegrasyonu
- [ ] Ödev atama entegrasyonu

### Faz 7: Test ve İyileştirme (2-3 saat)
- [ ] End-to-end test
- [ ] UI/UX iyileştirmeleri
- [ ] Hata yönetimi
- [ ] Dokümantasyon

**Toplam Tahmini Süre:** 14-21 saat

---

## 💡 Önemli Notlar

### AI Prompt Stratejisi:

**Soru Üretimi için:**
```
Sen bir {subject} öğretmenisin. {grade}. sınıf seviyesinde, 
{module_name} kazanımı için {count} adet tanı sorusu oluştur.

Gereksinimler:
- Her soru öğrencinin bu kazanımdaki yeterliliğini ölçmeli
- Zorluk seviyesi: {difficulty}
- 4 şıklı çoktan seçmeli
- Şıklar dengeli ve yanıltıcı olmalı
- Türkçe ve net ifadeler
- Müfredata uygun
```

**Analiz için:**
```
Sen bir eğitim danışmanısın. Öğrencinin tanı testi sonuçlarını analiz et.

Öğrenci Bilgileri:
- Sınıf: {grade}
- Ders: {subject}
- Toplam Soru: {total}
- Doğru: {correct}

Modül Bazında Sonuçlar:
{module_results}

Lütfen şunları sağla:
1. Genel değerlendirme (objektif, yapıcı)
2. Güçlü olduğu 3 alan
3. Gelişmesi gereken 3 alan (öncelik sırasına göre)
4. Her zayıf alan için gap analizi
5. Somut öneriler (çalışma planı, kaynak, strateji)
6. Öğrenme stili hakkında gözlemler
7. Motive edici kapanış mesajı
```

### Güvenlik:
- RLS politikaları ile öğretmen sadece kendi testlerini görebilir
- Öğrenci sadece kendine atanan testleri görebilir
- Test cevapları şifrelenmeli (hassas veri)

### Performans:
- AI analizi asenkron yapılmalı (queue sistemi)
- Sonuçlar cache'lenmeli
- Büyük testler için pagination

---

## 🎨 UI Mockup Önerileri

### Öğretmen - Test Oluşturma:
```
┌─────────────────────────────────────┐
│ 📝 Yeni Tanı Testi Oluştur          │
├─────────────────────────────────────┤
│ Başlık: [________________]          │
│ Açıklama: [_______________]         │
│                                     │
│ Sınıf: [5▼] Ders: [Matematik▼]    │
│                                     │
│ Kazanımlar:                         │
│ ☑ Doğal Sayılar                    │
│ ☑ Kesirler                         │
│ ☐ Ondalık Sayılar                  │
│ ☐ Yüzdeler                         │
│                                     │
│ Soru Sayısı: [20]                  │
│                                     │
│ [🤖 AI ile Soru Üret]              │
└─────────────────────────────────────┘
```

### Öğrenci - Test Sonucu:
```
┌─────────────────────────────────────┐
│ 🎯 Tanı Testi Sonucun               │
├─────────────────────────────────────┤
│ Genel Başarı: 75/100 ⭐⭐⭐         │
│                                     │
│ 💪 Güçlü Olduğun Konular:          │
│ ✓ Doğal Sayılar (95%)              │
│ ✓ Toplama İşlemi (88%)             │
│                                     │
│ 📚 Geliştirebileceğin Konular:     │
│ ⚠ Kesirler (45%) - Öncelik: Yüksek│
│ ⚠ Ondalık Sayılar (60%)            │
│                                     │
│ 💡 Öneriler:                        │
│ • Kesirler konusunda...            │
│ • Günlük 15 dk pratik...           │
│                                     │
│ [Detaylı Raporu Gör]               │
└─────────────────────────────────────┘
```

---

## ✅ Başarı Kriterleri

1. ✅ Öğretmen test oluşturabilmeli
2. ✅ AI kaliteli sorular üretebilmeli
3. ✅ Öğrenciye test atanabilmeli
4. ✅ Öğrenci testi alabilmeli
5. ✅ AI detaylı analiz yapabilmeli
6. ✅ Öğretmen sonuçları görebilmeli
7. ✅ Öğretmen aksiyon alabilmeli
8. ✅ Sistem performanslı çalışmalı

---

Bu plan ile tam fonksiyonel bir Tanı Testi sistemi kurulabilir. 
Hangi fazdan başlamak istersiniz?
