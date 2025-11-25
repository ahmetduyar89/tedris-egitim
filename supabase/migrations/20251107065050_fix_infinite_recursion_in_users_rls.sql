/*
  # RLS Sonsuz Döngü Hatasını Düzelt

  ## Değişiklikler
  
  1. Sorunlu Politikayı Kaldır
    - "Admins can view pending tutors" politikası sonsuz döngüye neden oluyordu
    - Users tablosunda subquery ile users'ı tekrar sorgulamak yasak
  
  2. Alternatif Çözüm
    - Admin kontrolü için JWT'den rol bilgisi kullanılabilir
    - Ya da basitçe "Users can read own data" politikası yeterli
    - Adminler zaten tüm kullanıcıları görebilmeli ama bu client-side değil server-side olmalı
    
  3. Notlar
    - RLS politikalarında aynı tabloyu subquery'de kullanmak infinite recursion'a neden olur
    - Admin işlemleri için database fonksiyonları (SECURITY DEFINER) kullanıyoruz
    - Bu fonksiyonlar RLS'i bypass eder, bu yüzden güvenli
*/

-- Sorunlu politikayı kaldır
DROP POLICY IF EXISTS "Admins can view pending tutors" ON users;

-- Not: Adminler pending tutorları görmek için zaten approve_tutor ve reject_tutor 
-- fonksiyonlarını kullanıyor. Bu fonksiyonlar SECURITY DEFINER ile çalışıyor ve 
-- RLS'i bypass ediyor. Client-side'da adminler kendi verilerini "Users can read own data" 
-- politikası ile okuyabilir.
