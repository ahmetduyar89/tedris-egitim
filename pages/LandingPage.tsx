import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Menu,
  X,
  Calendar,
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
          <a href="#for-teachers" className="hover:text-[#111111] transition-colors">Öğretmenler</a>
          <a href="#for-parents" className="hover:text-[#111111] transition-colors">Veliler</a>
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
            className="px-5 py-2.5 bg-[#111111] text-white text-sm font-semibold rounded-xl hover:bg-[#2a2a2a] transition-colors"
          >
            Ücretsiz Başla
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
              <a href="#for-teachers" onClick={() => setMobileMenuOpen(false)}>Öğretmenler</a>
              <a href="#for-parents" onClick={() => setMobileMenuOpen(false)}>Veliler</a>
              <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>Nasıl Çalışır?</a>
              <a
                href="#"
                onClick={() => { onAuth('login'); setMobileMenuOpen(false); }}
                className="text-[#6B6B6B]"
              >
                Giriş Yap
              </a>
            </div>
            <div className="mt-auto">
              <button
                onClick={() => { onAuth('register'); setMobileMenuOpen(false); }}
                className="w-full py-4 bg-[#111111] text-white rounded-2xl font-semibold text-lg"
              >
                Ücretsiz Başla
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

// --- Hero Visual: Pure HTML Cards (no image) ---

const HeroVisual = () => (
  <div className="flex flex-col sm:flex-row gap-4 max-w-3xl mx-auto mt-16">
    {/* Teacher card */}
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="flex-1 bg-white border border-[#E8E8E8] rounded-2xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)]"
    >
      <div className="flex items-center gap-2 mb-5">
        <div className="w-2 h-2 rounded-full bg-[#4F46E5]" />
        <span className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-widest">Öğretmen Paneli</span>
      </div>
      <div className="space-y-3">
        {[
          { label: 'Haftalık Program', sub: 'AI tarafından optimize edildi', done: true },
          { label: 'Ali K. — Matematik', sub: 'Sınav analizi hazır', done: true },
          { label: 'Yeni Ders Talebi', sub: 'Veli: Zeynep H.', done: false },
        ].map((item, i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-[#F7F6F3]">
            <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${item.done ? 'bg-[#4F46E5]' : 'border-2 border-[#E8E8E8]'}`}>
              {item.done && <CheckCircle2 size={10} className="text-white" />}
            </div>
            <div>
              <p className="text-sm font-semibold text-[#111111]">{item.label}</p>
              <p className="text-xs text-[#9B9B9B]">{item.sub}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs text-[#4F46E5] font-semibold">
        <BrainCircuit size={14} />
        <span>AI 3 eksik kazanım tespit etti</span>
      </div>
    </motion.div>

    {/* Parent card */}
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.55 }}
      className="flex-1 bg-white border border-[#E8E8E8] rounded-2xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)]"
    >
      <div className="flex items-center gap-2 mb-5">
        <div className="w-2 h-2 rounded-full bg-[#059669]" />
        <span className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-widest">Veli Paneli</span>
      </div>
      <div className="space-y-3 mb-4">
        <div className="p-3 rounded-xl bg-[#F7F6F3]">
          <p className="text-xs text-[#9B9B9B] mb-1">Haftalık İlerleme — Ayşe</p>
          <div className="flex items-end gap-1 h-8">
            {[40, 60, 55, 75, 70, 85, 80].map((h, i) => (
              <div key={i} className="flex-1 rounded-sm bg-[#4F46E5]/20" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
        <div className="p-3 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0]">
          <div className="flex items-center gap-2">
            <Bell size={13} className="text-[#059669]" />
            <p className="text-xs font-semibold text-[#059669]">Matematik sınavı: 87/100</p>
          </div>
        </div>
      </div>
      <button className="w-full py-2.5 rounded-xl border border-[#E8E8E8] text-sm font-semibold text-[#111111] hover:bg-[#F7F6F3] transition-colors flex items-center justify-center gap-2">
        <Send size={14} /> Ders Talebi Gönder
      </button>
    </motion.div>
  </div>
);

// --- Hero ---

const HeroSection = ({ onStart }: { onStart: () => void }) => (
  <section className="pt-32 pb-24 bg-white">
    <div className="max-w-6xl mx-auto px-6 text-center">
      {/* Badge */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full border border-[#E8E8E8] bg-[#F7F6F3] text-xs font-semibold text-[#4F46E5] uppercase tracking-widest"
      >
        <Sparkles size={12} />
        Yapay Zeka Destekli Özel Ders Platformu
      </motion.div>

      {/* Headline */}
      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.05 }}
        className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-[#111111] font-montserrat tracking-tight leading-[1.08] mb-6"
      >
        Öğretmenler için güçlü. <br className="hidden md:block" />
        <span className="text-[#4F46E5]">Veliler için şeffaf.</span>
      </motion.h1>

      {/* Subheadline */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15 }}
        className="text-lg md:text-xl text-[#6B6B6B] mb-10 max-w-2xl mx-auto leading-relaxed"
      >
        Öğretmenler yapay zeka ile ders planlar ve öğrenci gelişimini yönetir.
        Veliler ise ilerlemeyi anlık takip eder ve yeni ders taleplerini doğrudan iletir.
      </motion.p>

      {/* CTAs */}
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
          Ücretsiz Deneyin
          <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
        <a
          href="#how-it-works"
          className="flex items-center gap-2 px-8 py-4 text-[#111111] font-semibold text-base hover:text-[#4F46E5] transition-colors"
        >
          Nasıl Çalışır? <ChevronRight size={16} />
        </a>
      </motion.div>

      {/* Hero Visual — no image, pure UI cards */}
      <HeroVisual />
    </div>
  </section>
);

// --- Stats Bar ---

const StatsBar = () => {
  const stats = [
    { value: '2.400+', label: 'Aktif Öğrenci' },
    { value: '%94', label: 'Veli Memnuniyeti' },
    { value: '180+', label: 'Öğretmen' },
    { value: '5 dk', label: 'Ortalama Kurulum' },
  ];

  return (
    <section className="py-16 border-y border-[#E8E8E8] bg-white">
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

// --- For Teachers ---

const ForTeachers = () => {
  const features = [
    {
      icon: <BrainCircuit size={22} />,
      title: 'AI Destekli Ders Planı',
      desc: 'Yapay zeka, öğrencinin eksik kazanımlarını tespit eder ve haftalık programı otomatik optimize eder.',
      points: ['Kazanım bazlı haftalık plan', 'Otomatik telafi seansları', 'Esnek takvim yönetimi'],
    },
    {
      icon: <BarChart3 size={22} />,
      title: 'Akıllı Sınav Analizi',
      desc: 'Her sınavdan sonra öğrencinin güçlü ve zayıf yönleri otomatik raporlanır. Müdahale zamanında gelir.',
      points: ['Kazanım bazlı hata analizi', 'Sınav karşılaştırmaları', 'İlerleme grafiği'],
    },
    {
      icon: <UserCheck size={22} />,
      title: 'Öğrenci & Ders Yönetimi',
      desc: 'Tüm öğrencilerinizi, ders taleplerini ve veli iletişimini tek bir panelden yönetin.',
      points: ['Gelen ders taleplerini onaylama', 'Ders geçmişi ve notlar', 'Veli raporlama araçları'],
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
            Zamanınızı Öğretmeye Ayırın
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-[#6B6B6B] text-lg max-w-xl mx-auto"
          >
            Planlama, takip ve raporlama işlerini yapay zekaya bırakın.
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

// --- For Parents ---

const ForParents = () => {
  const features = [
    {
      icon: <Send size={22} />,
      title: 'Ders Talebi Oluştur',
      desc: 'İstediğiniz ders, konu ve zaman dilimini seçerek birkaç tıkla ders talebinizi iletin. Öğretmen onaylar, sistem organize eder.',
      points: ['Konu ve sınıf bazlı talep', 'Uygun zaman dilimi seçimi', 'Onay bildirimi'],
    },
    {
      icon: <BarChart3 size={22} />,
      title: 'Gelişimi Anlık Takip Et',
      desc: 'Çocuğunuzun her sınavdaki performansını ve haftalık ilerleme raporunu gerçek zamanlı olarak görüntüleyin.',
      points: ['Haftalık ilerleme raporu', 'Konu bazlı başarı oranları', 'Öğretmen notları'],
    },
    {
      icon: <MessageSquare size={22} />,
      title: 'Şeffaf İletişim',
      desc: 'Öğretmenle doğrudan mesajlaşın ve ders sonrası özet bildirimlerini WhatsApp üzerinden alın.',
      points: ['Ders sonu otomatik özet', 'Öğretmenle mesajlaşma', 'Anlık bildirimler'],
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
            Her Adımda Yanınızdasınız
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-[#6B6B6B] text-lg max-w-xl mx-auto"
          >
            Ders talebinden ilerleme raporuna kadar her şey şeffaf ve erişilebilir.
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

// --- How It Works ---

const HowItWorks = () => {
  const tracks = [
    {
      label: 'Öğretmen',
      color: '#4F46E5',
      bg: '#EEF2FF',
      steps: [
        { icon: <BookOpen size={18} />, title: 'Profilini Oluştur', desc: 'Branş, müsaitlik ve ücret bilgilerini gir.' },
        { icon: <Bell size={18} />, title: 'Talepleri Yönet', desc: 'Gelen ders taleplerini görüntüle ve onayla.' },
        { icon: <BrainCircuit size={18} />, title: 'AI ile Planla', desc: 'Yapay zeka destekli program ve analiz araçlarını kullan.' },
      ],
    },
    {
      label: 'Veli',
      color: '#059669',
      bg: '#ECFDF5',
      steps: [
        { icon: <UserCheck size={18} />, title: 'Kayıt Ol', desc: 'Çocuğunun bilgilerini ve hedeflerini gir.' },
        { icon: <Send size={18} />, title: 'Ders Talebi Gönder', desc: 'İstediğin konu ve zamana göre talep oluştur.' },
        { icon: <BarChart3 size={18} />, title: 'Gelişimi Takip Et', desc: 'Haftalık raporlarla ilerlemeyi gerçek zamanlı izle.' },
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
            Herkes için 3 adım
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
      <motion.h2
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-4xl md:text-5xl font-extrabold text-white font-montserrat mb-6"
      >
        Bugün Başlayın.
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1 }}
        className="text-[#9B9B9B] text-lg mb-10"
      >
        14 gün ücretsiz. Kredi kartı gerekmez.
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
          className="group inline-flex items-center gap-2 px-10 py-4 bg-white text-[#111111] rounded-xl font-semibold text-base hover:bg-[#F0F0F0] transition-colors"
        >
          Öğretmen Olarak Başla
          <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
        <button
          onClick={onStart}
          className="group inline-flex items-center gap-2 px-10 py-4 bg-transparent text-white border border-white/20 rounded-xl font-semibold text-base hover:border-white/40 transition-colors"
        >
          Veli Olarak Kaydol
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
            Öğretmenler ve veliler için yapay zeka destekli özel ders platformu.
          </p>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-[#111111] mb-5">Platform</h4>
          <ul className="space-y-3 text-sm text-[#9B9B9B]">
            <li><a href="#for-teachers" className="hover:text-[#111111] transition-colors">Öğretmenler</a></li>
            <li><a href="#for-parents" className="hover:text-[#111111] transition-colors">Veliler</a></li>
            <li><a href="#how-it-works" className="hover:text-[#111111] transition-colors">Nasıl Çalışır?</a></li>
            <li><a href="#" className="hover:text-[#111111] transition-colors">Demo İste</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-[#111111] mb-5">Kurumsal</h4>
          <ul className="space-y-3 text-sm text-[#9B9B9B]">
            <li><a href="#" className="hover:text-[#111111] transition-colors">Biz Kimiz?</a></li>
            <li><a href="#" className="hover:text-[#111111] transition-colors">İletişim</a></li>
            <li><a href="#" className="hover:text-[#111111] transition-colors">KVKK</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-[#111111] mb-5">Bülten</h4>
          <p className="text-sm text-[#9B9B9B] mb-4">En son güncellemelerden haberdar olun.</p>
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
      <StatsBar />
      <ForTeachers />
      <ForParents />
      <HowItWorks />
      <FinalCTA onStart={() => onNavigateToAuth('register')} />
      <Footer />
    </div>
  );
};

export default LandingPage;
