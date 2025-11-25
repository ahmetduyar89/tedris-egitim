/*
  # Admin Onay Sistemi

  ## Değişiklikler
  
  1. Users Tablosu Güncellemeleri
    - `status` kolonu eklendi (pending, approved, rejected)
    - `is_admin` kolonu eklendi (super admin kontrolü için)
    - `requested_at` kolonu eklendi (kayıt talep tarihi)
    - `approved_at` kolonu eklendi (onay tarihi)
    - `approved_by` kolonu eklendi (hangi admin onayladı)

  2. Güvenlik Güncellemeleri
    - Sadece `approved` durumundaki kullanıcılar sisteme giriş yapabilir
    - İlk kayıt olan kullanıcı otomatik admin olur
    - Adminler bekleyen öğretmen kayıtlarını görebilir ve onaylayabilir

  3. Notlar
    - Öğrenciler status kontrolünden muaf (öğretmen tarafından oluşturulurlar)
    - İlk kullanıcı otomatik approved ve admin olur
    - Sonraki öğretmen kayıtları pending durumunda başlar
*/

-- Users tablosuna yeni kolonlar ekle
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'status'
  ) THEN
    ALTER TABLE users ADD COLUMN status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE users ADD COLUMN is_admin boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'requested_at'
  ) THEN
    ALTER TABLE users ADD COLUMN requested_at timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'approved_at'
  ) THEN
    ALTER TABLE users ADD COLUMN approved_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'approved_by'
  ) THEN
    ALTER TABLE users ADD COLUMN approved_by uuid;
    ALTER TABLE users ADD CONSTRAINT fk_approved_by FOREIGN KEY (approved_by) REFERENCES users(id);
  END IF;
END $$;

-- Index'ler ekle
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);
CREATE INDEX IF NOT EXISTS idx_users_role_status ON users(role, status);

-- Trigger: İlk kullanıcı otomatik admin olsun
CREATE OR REPLACE FUNCTION make_first_user_admin()
RETURNS TRIGGER AS $$
BEGIN
  -- Eğer bu ilk kullanıcıysa ve tutor role'ünde ise
  IF (SELECT COUNT(*) FROM users WHERE role = 'tutor') = 0 AND NEW.role = 'tutor' THEN
    NEW.is_admin := true;
    NEW.status := 'approved';
    NEW.approved_at := now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger'ı ekle (varsa önce sil)
DROP TRIGGER IF EXISTS trigger_make_first_user_admin ON users;
CREATE TRIGGER trigger_make_first_user_admin
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION make_first_user_admin();

-- Admin fonksiyonu: Öğretmen onaylama
CREATE OR REPLACE FUNCTION approve_tutor(tutor_id uuid)
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  -- Sadece adminler bu fonksiyonu çağırabilir
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND is_admin = true 
    AND status = 'approved'
  ) THEN
    RETURN json_build_object('error', 'Unauthorized: Only admins can approve tutors');
  END IF;

  -- Öğretmeni onayla
  UPDATE users
  SET 
    status = 'approved',
    approved_at = now(),
    approved_by = auth.uid()
  WHERE id = tutor_id AND role = 'tutor';

  IF FOUND THEN
    result := json_build_object('success', true, 'message', 'Tutor approved successfully');
  ELSE
    result := json_build_object('error', 'Tutor not found');
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin fonksiyonu: Öğretmen reddetme
CREATE OR REPLACE FUNCTION reject_tutor(tutor_id uuid)
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  -- Sadece adminler bu fonksiyonu çağırabilir
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND is_admin = true 
    AND status = 'approved'
  ) THEN
    RETURN json_build_object('error', 'Unauthorized: Only admins can reject tutors');
  END IF;

  -- Öğretmeni reddet
  UPDATE users
  SET status = 'rejected'
  WHERE id = tutor_id AND role = 'tutor';

  IF FOUND THEN
    result := json_build_object('success', true, 'message', 'Tutor rejected successfully');
  ELSE
    result := json_build_object('error', 'Tutor not found');
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Politikası: Adminler tüm pending tutorları görebilir
CREATE POLICY "Admins can view pending tutors"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users admin
      WHERE admin.id = auth.uid()
      AND admin.is_admin = true
      AND admin.status = 'approved'
    )
  );
