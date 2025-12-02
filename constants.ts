
import { Subject } from './types';

export const CURRICULUM: { [key in Subject]: { [grade: number]: string[] } } = {
  [Subject.Mathematics]: {
    4: [
      'Doğal Sayılar',
      'Doğal Sayılarla Toplama İşlemi',
      'Doğal Sayılarla Çıkarma İşlemi',
      'Doğal Sayılarla Çarpma İşlemi',
      'Doğal Sayılarla Bölme İşlemi',
      'Kesirler',
      'Zaman Ölçme',
      'Geometrik Cisimler ve Şekiller',
      'Veri Toplama ve Değerlendirme'
    ],
    5: [
      'Doğal Sayılar',
      'Doğal Sayılarla İşlemler',
      'Kesirler',
      'Ondalık Gösterim',
      'Yüzdeler',
      'Temel Geometrik Kavramlar ve Çizimler',
      'Üçgenler ve Dörtgenler',
      'Uzunluk ve Zaman Ölçme',
      'Alan Ölçme',
      'Geometrik Cisimler',
      'Veri Toplama ve Değerlendirme'
    ],
    6: [
      'Doğal Sayılar ve İşlemler',
      'Kesirlerle İşlemler',
      'Ondalık Gösterimler',
      'Oran ve Orantı',
      'Cebirsel İfadeler',
      'Veri Analizi',
      'Alan ve Hacim Ölçme',
      'Açı ve Çember',
      'Olasılık'
    ],
    7: [
      'Tam Sayılarla İşlemler',
      'Rasyonel Sayılar',
      'Cebirsel İfadeler ve Denklemler',
      'Oran-Orantı',
      'Yüzdeler',
      'Geometrik Cisimler ve Dönüşümler',
      'Alan ve Çevre Ölçme',
      'Veri Analizi ve Olasılık'
    ],
    8: [
      'Çarpanlar ve Katlar',
      'Üslü İfadeler',
      'Kareköklü İfadeler',
      'Denklemler ve Eşitsizlikler',
      'Doğrusal Denklemler ve Grafikler',
      'Geometrik Kavramlar',
      'Dönüşüm Geometrisi',
      'Üçgenler ve Geometrik Cisimler',
      'Veri Analizi ve Olasılık'
    ],
    9: [
      'Mantık',
      'Kümeler',
      'Denklemler ve Eşitsizlikler',
      'Üçgenler',
      'Veri'
    ],
    10: [
      'Sayma ve Olasılık',
      'Fonksiyonlar',
      'Polinomlar',
      'İkinci Dereceden Denklemler',
      'Dörtgenler ve Çokgenler',
      'Katı Cisimler'
    ]
  },
  [Subject.Science]: {
    4: [
      'Yer Kabuğu ve Dünyamızın Hareketleri',
      'Besinlerimiz',
      'Kuvvetin Etkileri',
      'Maddenin Özellikleri',
      'Aydınlatma ve Ses Teknolojileri',
      'İnsan ve Çevre',
      'Basit Elektrik Devreleri'
    ],
    5: [
      'Güneş, Dünya ve Ay',
      'Canlılar Dünyasına Yolculuk',
      'Kuvvetin Ölçülmesi ve Sürtünme',
      'Maddenin Değişimi',
      'Işığın ve Sesin Yayılması',
      'İnsan ve Çevre'
    ],
    6: [
      'Güneş Sistemi ve Tutulmalar',
      'Kuvvetin Etkisinde Hareket',
      'Madde ve Isı', 'Canlılarda Sistemler',
      'Işığın Yansıması ve Renkler',
      'Elektriğin İletimi',
      'Sürdürülebilir Yaşam'
    ],
    7: [
      'Güneş Sistemi ve Ötesi: Uzay Bilmecesi',
      'Hücre ve Bölünmeler',
      'Kuvvet ve Enerji',
      'Saf Madde ve Karışımlar',
      'Işığın Madde ile Etkileşimi',
      'Elektrik Devreleri',
      'İnsan ve Çevre İlişkileri'
    ],
    8: [
      'Mevsimler ve İklim',
      'DNA ve Genetik Kod',
      'Basınç',
      'Madde ve Endüstri',
      'Basit Makineler',
      'Enerji Dönüşümleri ve Çevre Bilimi',
      'Elektrik Yükleri ve Elektrik Enerjisi'
    ],
    9: [
      'Fizik Bilimine Giriş',
      'Madde ve Özellikleri',
      'Atom ve Periyodik Sistem',
      'Kimyasal Türler Arası Etkileşimler',
      'Yaşam Bilimi Biyoloji',
      'Hücre'
    ],
    10: [
      'Elektrik ve Manyetizma',
      'Basınç ve Kaldırma Kuvveti',
      'Kimyanın Temel Kanunları',
      'Karışımlar',
      'Asitler, Bazlar ve Tuzlar',
      'Mitoz ve Eşeysiz Üreme',
      'Mayoz ve Eşeyli Üreme',
      'Kalıtım'
    ]
  },
  [Subject.Turkish]: {
    4: ['Sözcükte Anlam', 'Cümlede Anlam', 'Paragraf Bilgisi', 'Yazım Kuralları', 'Noktalama İşaretleri'],
    5: ['Sözcükte Anlam', 'Cümlede Anlam', 'Paragrafta Anlam'],
    6: ['İsimler ve Sıfatlar', 'Zamirler', 'Yazım Kuralları'],
    7: ['Fiiller', 'Zarflar', 'Edat, Bağlaç ve Ünlem'],
    8: ['Cümlenin Öğeleri', 'Anlatım Bozuklukları', 'Metin Türleri'],
    9: ['İletişim ve Dil', 'Hikaye', 'Şiir', 'Masal/Fabl', 'Roman', 'Tiyatro', 'Biyografi/Otobiyografi'],
    10: ['Giriş (Edebiyat Tarihi)', 'Hikaye', 'Şiir', 'Destan/Efsane', 'Roman', 'Tiyatro', 'Anı', 'Haber Metni', 'Gezi Yazısı']
  },
};
