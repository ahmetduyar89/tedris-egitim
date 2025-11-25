
import { Subject } from './types';

export const CURRICULUM: { [key in Subject]: { [grade: number]: string[] } } = {
  [Subject.Mathematics]: {
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
  },
  [Subject.Science]: {
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
  },
  [Subject.Turkish]: {
    5: ['Sözcükte Anlam', 'Cümlede Anlam', 'Paragrafta Anlam'],
    6: ['İsimler ve Sıfatlar', 'Zamirler', 'Yazım Kuralları'],
    7: ['Fiiller', 'Zarflar', 'Edat, Bağlaç ve Ünlem'],
    8: ['Cümlenin Öğeleri', 'Anlatım Bozuklukları', 'Metin Türleri'],
  },
};
