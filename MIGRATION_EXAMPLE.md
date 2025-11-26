# 🔄 Örnek Migration - TestCreationModal

## Önce (❌ Güvensiz)

```typescript
// TestCreationModal.tsx
import { generateTestQuestions } from '../services/geminiService';

// ...

const handleGenerate = async () => {
  try {
    setIsGenerating(true);
    
    // ❌ API key client-side'da expose oluyor
    const result = await generateTestQuestions(
      subject,
      unit,
      grade,
      questionCount,
      difficulty,
      questionType
    );
    
    setQuestions(result.questions);
  } catch (error) {
    console.error('Test generation failed:', error);
  } finally {
    setIsGenerating(false);
  }
};
```

---

## Sonra (✅ Güvenli)

```typescript
// TestCreationModal.tsx
import { generateTestQuestions } from '../services/secureAIService';

// ...

const handleGenerate = async () => {
  try {
    setIsGenerating(true);
    
    // ✅ API key backend'de güvenli
    // Edge function üzerinden çağrılıyor
    const result = await generateTestQuestions(
      subject,
      unit,
      grade,
      questionCount,
      difficulty,
      questionType
    );
    
    setQuestions(result.questions);
  } catch (error) {
    console.error('Test generation failed:', error);
    // Kullanıcıya hata mesajı göster
    alert('Test oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
  } finally {
    setIsGenerating(false);
  }
};
```

---

## 🔍 Farklar

### Import Değişikliği
```diff
- import { generateTestQuestions } from '../services/geminiService';
+ import { generateTestQuestions } from '../services/secureAIService';
```

### Fonksiyon İmzası
**Değişmedi!** Aynı parametreler, aynı return type.

### Network Çağrısı
```diff
- Direct Gemini API call (API key exposed)
+ Supabase Edge Function call (API key secure)
```

---

## 📝 Değiştirilmesi Gereken Tüm Dosyalar

Aşağıdaki dosyalarda `geminiService` import'unu bulun ve `secureAIService` ile değiştirin:

1. ✅ `components/TestCreationModal.tsx`
2. ✅ `pages/AIReportPage.tsx`
3. ✅ `pages/StudentDetailPage.tsx`
4. ✅ `pages/AIAssistantPage.tsx`
5. ✅ `services/motivationService.ts`
6. ✅ `components/CreateAssignmentModal.tsx`
7. ✅ `components/CreateFlashcardModal.tsx`
8. ✅ `components/GradeSubmissionModal.tsx`

---

## 🔧 Toplu Değiştirme (VSCode)

1. `Cmd/Ctrl + Shift + F` (Find in Files)
2. Ara: `from '../services/geminiService'`
3. Değiştir: `from '../services/secureAIService'`
4. "Replace All" tıkla

**VEYA**

Terminal'de:
```bash
# macOS/Linux
find . -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/geminiService/secureAIService/g'

# Windows (Git Bash)
find . -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i 's/geminiService/secureAIService/g' {} +
```

---

## ⚠️ Dikkat Edilmesi Gerekenler

1. **Import path'i kontrol edin**: `../services/` veya `./services/` olabilir
2. **Type import'ları değiştirmeyin**: Sadece function import'ları
3. **Test edin**: Her değişiklikten sonra ilgili özelliği test edin

---

## ✅ Doğrulama

Migration sonrası:

```typescript
// ✅ Doğru
import { generateTestQuestions } from '../services/secureAIService';

// ❌ Yanlış (eski)
import { generateTestQuestions } from '../services/geminiService';
```

Browser Network tab'de:
```
✅ POST https://YOUR_PROJECT.supabase.co/functions/v1/ai-generate
❌ POST https://generativelanguage.googleapis.com/... (API key exposed!)
```
