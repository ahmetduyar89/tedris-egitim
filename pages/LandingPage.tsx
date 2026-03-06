import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Menu,
  X,
  BarChart3,
  MessageSquare,
  CheckCircle2,
  ChevronRight,
  BrainCircuit,
  Send,
  Bell,
  BookOpen,
  UserCheck,
  Sparkles,
  AlertTriangle,
  Monitor,
  Users,
  Target,
  TrendingUp,
  Zap,
  Shield,
  ClipboardList,
} from 'lucide-react';

interface LandingPageProps {
  onNavigateToAuth: (mode?: 'login' | 'register') => void;
}

// --- Navbar ---

const Navbar = ({ onAuth }: { onAuth: (m?: 'login' | 'register') => void }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-[100] bg-white transition-shadow duration-300 ${
        scrolled ? 'shadow-[0_1px_0_#E8E8E8]' : ''
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <img src="/logo-full.png" alt="Tedris" className="h-8 w-auto" />

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#6B6B6B]">
          <a href="#for-parents" className="hover:text-[#111111] transition-colors">Veliler</a>
          <a href="#for-teachers" className="hover:text-[#111111] transition-colors">Öğretmenler</a>
          <a href="#ai-system" className="hover:text-[#111111] transition-colors">AI Sistem</a>
          <a href="#how-it-works" className="hover:text-[#111111] transition-colors">Nasıl Çalışır?</a>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <button
            onClick={() => onAuth('login')}
            className="text-sm font-medium text-[#6B6B6B] hover:text-[#111111] transition-colors"
          >
            Giriş Yap
          </button>
          <button
            onClick={() => onAuth('register')}
            className="px-5 py-2.5 bg-[#4F46E5] text-white text-sm font-semibold rounded-xl hover:bg-[#4338CA] transition-colors"
          >
            Ders Talebi Oluştur
          </button>
        </div>

        <button className="md:hidden text-[#111111]" onClick={() => setMobileMenuOpen(true)}>
          <Menu size={24} />
        </button>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-white z-[200] flex flex-col p-8"
          >
            <div className="flex justify-between items-center mb-12">
              <img src="/logo-full.png" alt="Tedris" className="h-8 w-auto" />
              <button onClick={() => setMobileMenuOpen(false)} className="text-[#111111]">
                <X size={24} />
              </button>
            </div>
            <div className="flex flex-col gap-6 text-xl font-semibold text-[#111111]">
              <a href="#for-parents" onClick={() => setMobileMenuOpen(false)}>Veliler</a>
              <a href="#for-teachers" onClick={() => setMobileMenuOpen(false)}>Öğretmenler</a>
              <a href="#ai-system" onClick={() => setMobileMenuOpen(false)}>AI Sistem</a>
              <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>Nasıl Çalışır?</a>
              <a
                href="#"
                onClick={() => { onAuth('login'); setMobileMenuOpen(false); }}
                className="text-[#6B6B6B]"
              >
                Giriş Yap
              </a>
            </div>
            <div className="mt-auto flex flex-col gap-3">
              <button
                onClick={() => { onAuth('register'); setMobileMenuOpen(false); }}
                className="w-full py-4 bg-[#4F46E5] text-white rounded-2xl font-semibold text-lg"
              >
                Ders Talebi Oluştur
              </button>
              <button
                onClick={() => { onAuth('register'); setMobileMenuOpen(false); }}
                className="w-full py-4 bg-[#111111] text-white rounded-2xl font-semibold text-lg"
              >
                Öğretmen Olarak Katıl
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

// --- Hero Visual ---

const HeroVisual = () => (
  <div className="flex flex-col sm:flex-row gap-4 max-w-3xl mx-auto mt-16">
    {/* Parent: Lesson Request Card */}
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="flex-1 bg-white border border-[#E8E8E8] rounded-2xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)]"
    >
      <div className="flex items-center gap-2 mb-5">
        <div className="w-2 h-2 rounded-full bg-[#059669]" />
        <span className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-widest">Veli Portalı</span>
      </div>

      <div className="space-y-2.5 mb-4">
        <div className="p-2.5 rounded-xl bg-[#F7F6F3] flex items-center justify-between">
          <span className="text-xs text-[#6B6B6B]">Ders</span>
          <span className="text-xs font-semibold text-[#111111]">Matematik</span>
        </div>
        <div className="p-2.5 rounded-xl bg-[#F7F6F3] flex items-center justify-between">
          <span className="text-xs text-[#6B6B6B]">Sınıf</span>
          <span className="text-xs font-semibold text-[#111111]">7. Sınıf</span>
        </div>
        <div className="p-2.5 rounded-xl bg-[#EEF2FF] flex items-center justify-between">
          <span className="text-xs text-[#6B6B6B]">Ders Türü</span>
          <div className="flex gap-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#4F46E5] text-white">Online</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E8E8E8] text-[#6B6B6B]">Yüz Yüze</span>
          </div>
        </div>
      </div>

      <button className="w-full py-2.5 rounded-xl bg-[#059669] text-white text-sm font-semibold flex items-center justify-center gap-2">
        <Send size={13} /> Ders Talebi Gönder
      </button>

      <div className="mt-3 flex items-center gap-1.5 text-[10px] text-[#9B9B9B]">
        <CheckCircle2 size={11} className="text-[#059669]" />
        Talebiniz veli portalından takip edilir
      </div>
    </motion.div>

    {/* Teacher: AI Tracking Card */}
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.55 }}
      className="flex-1 bg-white border border-[#E8E8E8] rounded-2xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)]"
    >
      <div className="flex items-center gap-2 mb-5">
        <div className="w-2 h-2 rounded-full bg-[#4F46E5]" />
        <span className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-widest">Öğretmen Paneli</span>
      </div>

      <div className="space-y-2.5">
        <div className="p-2.5 rounded-xl bg-[#FEF3C7] border border-[#FDE68A]">
          <div className="flex items-start gap-2">
            <AlertTriangle size={12} className="text-[#D97706] mt-0.5 shrink-0" />
            <div>
              <p className="text-[11px] font-bold text-[#92400E]">AI Uyarısı</p>
              <p className="text-[10px] text-[#92400E]">Ali K. — Kesirler konusunda güçlük çekiyor</p>
            </div>
          </div>
        </div>

        {[
          { name: 'Ayşe M.', subject: 'Fen Bilimleri', score: 88, up: true },
          { name: 'Can T.', subject: 'Matematik', score: 72, up: false },
        ].map((s, i) => (
          <div key={i} className="p-2.5 rounded-xl bg-[#F7F6F3] flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#111111]">{s.name}</p>
              <p className="text-[10px] text-[#9B9B9B]">{s.subject}</p>
            </div>
            <div className={`flex items-center gap-1 text-xs font-bold ${s.up ? 'text-[#059669]' : 'text-[#6B6B6B]'}`}>
              {s.score}%
              <TrendingUp size={10} className={s.up ? 'text-[#059669]' : 'rotate-180 text-[#9B9B9B]'} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-[#4F46E5] font-semibold">
        <BrainCircuit size={13} />
        <span>AI 2 öğrencide müdahale önerdi</span>
      </div>
    </motion.div>
  </div>
);

// --- Hero ---

const HeroSection = ({ onStart }: { onStart: () => void }) => (
  <section className="pt-32 pb-24 bg-white">
    <div className="max-w-6xl mx-auto px-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full border border-[#E8E8E8] bg-[#F7F6F3] text-xs font-semibold text-[#4F46E5] uppercase tracking-widest"
      >
        <Sparkles size={12} />
        Yapay Zeka Destekli Özel Ders Platformu
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.05 }}
        className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-[#111111] font-montserrat tracking-tight leading-[1.08] mb-6"
      >
        Özel ders talebi,{' '}
        <br className="hidden md:block" />
        <span className="text-[#4F46E5]">akıllı takip,</span>{' '}
        <br className="hidden md:block" />
        gerçek sonuçlar.
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15 }}
        className="text-lg md:text-xl text-[#6B6B6B] mb-10 max-w-2xl mx-auto leading-relaxed"
      >
        Veliler Matematik ve Fen Bilimleri için{' '}
        <span className="font-semibold text-[#111111]">online veya yüz yüze</span> ders talep eder,
        yapay zeka destekli sistem ile çocuklarının gelişimini Veli Portalı'ndan anlık takip eder.
        Öğretmenler ise öğrencilerini her adımda yakından izler.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.25 }}
        className="flex flex-col sm:flex-row items-center justify-center gap-4"
      >
        <button
          onClick={onStart}
          className="group flex items-center gap-2 px-8 py-4 bg-[#4F46E5] text-white rounded-xl font-semibold text-base hover:bg-[#4338CA] transition-colors shadow-[0_2px_12px_rgba(79,70,229,0.25)]"
        >
          Ders Talebi Oluştur
          <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
        <a
          href="#how-it-works"
          className="flex items-center gap-2 px-8 py-4 text-[#111111] font-semibold text-base hover:text-[#4F46E5] transition-colors"
        >
          Nasıl Çalışır? <ChevronRight size={16} />
        </a>
      </motion.div>

      <HeroVisual />
    </div>
  </section>
);

// --- Subject & Mode Showcase ---

const SubjectShowcase = () => (
  <section className="py-16 bg-[#F7F6F3] border-y border-[#E8E8E8]">
    <div className="max-w-6xl mx-auto px-6">
      <div className="flex flex-col md:flex-row items-center justify-center gap-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex-1 max-w-xs bg-white border border-[#E8E8E8] rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] flex items-center justify-center text-[#4F46E5] font-black text-lg font-montserrat">π</div>
            <div>
              <p className="font-bold text-[#111111]">Matematik</p>
              <p className="text-xs text-[#9B9B9B]">5. – 12. Sınıf</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {['Kesirler', 'Cebir', 'Geometri', 'Fonksiyonlar', 'Olasılık'].map(t => (
              <span key={t} className="text-[11px] px-2.5 py-1 rounded-full bg-[#F7F6F3] border border-[#E8E8E8] text-[#6B6B6B]">{t}</span>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="flex-1 max-w-xs bg-white border border-[#E8E8E8] rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] flex items-center justify-center text-[#059669] font-black text-lg">⚗</div>
            <div>
              <p className="font-bold text-[#111111]">Fen Bilimleri</p>
              <p className="text-xs text-[#9B9B9B]">5. – 12. Sınıf</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {['Fizik', 'Kimya', 'Biyoloji', 'Madde', 'Kuvvet'].map(t => (
              <span key={t} className="text-[11px] px-2.5 py-1 rounded-full bg-[#F7F6F3] border border-[#E8E8E8] text-[#6B6B6B]">{t}</span>
            ))}
          </div>
        </motion.div>

        <div className="hidden md:block w-px h-20 bg-[#E8E8E8]" />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="flex flex-col gap-3"
        >
          <div className="flex items-center gap-3 px-5 py-3 bg-white border border-[#E8E8E8] rounded-xl">
            <Monitor size={18} className="text-[#4F46E5]" />
            <div>
              <p className="text-sm font-bold text-[#111111]">Online Ders</p>
              <p className="text-xs text-[#9B9B9B]">Dilediğiniz yerden bağlanın</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-5 py-3 bg-white border border-[#E8E8E8] rounded-xl">
            <Users size={18} className="text-[#059669]" />
            <div>
              <p className="text-sm font-bold text-[#111111]">Yüz Yüze Ders</p>
              <p className="text-xs text-[#9B9B9B]">Fiziksel ortamda birebir destek</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  </section>
);

// --- Stats Bar ---

const StatsBar = () => {
  const stats = [
    { value: '2.400+', label: 'Aktif Öğrenci' },
    { value: '%94', label: 'Veli Memnuniyeti' },
    { value: '180+', label: 'Öğretmen' },
    { value: '%87', label: 'Başarı Artışı' },
  ];

  return (
    <section className="py-16 border-b border-[#E8E8E8] bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <p className="text-3xl md:text-4xl font-extrabold text-[#111111] font-montserrat">{s.value}</p>
              <p className="text-sm text-[#9B9B9B] mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- For Parents ---

const ForParents = () => {
  const features = [
    {
      icon: <Send size={22} />,
      title: 'Ders Talebi Oluştur',
      desc: 'Matematik veya Fen Bilimleri için konu, sınıf ve ders türünü seçin. Online ya da yüz yüze seçeneğiyle talebinizi saniyeler içinde iletin.',
      points: ['Konu ve sınıf bazlı talep', 'Online veya yüz yüze seçimi', 'Öğretmen eşleştirme ve onay'],
    },
    {
      icon: <ClipboardList size={22} />,
      title: 'Veli Portalı',
      desc: 'Ders taleplerinden sınav sonuçlarına, haftalık programdan öğretmen notlarına kadar çocuğunuzla ilgili tüm veriler tek bir panelde.',
      points: ['Tüm ders ve talep geçmişi', 'Öğretmen raporları ve notlar', 'Haftalık program ve randevular'],
    },
    {
      icon: <Zap size={22} />,
      title: 'Anlık AI Müdahalesi',
      desc: 'Yapay zeka, çocuğunuzun zorlandığı konuları tespit eder. Öğretmen ve veliye anında bildirim gönderilir; müdahale bir sonraki derse yansır.',
      points: ['Gerçek zamanlı başarı takibi', 'Konu bazlı risk uyarıları', 'Otomatik bildirim ve aksiyon'],
    },
    {
      icon: <TrendingUp size={22} />,
      title: 'Sonuç Odaklı Takip',
      desc: 'Her sınav ve ödev sonrası güncel raporlar. Hangi konuda ilerleme var, hangi konuda destek gerekiyor — somut verilerle görün.',
      points: ['Konu bazlı başarı grafiği', 'Sınav öncesi / sonrası karşılaştırma', 'WhatsApp ders özet bildirimi'],
    },
  ];

  return (
    <section id="for-parents" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="inline-block text-xs font-bold uppercase tracking-widest text-[#059669] mb-4"
          >
            Veliler için
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-extrabold text-[#111111] font-montserrat mb-4"
          >
            Ders Talep Edin, Her Adımı Takip Edin
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-[#6B6B6B] text-lg max-w-2xl mx-auto"
          >
            Matematik ve Fen Bilimleri için online veya yüz yüze ders talep edin.
            Yapay zeka destekli Veli Portalı ile çocuğunuzun tüm eğitim verilerini gerçek zamanlı izleyin.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -2 }}
              className="bg-white border border-[#E8E8E8] rounded-2xl p-8 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-shadow"
            >
              <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] flex items-center justify-center text-[#059669] mb-6">
                {f.icon}
              </div>
              <h3 className="text-xl font-bold text-[#111111] mb-3 font-montserrat">{f.title}</h3>
              <p className="text-[#6B6B6B] text-sm leading-relaxed mb-6">{f.desc}</p>
              <ul className="space-y-2.5">
                {f.points.map((p, j) => (
                  <li key={j} className="flex items-center gap-2.5 text-sm text-[#6B6B6B]">
                    <CheckCircle2 size={15} className="text-[#059669] shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- For Teachers ---

const ForTeachers = () => {
  const features = [
    {
      icon: <UserCheck size={22} />,
      title: 'Öğrencileri Yakından Takip Et',
      desc: 'Özel ders verdiğiniz her öğrencinin gelişim sürecini, sınav performansını ve konu bazlı başarı oranlarını detaylı görüntüleyin.',
      points: ['Öğrenci bazlı takip paneli', 'Konu başarı haritası', 'Ders geçmişi ve notlar'],
    },
    {
      icon: <BrainCircuit size={22} />,
      title: 'AI Destekli Analiz',
      desc: 'Yapay zeka her öğrencinin eksik kazanımlarını tespit eder, bir sonraki ders için öneri sunar. Siz onaylayın, sistem uygulasın.',
      points: ['Otomatik eksik tespiti', 'Kişiselleştirilmiş ders önerileri', 'Haftalık program optimizasyonu'],
    },
    {
      icon: <Bell size={22} />,
      title: 'Talep Yönetimi',
      desc: 'Velilerden gelen online ve yüz yüze ders taleplerini kolayca görüntüleyin, onaylayın ve takvime entegre edin.',
      points: ['Gelen ders taleplerini yönet', 'Online / yüz yüze ders ayrımı', 'Otomatik takvim güncellemesi'],
    },
  ];

  return (
    <section id="for-teachers" className="py-24 bg-[#F7F6F3]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="inline-block text-xs font-bold uppercase tracking-widest text-[#4F46E5] mb-4"
          >
            Öğretmenler için
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-extrabold text-[#111111] font-montserrat mb-4"
          >
            Öğrencilerinizi Daha Yakından Tanıyın
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-[#6B6B6B] text-lg max-w-xl mx-auto"
          >
            Özel ders sürecini yapay zeka ile destekleyin. Her öğrenci için veri odaklı,
            kişiselleştirilmiş bir takip deneyimi yaşayın.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -2 }}
              className="bg-white border border-[#E8E8E8] rounded-2xl p-8 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-shadow"
            >
              <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] flex items-center justify-center text-[#4F46E5] mb-6">
                {f.icon}
              </div>
              <h3 className="text-xl font-bold text-[#111111] mb-3 font-montserrat">{f.title}</h3>
              <p className="text-[#6B6B6B] text-sm leading-relaxed mb-6">{f.desc}</p>
              <ul className="space-y-2.5">
                {f.points.map((p, j) => (
                  <li key={j} className="flex items-center gap-2.5 text-sm text-[#6B6B6B]">
                    <CheckCircle2 size={15} className="text-[#4F46E5] shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- AI System Section ---

const AISystem = () => {
  const pillars = [
    {
      icon: <Target size={24} />,
      title: 'Anlık Tespit',
      desc: 'AI, her ders ve sınav verisini analiz ederek öğrencinin zorlandığı konuları gerçek zamanlı tespit eder.',
      color: '#4F46E5',
      bg: '#EEF2FF',
    },
    {
      icon: <Zap size={24} />,
      title: 'Anında Müdahale',
      desc: 'Kritik bir gerileme ya da başarısızlık riski saptandığında öğretmene ve veliye anında bildirim gönderilir.',
      color: '#D97706',
      bg: '#FEF3C7',
    },
    {
      icon: <BarChart3 size={24} />,
      title: 'Kontrol & İzleme',
      desc: "Veliler Veli Portalı'ndan, öğretmenler kendi panelinden tüm eğitim sürecini her an kontrol eder.",
      color: '#059669',
      bg: '#ECFDF5',
    },
    {
      icon: <Shield size={24} />,
      title: 'Sonuç Odaklı Yaklaşım',
      desc: 'Genel ilerleme değil, konu bazlı ölçülebilir hedefler. Her ders bir öncekinin verisine dayanarak şekillenir.',
      color: '#7C3AED',
      bg: '#F3E8FF',
    },
  ];

  return (
    <section id="ai-system" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="inline-block text-xs font-bold uppercase tracking-widest text-[#4F46E5] mb-4"
          >
            Yapay Zeka Sistemi
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-extrabold text-[#111111] font-montserrat mb-4"
          >
            Takip. Kontrol. Müdahale. Sonuç.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-[#6B6B6B] text-lg max-w-2xl mx-auto"
          >
            Tedris'in yapay zeka destekli sistemi, öğrencinin eğitim yolculuğunu
            spesifik verilerle yönetir. Sezgiye değil, veriye dayalı kararlar.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {pillars.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl border border-[#E8E8E8] p-7 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-shadow"
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5" style={{ backgroundColor: p.bg, color: p.color }}>
                {p.icon}
              </div>
              <h3 className="text-lg font-bold text-[#111111] mb-2 font-montserrat">{p.title}</h3>
              <p className="text-sm text-[#6B6B6B] leading-relaxed">{p.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-10 bg-[#F7F6F3] border border-[#E8E8E8] rounded-2xl px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] flex items-center justify-center text-[#4F46E5]">
              <BrainCircuit size={20} />
            </div>
            <div>
              <p className="font-bold text-[#111111]">Spesifik. Sürekli. Şeffaf.</p>
              <p className="text-sm text-[#6B6B6B]">Her öğrenciye özgü yapay zeka analizi — genel değil, kişisel.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-[#4F46E5] font-semibold shrink-0">
            <MessageSquare size={15} />
            Veliler ve öğretmenler aynı veriden beslenir
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// --- How It Works ---

const HowItWorks = () => {
  const tracks = [
    {
      label: 'Veli Akışı',
      color: '#059669',
      bg: '#ECFDF5',
      steps: [
        { icon: <UserCheck size={18} />, title: 'Kayıt Ol & Profil Oluştur', desc: 'Çocuğunun sınıfı, hedefleri ve ihtiyaç duyduğu konuları belirtin.' },
        { icon: <Send size={18} />, title: 'Ders Talebi Gönder', desc: 'Matematik veya Fen Bilimleri, online ya da yüz yüze seçimi yaparak talebinizi iletin.' },
        { icon: <TrendingUp size={18} />, title: "Veli Portalı'ndan Takip Et", desc: 'AI destekli raporlar, anlık uyarılar ve konu bazlı ilerlemeyi gerçek zamanlı izleyin.' },
      ],
    },
    {
      label: 'Öğretmen Akışı',
      color: '#4F46E5',
      bg: '#EEF2FF',
      steps: [
        { icon: <BookOpen size={18} />, title: 'Profilini Oluştur', desc: 'Branş (Matematik / Fen Bilimleri), müsaitlik ve ders türünü (online / yüz yüze) belirtin.' },
        { icon: <Bell size={18} />, title: 'Talepleri Yönet', desc: 'Velilerden gelen ders taleplerini görüntüleyin, onaylayın ve takvime entegre edin.' },
        { icon: <BrainCircuit size={18} />, title: 'AI ile Öğrenciyi Takip Et', desc: 'Her öğrenci için kişiselleştirilmiş analiz, müdahale önerileri ve ilerleme grafikleri.' },
      ],
    },
  ];

  return (
    <section id="how-it-works" className="py-24 bg-[#F7F6F3]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="inline-block text-xs font-bold uppercase tracking-widest text-[#4F46E5] mb-4"
          >
            Nasıl Çalışır?
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-extrabold text-[#111111] font-montserrat"
          >
            Veli ve Öğretmen için 3 adım
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {tracks.map((track, ti) => (
            <motion.div
              key={ti}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: ti * 0.15 }}
              className="bg-white border border-[#E8E8E8] rounded-2xl p-8"
            >
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-8"
                style={{ backgroundColor: track.bg, color: track.color }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: track.color }} />
                {track.label}
              </div>

              <div className="space-y-6">
                {track.steps.map((step, si) => (
                  <div key={si} className="flex items-start gap-4">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: track.bg, color: track.color }}
                    >
                      {step.icon}
                    </div>
                    <div>
                      <p className="font-semibold text-[#111111] mb-0.5">{step.title}</p>
                      <p className="text-sm text-[#6B6B6B]">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- CTA Final ---

const FinalCTA = ({ onStart }: { onStart: () => void }) => (
  <section className="py-28 bg-[#111111]">
    <div className="max-w-4xl mx-auto px-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full bg-white/10 text-xs font-semibold text-white/70 uppercase tracking-widest"
      >
        <Sparkles size={12} />
        Yapay Zeka Destekli Özel Ders Platformu
      </motion.div>
      <motion.h2
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-4xl md:text-5xl font-extrabold text-white font-montserrat mb-6"
      >
        Çocuğunuz için en iyi başlangıç.
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1 }}
        className="text-[#9B9B9B] text-lg mb-10 max-w-xl mx-auto"
      >
        Matematik ve Fen Bilimleri için hemen ders talebi oluşturun.
        Yapay zeka destekli sistemi 14 gün ücretsiz deneyin.
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2 }}
        className="flex flex-col sm:flex-row items-center justify-center gap-4"
      >
        <button
          onClick={onStart}
          className="group inline-flex items-center gap-2 px-10 py-4 bg-[#4F46E5] text-white rounded-xl font-semibold text-base hover:bg-[#4338CA] transition-colors shadow-[0_2px_12px_rgba(79,70,229,0.4)]"
        >
          Ders Talebi Oluştur
          <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
        <button
          onClick={onStart}
          className="group inline-flex items-center gap-2 px-10 py-4 bg-transparent text-white border border-white/20 rounded-xl font-semibold text-base hover:border-white/40 transition-colors"
        >
          Öğretmen Olarak Katıl
          <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
      </motion.div>
    </div>
  </section>
);

// --- Footer ---

const Footer = () => (
  <footer className="bg-white border-t border-[#E8E8E8] py-16">
    <div className="max-w-6xl mx-auto px-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
        <div className="md:col-span-1">
          <img src="/logo-full.png" alt="Tedris" className="h-8 w-auto mb-4" />
          <p className="text-sm text-[#9B9B9B] leading-relaxed">
            Matematik ve Fen Bilimleri için yapay zeka destekli özel ders platformu.
            Veliler ve öğretmenler için tasarlandı.
          </p>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-[#111111] mb-5">Platform</h4>
          <ul className="space-y-3 text-sm text-[#9B9B9B]">
            <li><a href="#for-parents" className="hover:text-[#111111] transition-colors">Veliler</a></li>
            <li><a href="#for-teachers" className="hover:text-[#111111] transition-colors">Öğretmenler</a></li>
            <li><a href="#ai-system" className="hover:text-[#111111] transition-colors">AI Sistem</a></li>
            <li><a href="#how-it-works" className="hover:text-[#111111] transition-colors">Nasıl Çalışır?</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-[#111111] mb-5">Dersler</h4>
          <ul className="space-y-3 text-sm text-[#9B9B9B]">
            <li><a href="#" className="hover:text-[#111111] transition-colors">Matematik</a></li>
            <li><a href="#" className="hover:text-[#111111] transition-colors">Fen Bilimleri</a></li>
            <li><a href="#" className="hover:text-[#111111] transition-colors">Online Ders</a></li>
            <li><a href="#" className="hover:text-[#111111] transition-colors">Yüz Yüze Ders</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-[#111111] mb-5">Kurumsal</h4>
          <ul className="space-y-3 text-sm text-[#9B9B9B] mb-6">
            <li><a href="#" className="hover:text-[#111111] transition-colors">Biz Kimiz?</a></li>
            <li><a href="#" className="hover:text-[#111111] transition-colors">İletişim</a></li>
            <li><a href="#" className="hover:text-[#111111] transition-colors">KVKK</a></li>
          </ul>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="E-posta adresiniz"
              className="flex-1 border border-[#E8E8E8] rounded-lg px-4 py-2.5 text-sm text-[#111111] placeholder:text-[#9B9B9B] focus:outline-none focus:border-[#4F46E5] transition-colors"
            />
            <button className="px-4 py-2.5 bg-[#111111] text-white rounded-lg hover:bg-[#2a2a2a] transition-colors">
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="pt-8 border-t border-[#E8E8E8] flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-xs text-[#9B9B9B]">© 2026 TedrisEdu (Ahmet Duyar). Tüm hakları saklıdır.</p>
        <div className="flex gap-6 text-xs text-[#9B9B9B]">
          <a href="#" className="hover:text-[#111111] transition-colors">Gizlilik</a>
          <a href="#" className="hover:text-[#111111] transition-colors">Şartlar</a>
          <a href="#" className="hover:text-[#111111] transition-colors">KVKK</a>
        </div>
      </div>
    </div>
  </footer>
);

// --- Main Page ---

const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToAuth }) => {
  return (
    <div className="bg-white min-h-screen font-sans selection:bg-[#4F46E5] selection:text-white overflow-x-hidden">
      <Navbar onAuth={onNavigateToAuth} />
      <HeroSection onStart={() => onNavigateToAuth('register')} />
      <SubjectShowcase />
      <StatsBar />
      <ForParents />
      <ForTeachers />
      <AISystem />
      <HowItWorks />
      <FinalCTA onStart={() => onNavigateToAuth('register')} />
      <Footer />
    </div>
  );
};

export default LandingPage;
