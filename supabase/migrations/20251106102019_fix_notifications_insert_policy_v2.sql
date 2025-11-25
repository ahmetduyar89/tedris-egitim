/*
  # Notifications Tablosu - INSERT Politikası v2

  1. Değişiklikler
    - INSERT politikasını kaldır
    - Yeni politika: authenticated kullanıcılar herhangi bir recipient_id'ye bildirim gönderebilir
    - WITH CHECK koşulunu daha açık yap

  2. Güvenlik
    - recipient_id EXISTS kontrolü ile güvenlik sağla
    - Sadece mevcut kullanıcılara bildirim gönderilebilir
*/

-- Mevcut INSERT politikasını kaldır
DROP POLICY IF EXISTS "Users can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON notifications;

-- Yeni INSERT politikası: recipient_id mevcut bir kullanıcı olmalı
CREATE POLICY "Anyone can create notifications for users"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = recipient_id
    )
  );