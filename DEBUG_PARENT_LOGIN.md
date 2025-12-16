# Veli Girişi Debug Rehberi

## Sorunu Tespit Etme

### 1. Veritabanını Kontrol Et

Supabase Dashboard'a git ve şu sorguları çalıştır:

```sql
-- Tüm veli kayıtlarını göster
SELECT * FROM parents;

-- Veli-öğrenci ilişkilerini göster
SELECT 
    p.name as veli_adi,
    p.email as veli_email,
    s.name as ogrenci_adi,
    psr.relationship_type
FROM parent_student_relations psr
JOIN parents p ON p.id = psr.parent_id
JOIN students s ON s.id = psr.student_id;

-- Belirli bir veli adına göre ara (örnek: "Ahmet Yılmaz")
SELECT * FROM parents WHERE name ILIKE '%ahmet%';
```

### 2. Veli Hesabı Var mı Kontrol Et

Eğer veli kaydı yoksa, öğrenci düzenleme modalından veli bilgilerini gir ve şifre belirle.

### 3. Giriş Yaparken Console'u İzle

Tarayıcı console'unda şu logları göreceksin:
- 🔵 Veli girişi deneniyor
- 🔵 Parents tablosu sorgusu
- ✅ Veli bulundu / ❌ Veli bulunamadı
- 🔵 Auth giriş deneniyor
- ✅ Veli girişi başarılı / ❌ Şifre hatalı

## Çözüm Adımları

### Seçenek 1: Mevcut Öğrenci İçin Veli Hesabı Oluştur

1. Öğretmen olarak giriş yap
2. Öğrencilerim sayfasına git
3. İlgili öğrenciyi düzenle
4. Veli adı-soyadı ve telefon bilgilerini gir
5. **Veli şifresi** alanına bir şifre gir (en az 6 karakter)
6. Kaydet

### Seçenek 2: Yeni Öğrenci Eklerken Veli Hesabı Oluştur

1. Yeni öğrenci ekle
2. Veli bilgilerini doldur
3. Veli şifresi belirle
4. Kaydet
5. Sistem otomatik olarak veli hesabı oluşturacak

## Veli Giriş Bilgileri

Veli giriş yaparken:
- **Ad-Soyad:** Öğretmenin girdiği ad-soyad (tam olarak aynı şekilde)
- **Şifre:** Öğretmenin belirlediği şifre

⚠️ **DİKKAT:** Ad-soyad büyük/küçük harf duyarlı değil ama boşluklar önemli!

## Hata Mesajları ve Anlamları

| Hata Mesajı | Anlamı | Çözüm |
|-------------|--------|-------|
| "Veli bilgileri bulunamadı" | Parents tablosunda bu ad-soyad ile kayıt yok | Öğretmen veli hesabı oluşturmalı |
| "Veli hesabı email bilgisi eksik" | Veli kaydı var ama email yok | Veritabanı hatası, öğretmen ile iletişime geç |
| "Şifre hatalı" | Şifre yanlış girilmiş | Doğru şifreyi gir veya öğretmenden şifre sıfırlama iste |

## Test Senaryosu

1. Öğretmen hesabı ile giriş yap
2. Yeni bir test öğrencisi oluştur:
   - Ad: Test Öğrenci
   - Veli Adı: Test Veli
   - Veli Şifresi: test123
3. Çıkış yap
4. Veli olarak giriş yap:
   - Ad-Soyad: Test Veli
   - Şifre: test123
5. Başarılı olmalı!
