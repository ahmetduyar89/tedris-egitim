# Özel Ders Programı Sürükle-Bırak Özelliği

## 🔄 Genel Bakış

Özel ders programında derslerin gününü ve saatini değiştirmek artık çok daha kolay! **Sürükle-Bırak (Drag & Drop)** özelliği sayesinde dersleri mouse ile tutup istediğiniz yeni zaman dilimine taşıyabilirsiniz.

## ✨ Nasıl Çalışır?

1. **Dersi Tutun:** Programdaki herhangi bir ders kartının üzerine gelin. Mouse imleci taşıma işaretine dönüşecektir.
2. **Sürükleyin:** Mouse tuşuna basılı tutarak dersi hareket ettirin.
3. **Hedef Seçin:** Dersi taşımak istediğiniz gün ve saat kutucuğunun üzerine gelin. Hedef kutucuk **mavi kesikli çizgilerle** vurgulanacaktır.
4. **Bırakın:** Mouse tuşunu bıraktığınızda ders otomatik olarak yeni gün ve saate taşınacaktır.

## ⚠️ Önemli Notlar

- **Tek Seferlik Değişiklik:** Bu işlem sadece o haftadaki o spesifik dersi etkiler. Tekrarlayan derslerin genel programını bozmaz.
- **Sanal Dersler:** Henüz oluşturulmamış (sanal) dersleri taşıdığınızda, sistem otomatik olarak o hafta için gerçek bir ders kaydı oluşturur.
- **Süre Korunur:** Dersin süresi (örn. 60 dk) taşındığı yerde de aynen korunur.

## 📱 Mobil Kullanım

Şu an için sürükle-bırak özelliği **masaüstü ve tablet** cihazlarda (büyük ekranlarda) aktif olarak çalışmaktadır. Mobil cihazlarda ders detayına girip düzenleme yapılması önerilir.

## 🔧 Teknik Detaylar

- HTML5 Drag and Drop API kullanılmıştır.
- Ders taşındığında veritabanında `start_time` ve `end_time` alanları güncellenir.
- Görsel geri bildirimler (opacity değişimi, hedef vurgulama) ile kullanıcı deneyimi artırılmıştır.
