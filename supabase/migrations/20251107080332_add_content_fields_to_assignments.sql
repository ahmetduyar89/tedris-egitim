/*
  # Ödevlere İçerik Alanları Ekle

  ## Değişiklikler
  
  1. assignments Tablosuna Yeni Alanlar
    - content_type: İçerik tipi (pdf, video, image, html)
    - file_url: Dosya URL'si (PDF, video, resim için)
    - html_content: HTML içerik (HTML tipi için)
  
  ## Açıklama
  
  Öğretmenler artık ödev verirken sadece açıklama değil, 
  ayrıca PDF, video, resim veya HTML içerik ekleyebilir.
  
  Bu sayede:
  - Ödevle birlikte ders materyali paylaşılabilir
  - HTML ile interaktif içerik eklenebilir
  - Görsel materyallerle ödev daha anlaşılır olur
*/

-- content_type: PDF, Video, Image, HTML
ALTER TABLE assignments 
ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT NULL;

-- file_url: PDF, video, resim için URL
ALTER TABLE assignments 
ADD COLUMN IF NOT EXISTS file_url TEXT DEFAULT NULL;

-- html_content: HTML tipi içerik için
ALTER TABLE assignments 
ADD COLUMN IF NOT EXISTS html_content TEXT DEFAULT NULL;

-- content_type için check constraint (opsiyonel ama güvenlik için iyi)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'assignments_content_type_check'
  ) THEN
    ALTER TABLE assignments
    ADD CONSTRAINT assignments_content_type_check 
    CHECK (content_type IS NULL OR content_type IN ('pdf', 'video', 'image', 'html'));
  END IF;
END $$;
