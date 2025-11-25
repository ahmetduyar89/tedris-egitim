/*
  # Notifications Tablosu - RLS Politikalarını Yeniden Oluştur

  1. Değişiklikler
    - Tüm mevcut politikaları kaldır
    - RLS'i devre dışı bırak ve tekrar etkinleştir (cache temizlemek için)
    - Politikaları yeniden oluştur

  2. Güvenlik
    - Authenticated kullanıcılar bildirim oluşturabilir (INSERT)
    - Kullanıcılar sadece kendi bildirimlerini görebilir (SELECT)
    - Kullanıcılar sadece kendi bildirimlerini güncelleyebilir (UPDATE)
*/

-- Tüm mevcut politikaları kaldır
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;

-- RLS'i devre dışı bırak
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- RLS'i tekrar etkinleştir
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- SELECT politikası: Kullanıcılar sadece kendi bildirimlerini görebilir
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (recipient_id = auth.uid());

-- INSERT politikası: Herkes bildirim oluşturabilir
CREATE POLICY "Users can insert notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE politikası: Kullanıcılar sadece kendi bildirimlerini güncelleyebilir
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());