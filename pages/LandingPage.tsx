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
} from 'lucide-react';

interface LandingPageProps {
  onNavigateToAuth: (mode?: 'login' | 'register') => void;
}

// --- Animation ---
const fadeInUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: 'easeOut' },
};

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
        {/* Logo */}
        <img src="/logo-full.png" alt="Tedris" className="h-8 w-auto" />

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#6B6B6B]">
          <a href="#features" className="hover:text-[#111111] transition-colors">Özellikler</a>
          <a href="#how-it-works" className="hover:text-[#111111] transition-colors">Nasıl Çalışır?</a>
        </div>

        {/* Desktop actions */}
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

        {/* Mobile hamburger */}
        <button className="md:hidden text-[#111111]" onClick={() => setMobileMenuOpen(true)}>
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile overlay */}
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
              <a href="#features" onClick={() => setMobileMenuOpen(false)}>Özellikler</a>
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

// --- Hero ---

const HeroSection = ({ onStart }: { onStart: () => void }) => (
  <section className="pt-32 pb-24 bg-white">
    <div className="max-w-6xl mx-auto px-6 text-center">
      {/* Badge */}
      <motion.div {...fadeInUp} className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full border border-[#E8E8E8] bg-[#F7F6F3] text-xs font-semibold text-[#4F46E5] uppercase tracking-widest">
        <span className="w-1.5 h-1.5 rounded-full bg-[#4F46E5] animate-pulse inline-block" />
        Özel Ders Yönetim Sistemi
      </motion.div>

      {/* Headline */}
      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.05 }}
        className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-[#111111] font-montserrat tracking-tight leading-[1.08] mb-6"
      >
        Öğrencilerinizi <br className="hidden md:block" />
        Daha İyi Takip Edin.
      </motion.h1>

      {/* Subheadline */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15 }}
        className="text-lg md:text-xl text-[#6B6B6B] mb-10 max-w-2xl mx-auto leading-relaxed"
      >
        Ders planlaması, öğrenci analizi ve veli iletişimi — hepsi tek bir akıllı platformda.
        Özel ders verenlere özel tasarlandı.
      </motion.p>

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.25 }}
        className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
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

      {/* Dashboard Screenshot */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.35 }}
        className="relative max-w-5xl mx-auto"
      >
        <div className="rounded-2xl border border-[#E8E8E8] shadow-[0_20px_60px_rgba(0,0,0,0.08)] overflow-hidden">
          <img
            src="/learning-map.png"
            alt="Tedris Dashboard"
            className="w-full h-auto"
          />
        </div>
      </motion.div>
    </div>
  </section>
);

// --- Stats Bar ---

const StatsBar = () => {
  const stats = [
    { value: '2.400+', label: 'Aktif Öğrenci' },
    { value: '%94', label: 'Öğrenci Memnuniyeti' },
    { value: '180+', label: 'Öğretmen' },
    { value: '48 saat', label: 'Ortalama Kurulum' },
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

// --- Features ---

const Features = () => {
  const features = [
    {
      icon: <Calendar size={22} />,
      title: 'Akıllı Ders Planı',
      desc: 'Öğrencinin eksik kazanımlarına göre haftalık program otomatik oluşturulur. Siz onaylayın, sistem uygulasın.',
      points: ['Kazanım bazlı planlama', 'Otomatik telafi seansları', 'Esnek takvim entegrasyonu'],
    },
    {
      icon: <BarChart3 size={22} />,
      title: 'AI Destekli Analiz',
      desc: 'Her sınavdan sonra öğrencinin güçlü ve zayıf alanları otomatik tespit edilir. Raporlar anında hazır.',
      points: ['Kazanım bazlı raporlama', 'Sınav karşılaştırmaları', 'İlerleme grafiği'],
    },
    {
      icon: <MessageSquare size={22} />,
      title: 'Veli Bilgilendirmesi',
      desc: 'WhatsApp üzerinden velilere otomatik gelişim özeti gönderilir. Şeffaf iletişim, güçlü güven.',
      points: ['Otomatik haftalık özet', 'Anlık bildirimler', 'Veli takip paneli'],
    },
  ];

  return (
    <section id="features" className="py-24 bg-[#F7F6F3]">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section heading */}
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="inline-block text-xs font-bold uppercase tracking-widest text-[#4F46E5] mb-4"
          >
            Özellikler
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-extrabold text-[#111111] font-montserrat mb-4"
          >
            Özel Dersin İhtiyaç Duyduğu Her Şey
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-[#6B6B6B] text-lg max-w-xl mx-auto"
          >
            Gereksiz karmaşa yok. Sadece işe yarayan araçlar.
          </motion.p>
        </div>

        {/* Cards */}
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
              <div className="w-10 h-10 rounded-xl bg-[#F7F6F3] flex items-center justify-center text-[#111111] mb-6">
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

// --- How It Works ---

const HowItWorks = () => {
  const steps = [
    {
      number: '01',
      title: 'Öğrencini Ekle',
      desc: 'İsim, sınıf ve hedeflerini girin. Beş dakikada kurulum tamamlanır.',
    },
    {
      number: '02',
      title: 'Dersi Planla',
      desc: 'AI önerilerini kabul edin ya da kendiniz düzenleyin. Takvim otomatik hazır.',
    },
    {
      number: '03',
      title: 'Sonuçları Takip Et',
      desc: 'Haftalık raporlarla öğrencinin ilerlemeyi görselleştirin ve velilere paylaşın.',
    },
  ];

  return (
    <section id="how-it-works" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="inline-block text-xs font-bold uppercase tracking-widest text-[#4F46E5] mb-4"
          >
            Başlangıç
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-extrabold text-[#111111] font-montserrat"
          >
            3 Adımda Hazır
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="relative flex flex-col items-start p-8 md:p-10"
            >
              {/* Divider between steps on desktop */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-14 right-0 w-px h-8 bg-[#E8E8E8]" />
              )}

              <p className="text-5xl font-black text-[#E8E8E8] font-montserrat mb-6 select-none">
                {step.number}
              </p>
              <h3 className="text-xl font-bold text-[#111111] mb-3 font-montserrat">{step.title}</h3>
              <p className="text-[#6B6B6B] text-sm leading-relaxed">{step.desc}</p>
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
      >
        <button
          onClick={onStart}
          className="group inline-flex items-center gap-2 px-10 py-4 bg-white text-[#111111] rounded-xl font-semibold text-base hover:bg-[#F0F0F0] transition-colors"
        >
          Ücretsiz Hesap Aç
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
        {/* Brand */}
        <div className="md:col-span-1">
          <img src="/logo-full.png" alt="Tedris" className="h-8 w-auto mb-4" />
          <p className="text-sm text-[#9B9B9B] leading-relaxed">
            Özel ders verenlerin başarısını verilere bırakın.
          </p>
        </div>

        {/* Ürün */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-[#111111] mb-5">Ürün</h4>
          <ul className="space-y-3 text-sm text-[#9B9B9B]">
            <li><a href="#features" className="hover:text-[#111111] transition-colors">Özellikler</a></li>
            <li><a href="#how-it-works" className="hover:text-[#111111] transition-colors">Nasıl Çalışır?</a></li>
            <li><a href="#" className="hover:text-[#111111] transition-colors">AI Mentor</a></li>
            <li><a href="#" className="hover:text-[#111111] transition-colors">Demo İste</a></li>
          </ul>
        </div>

        {/* Kurumsal */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-[#111111] mb-5">Kurumsal</h4>
          <ul className="space-y-3 text-sm text-[#9B9B9B]">
            <li><a href="#" className="hover:text-[#111111] transition-colors">Biz Kimiz?</a></li>
            <li><a href="#" className="hover:text-[#111111] transition-colors">İletişim</a></li>
            <li><a href="#" className="hover:text-[#111111] transition-colors">KVKK</a></li>
          </ul>
        </div>

        {/* Newsletter */}
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

      {/* Bottom bar */}
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
      <Features />
      <HowItWorks />
      <FinalCTA onStart={() => onNavigateToAuth('register')} />
      <Footer />
    </div>
  );
};

export default LandingPage;
