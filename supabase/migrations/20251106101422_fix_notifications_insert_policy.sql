/*
  # Notifications Tablosu - INSERT Politikası Düzeltmesi

  1. Değişiklikler
    - Mevcut "System can insert notifications" politikasını kaldır
    - Yeni "Authenticated users can create notifications" politikası ekle
    - Öğretmenler öğrencilere bildirim gönderebilir
    - Sistem bildirimleri oluşturabilir

  2. Güvenlik
    - Sadece authenticated kullanıcılar bildirim oluşturabilir
    - recipient_id kontrol edilmez (öğretmen öğrenciye bildirim atabilir)
    - Bildirim içeriği tamamen serbest
*/

-- Mevcut politikayı kaldır
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;

-- Yeni politika ekle: Authenticated kullanıcılar bildirim oluşturabilir
CREATE POLICY "Authenticated users can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);