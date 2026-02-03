import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';
import {
  Zap,
  Shield,
  Target,
  Users,
  Cpu,
  MessageSquare,
  Layout,
  ArrowRight,
  CheckCircle2,
  Star,
  Rocket,
  BrainCircuit,
  Clock,
  Smile,
  BarChart3,
  Bot,
  Menu,
  X,
  Play
} from 'lucide-react';

interface LandingPageProps {
  onNavigateToAuth: (mode?: 'login' | 'register') => void;
}

// --- Animation Variants ---
const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

// --- Custom Components ---

const GlassCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <motion.div
    whileHover={{ y: -5 }}
    className={`bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl ${className}`}
  >
    {children}
  </motion.div>
);

const SectionHeading = ({ badge, title, subtitle, light = false }: { badge?: string, title: string, subtitle?: string, light?: boolean }) => (
  <div className="text-center mb-16 px-4">
    {badge && (
      <motion.span
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        className="inline-block px-4 py-1.5 mb-6 text-xs font-bold tracking-widest uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full"
      >
        {badge}
      </motion.span>
    )}
    <motion.h2
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`text-3xl md:text-5xl font-extrabold mb-6 font-montserrat tracking-tight ${light ? 'text-white' : 'text-slate-900'}`}
    >
      {title}
    </motion.h2>
    {subtitle && (
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1 }}
        className={`max-w-2xl mx-auto text-lg leading-relaxed ${light ? 'text-slate-400' : 'text-slate-600'}`}
      >
        {subtitle}
      </motion.p>
    )}
  </div>
);

// --- Sub-sections ---

const HeroSection = ({ onStart }: { onStart: () => void }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);
  const y2 = useTransform(scrollY, [0, 500], [0, -150]);
  const rotateX = useTransform(scrollY, [0, 500], [0, 15]);

  return (
    <section ref={containerRef} className="relative min-h-screen flex items-center justify-center pt-24 pb-32 overflow-hidden bg-[#0A0F1D]">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-600/20 blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[100px]" style={{ animationDelay: '2s' }}></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]"></div>
      </div>

      <div className="container mx-auto px-4 z-10">
        <div className="flex flex-col items-center text-center max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-sm font-semibold"
          >
            <Zap size={16} className="fill-current" />
            <span>Eğitimin Yeni İşletim Sistemi</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-5xl md:text-7xl lg:text-8xl font-black text-white mb-8 font-montserrat tracking-tighter leading-[1.05]"
          >
            Eğitimin Yeni <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-500 to-indigo-400 animate-gradient-x">İşletim Sistemi</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl text-slate-400 mb-12 max-w-3xl leading-relaxed"
          >
            Veri ve Yapay Zeka ile başarıyı tasarlayın. Öğrenme haritaları ve akıllı algoritmalarla eğitimi yeniden tanımlıyoruz.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-6 w-full sm:w-auto"
          >
            <button
              onClick={onStart}
              className="group relative px-10 py-5 bg-indigo-600 text-white rounded-2xl font-bold text-xl overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(79,70,229,0.3)]"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                Hemen Başlayın <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
            <button className="px-10 py-5 bg-white/5 backdrop-blur-md text-white border border-white/10 rounded-2xl font-bold text-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2">
              <Play size={22} className="fill-current" /> Canlı İzleyin
            </button>
          </motion.div>
        </div>

        {/* 3D Dashboard Mockup */}
        <motion.div
          style={{ y: y1, rotateX }}
          className="relative mt-24 max-w-6xl mx-auto perspective-2000"
        >
          <div className="relative group">
            {/* Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>

            <GlassCard className="relative p-2 border-white/20">
              <img
                src="/learning-map.png"
                alt="Tedris Learning Universe"
                className="w-full h-auto rounded-[1.8rem] shadow-2xl"
              />
            </GlassCard>

            {/* Floating UI Elements */}
            <motion.div
              style={{ y: y2 }}
              className="absolute -right-12 top-1/4 bg-slate-900/90 backdrop-blur-2xl p-6 rounded-3xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] hidden lg:block"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center text-green-400">
                  <BarChart3 size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Başarı Oranı</p>
                  <p className="text-2xl font-black text-white">+%42.8</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              style={{ y: y1 }}
              className="absolute -left-12 bottom-1/4 bg-slate-900/90 backdrop-blur-2xl p-6 rounded-3xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] hidden lg:block"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Bot size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">AI Asistan</p>
                  <p className="text-lg font-bold text-white">3 Kritik Eksik Tespit Edildi</p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const BentoEcosystem = () => {
  const personas = [
    {
      id: 'admin',
      role: 'Yönetici',
      title: 'Tüm Süreçlere Hâkim Olun',
      desc: 'Şubeler, öğretmenler ve finansal akışı tek bir merkezden, gerçek zamanlı verilerle yönetin.',
      icon: <Shield size={32} className="text-blue-400" />,
      image: '/hero-dashboard.png',
      color: 'from-blue-500/20 to-indigo-600/20'
    },
    {
      id: 'teacher',
      role: 'Öğretmen',
      title: 'Süper Güçlerinizi Keşfedin',
      desc: 'Akıllı planlama ve yapay zeka asistanı ile ders yükünüzü azaltın, veriminizi artırın.',
      icon: <Zap size={32} className="text-indigo-400" />,
      image: '/teacher-dashboard.png',
      color: 'from-indigo-500/20 to-purple-600/20'
    },
    {
      id: 'student',
      role: 'Öğrenci',
      title: 'Öğrenme Galaksine Hoş Geldin',
      desc: 'Kişisel öğrenme haritanı takip et, SRS sistemi ile öğrendiklerini asla unutma.',
      icon: <Rocket size={32} className="text-orange-400" />,
      image: '/student-dashboard.png',
      color: 'from-orange-500/20 to-red-600/20'
    },
    {
      id: 'parent',
      role: 'Veli',
      title: 'Huzurlu ve Şeffaf Takip',
      desc: 'Çocuğunuzun gelişimini anlık bildirimlerle izleyin, başarı yolculuğuna eşlik edin.',
      icon: <Smile size={32} className="text-green-400" />,
      image: '/public-share.png', // Or another representative image
      color: 'from-green-500/20 to-emerald-600/20'
    }
  ];

  return (
    <section id="ecosystem" className="py-32 bg-[#050810]">
      <div className="container mx-auto px-4">
        <SectionHeading
          badge="Ürün Ekosistemi"
          title="Her Rol İçin Kusursuz Deneyim"
          subtitle="Admin'den öğrenciye, her kullanıcı için özelleşmiş akıllı dashboard'lar ile eğitimde verimliliği zirveye taşıyoruz."
          light
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {personas.map((p, idx) => (
            <GlassCard key={p.id} className="group h-[500px] flex flex-col p-8 border-white/5 hover:border-white/20 transition-all">
              <div className="mb-6 space-y-4">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${p.color} flex items-center justify-center mb-6 ring-1 ring-white/10 group-hover:scale-110 transition-transform`}>
                  {p.icon}
                </div>
                <span className="text-sm font-bold text-indigo-400 uppercase tracking-widest">{p.role}</span>
                <h3 className="text-2xl font-bold text-white leading-tight font-montserrat">{p.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{p.desc}</p>
              </div>

              <div className="mt-auto relative h-40 overflow-hidden rounded-2xl border border-white/10">
                <img
                  src={p.image}
                  alt={p.role}
                  className="w-full h-full object-cover object-top opacity-50 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050810] via-transparent to-transparent"></div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
};

const InteractiveFeatures = () => {
  const [activeTab, setActiveTab] = useState(0);

  const features = [
    {
      title: "Akıllı Program",
      subtitle: "Smart Schedule",
      desc: "Yapay zeka, öğrencinin zayıf alanlarını tespit eder ve haftalık programa otomatik telafi seansları ekler.",
      image: "/feature-schedule.png",
      icon: <Clock size={24} />
    },
    {
      title: "AI Analiz",
      subtitle: "Deep Learning Insights",
      desc: "Her sınavdan sonra gelişmiş istatistikler ve soru bazlı kazanım analizleri ile nokta atışı tespitler yapın.",
      image: "/showcase-performance.png",
      icon: <BarChart3 size={24} />
    },
    {
      title: "Soru Bankası",
      subtitle: "Universal Repository",
      desc: "Binlerce soru arasından saniyeler içinde quiz oluşturun, benzer soruları AI ile hemen bulun.",
      image: "/feature-qbank.png",
      icon: <Cpu size={24} />
    },
    {
      title: "Türkçe Pratik",
      subtitle: "Language Proficiency",
      desc: "Okuma hızı, anlama kapasitesi ve yazım hataları için özel olarak geliştirilmiş interaktif modüller.",
      image: "/feature-subjects.png",
      icon: <MessageSquare size={24} />
    }
  ];

  return (
    <section className="py-32 bg-white overflow-hidden">
      <div className="container mx-auto px-4">
        <SectionHeading
          badge="Özellikler"
          title="Karmaşaya Son Verin"
          subtitle="Eğitimin her aşamasını dijitalleştiren, birbirine bağlı ve akıllı modüllerimizle kontrolü elinize alın."
        />

        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-16 items-center">
          {/* Side Tabs */}
          <div className="w-full lg:w-1/3 flex flex-col gap-4">
            {features.map((f, idx) => (
              <button
                key={idx}
                onClick={() => setActiveTab(idx)}
                className={`relative group flex items-start gap-6 p-6 rounded-[2rem] border transition-all duration-500 text-left ${activeTab === idx
                    ? 'bg-slate-900 border-slate-900 shadow-[0_20px_40px_rgba(15,23,42,0.2)] scale-105 z-10'
                    : 'bg-slate-50 border-slate-100 hover:border-slate-200 hover:bg-slate-100 grayscale hover:grayscale-0'
                  }`}
              >
                <div className={`p-4 rounded-2xl transition-all ${activeTab === idx ? 'bg-indigo-600 text-white' : 'bg-white shadow-sm text-slate-400'
                  }`}>
                  {f.icon}
                </div>
                <div>
                  <h4 className={`text-xl font-bold mb-1 font-montserrat ${activeTab === idx ? 'text-white' : 'text-slate-900'}`}>{f.title}</h4>
                  <p className={`text-sm mb-3 font-semibold uppercase tracking-widest ${activeTab === idx ? 'text-indigo-400' : 'text-slate-400'}`}>{f.subtitle}</p>
                  {activeTab === idx && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="text-slate-400 text-sm leading-relaxed"
                    >
                      {f.desc}
                    </motion.p>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Screenshot Display */}
          <div className="w-full lg:w-2/3">
            <div className="relative aspect-[16/10] bg-slate-100 rounded-[3rem] p-4 shadow-2xl border border-slate-200 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, scale: 0.95, x: 20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 1.05, x: -20 }}
                  transition={{ duration: 0.5, ease: "circOut" }}
                  className="w-full h-full"
                >
                  <img
                    src={features[activeTab].image}
                    alt={features[activeTab].title}
                    className="w-full h-full object-cover object-top rounded-[2rem] shadow-inner"
                  />
                  {/* Fake UI Overlay */}
                  <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-[2rem]"></div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const AIHighlight = () => (
  <section className="py-32 bg-[#050810] relative overflow-hidden">
    <div className="absolute inset-0">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/10 blur-[150px]"></div>
    </div>

    <div className="container mx-auto px-4 relative z-10">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-16">
        <div className="w-full lg:w-1/2 order-2 lg:order-1">
          <div className="relative">
            <div className="absolute -inset-4 bg-indigo-500/20 rounded-[2.5rem] blur-2xl"></div>
            <GlassCard className="p-2 border-white/20">
              <img src="/ai-assistant.png" alt="AI Mentor" className="w-full h-auto rounded-3xl" />
            </GlassCard>

            {/* AI Tags */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute -top-6 -right-6 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold shadow-xl flex items-center gap-2"
            >
              <BrainCircuit size={20} /> AI Gücü Aktif
            </motion.div>
          </div>
        </div>

        <div className="w-full lg:w-1/2 order-1 lg:order-2">
          <SectionHeading
            badge="Yapay Zeka"
            title="Eğitimcinin Akıllı Yardımcısı"
            subtitle="Tedris AI sadece soru çözmez; öğrencinin öğrenme davranışlarını analiz eder ve kişiselleştirilmiş bir mentor gibi eşlik eder."
            light
          />

          <div className="space-y-6 mt-8">
            {[
              { title: "Güvenli AI Mentor", desc: "Öğrencilerin 7/24 soru sorabileceği, müfredat sınırları içinde kalan güvenli asistan.", icon: <Users size={24} /> },
              { title: "Otomatik Kompozisyon Analizi", desc: "Yazılı çalışmaları saniyeler içinde, belirlenen kriterlere göre detaylıca puanlar ve öneriler sunar.", icon: <CheckCircle2 size={24} /> },
              { title: "Eksik Kazanım Tespiti", desc: "Yanlış yapılan her sorunun kök nedenini (kazanım) bulur ve telafi planı oluşturur.", icon: <Target size={24} /> }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-4 p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400">
                  {item.icon}
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white mb-2">{item.title}</h4>
                  <p className="text-slate-400 text-sm">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
);

const BentoFeatures = () => {
  const features = [
    {
      title: "SRS Sistemi",
      desc: "Aralıklı Tekrar ile kalıcı öğrenme.",
      icon: <BrainCircuit size={40} className="text-red-400" />,
      size: "lg:col-span-2 text-white bg-gradient-to-br from-red-600/40 to-indigo-900/40 border-red-500/20",
      image: "/showcase-srs.png"
    },
    {
      title: "Gamification",
      desc: "Rozetler ve Seriler (Streaks).",
      icon: <Star size={40} className="text-yellow-400" />,
      size: "lg:col-span-1 bg-slate-900/40 text-white"
    },
    {
      title: "WhatsApp",
      desc: "Veli & Öğretmen anlık bilgilendirme.",
      icon: <MessageSquare size={40} className="text-green-400" />,
      size: "lg:col-span-1 bg-slate-900/40 text-white"
    },
    {
      title: "Akıllı Araçlar",
      desc: "Kronometre ve Oturma Planı.",
      icon: <Layout size={40} className="text-blue-400" />,
      size: "lg:col-span-2 text-white bg-gradient-to-br from-blue-600/40 to-slate-900/40 border-blue-500/20",
      image: "/showcase-planning.png"
    }
  ];

  return (
    <section className="py-32 bg-[#0A0F1D]">
      <div className="container mx-auto px-4">
        <SectionHeading
          badge="Detaylar"
          title="Her Şey Tek Bir Çatıda"
          subtitle="Modüler yapımız sayesinde ihtiyacınız olan tüm araçlara tek tıkla ulaşın."
          light
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {features.map((f, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -10 }}
              className={`relative overflow-hidden rounded-[2.5rem] p-8 border ${f.size} transition-all`}
            >
              <div className="relative z-10">
                <div className="mb-6">{f.icon}</div>
                <h3 className="text-3xl font-black mb-2 font-montserrat">{f.title}</h3>
                <p className="text-slate-400 text-lg leading-relaxed">{f.desc}</p>
              </div>
              {f.image && (
                <div className="absolute bottom-[-20px] right-[-20px] w-2/3 opacity-30 group-hover:opacity-50 transition-opacity">
                  <img src={f.image} alt={f.title} className="rounded-2xl" />
                </div>
              )}
              {/* Background Glow */}
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/5 blur-3xl rounded-full"></div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
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
    <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${scrolled ? 'bg-[#0A0F1D]/80 backdrop-blur-2xl border-b border-white/10 py-4' : 'bg-transparent py-8'
      }`}>
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <img src="/logo-full.png" alt="TedrisEDU" className="h-10 w-auto invert brightness-0 sm:brightness-100 sm:invert-0" style={{ filter: 'brightness(0) invert(1)' }} />
        </div>

        {/* Desktop Links */}
        <div className="hidden lg:flex items-center gap-10 text-sm font-bold uppercase tracking-widest text-slate-400">
          <a href="#ecosystem" className="hover:text-white transition-colors">Ekosistem</a>
          <a href="#features" className="hover:text-white transition-colors">Özellikler</a>
          <a href="#pricing" className="hover:text-white transition-colors">Fiyatlandırma</a>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => onAuth('login')}
            className="hidden sm:block text-white font-bold text-sm hover:text-indigo-400 transition-colors uppercase tracking-widest"
          >
            Giriş
          </button>
          <button
            onClick={() => onAuth('register')}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-sm transition-all shadow-lg active:scale-95 uppercase tracking-widest"
          >
            Ücretsiz Başla
          </button>
          <button className="lg:hidden text-white" onClick={() => setMobileMenuOpen(true)}>
            <Menu size={28} />
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            className="fixed inset-0 bg-[#0A0F1D] z-[200] p-8 flex flex-col"
          >
            <div className="flex justify-between items-center mb-16">
              <img src="/logo-full.png" alt="TedrisEDU" className="h-10 w-auto invert brightness-0" />
              <button onClick={() => setMobileMenuOpen(false)} className="text-white">
                <X size={32} />
              </button>
            </div>
            <div className="flex flex-col gap-8 text-2xl font-bold text-white">
              <a href="#ecosystem" onClick={() => setMobileMenuOpen(false)}>Ekosistem</a>
              <a href="#features" onClick={() => setMobileMenuOpen(false)}>Özellikler</a>
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)}>Fiyatlandırma</a>
              <hr className="border-white/10" />
              <button onClick={() => { onAuth('login'); setMobileMenuOpen(false); }} className="text-left text-indigo-400">Giriş Yap</button>
            </div>
            <div className="mt-auto">
              <button onClick={() => { onAuth('register'); setMobileMenuOpen(false); }} className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-bold text-xl">Hemen Kaydol</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

// --- Footer ---

const PremiumFooter = () => (
  <footer className="bg-[#050810] pt-32 pb-16 border-t border-white/5">
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-24">
        <div className="col-span-1 md:col-span-1">
          <img src="/logo-full.png" alt="Tedris" className="h-12 w-auto mb-8 invert brightness-0" />
          <p className="text-slate-500 leading-relaxed mb-8">
            Eğitimin yeni işletim sistemi. Başarıyı tesadüflere değil, verilere ve yapay zekaya bırakın.
          </p>
          <div className="flex gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-indigo-600 transition-all cursor-pointer flex items-center justify-center">
                <Rocket size={18} className="text-slate-400 group-hover:text-white" />
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-white font-bold mb-8 uppercase tracking-widest text-sm">Ürün</h4>
          <ul className="space-y-4 text-slate-500 text-sm">
            <li><a href="#" className="hover:text-white transition-colors">Özellikler</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Fiyatlandırma</a></li>
            <li><a href="#" className="hover:text-white transition-colors">AI Mentor</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Demo İste</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-8 uppercase tracking-widest text-sm">Kurumsal</h4>
          <ul className="space-y-4 text-slate-500 text-sm">
            <li><a href="#" className="hover:text-white transition-colors">Biz Kimiz?</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Haberler</a></li>
            <li><a href="#" className="hover:text-white transition-colors">İletişim</a></li>
            <li><a href="#" className="hover:text-white transition-colors">KVKK</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-8 uppercase tracking-widest text-sm">Haber bülteni</h4>
          <p className="text-slate-500 text-sm mb-6">En son güncellemelerden haberdar olun.</p>
          <div className="flex gap-2">
            <input type="email" placeholder="E-posta" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 flex-1" />
            <button className="px-4 py-3 bg-indigo-600 text-white rounded-xl"><ArrowRight size={20} /></button>
          </div>
        </div>
      </div>

      <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
        <p className="text-slate-600 text-sm italic">© 2026 TedrisEdu (Ahmet Duyar). Tüm hakları saklıdır.</p>
        <div className="flex gap-8 text-xs text-slate-600 uppercase tracking-widest font-bold">
          <a href="#">Gizlilik</a>
          <a href="#">Şartlar</a>
          <a href="#">KVKK</a>
        </div>
      </div>
    </div>
  </footer>
);

// --- Main Page ---

const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToAuth }) => {
  return (
    <div className="bg-[#0A0F1D] min-h-screen font-sans selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      <Navbar onAuth={onNavigateToAuth} />

      <HeroSection onStart={() => onNavigateToAuth('register')} />

      <BentoEcosystem />

      <InteractiveFeatures />

      <AIHighlight />

      <BentoFeatures />

      {/* Pricing Teaser */}
      <section id="pricing" className="py-32 bg-white relative overflow-hidden">
        <div className="container mx-auto px-4 text-center">
          <SectionHeading
            badge="Fiyatlandırma"
            title="Her Kurum İçin Bir Tedris"
            subtitle="Şeffaf ve ölçeklenebilir fiyatlandırma modellerimizle tanışın."
          />
          <GlassCard className="max-w-4xl mx-auto p-12 bg-slate-900 border-none shadow-[0_40px_100px_rgba(0,0,0,0.3)]">
            <div className="flex flex-col md:flex-row items-center justify-between gap-12">
              <div className="text-left">
                <h3 className="text-4xl font-black text-white mb-4">Profesyonel Paket</h3>
                <p className="text-slate-400 max-w-sm">Tüm AI özellikleri, sınırsız öğrenci ve gelişmiş analizler dahil.</p>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-6xl font-black text-white mb-2">₺499<span className="text-xl text-slate-500">/ay</span></span>
                <button
                  onClick={() => onNavigateToAuth('register')}
                  className="w-full px-12 py-5 bg-indigo-600 text-white rounded-2xl font-bold text-xl hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-500/20"
                >
                  Hemen Başla
                </button>
              </div>
            </div>
          </GlassCard>
          <p className="mt-12 text-slate-500">
            Daha büyük kurumlar için <a href="#" className="text-indigo-600 font-bold hover:underline">Kurumsal Paket</a> seçeneklerimize göz atın.
          </p>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-40 bg-indigo-600 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-50%] left-[-20%] w-[100%] h-[100%] bg-blue-400/20 blur-[150px] rounded-full"></div>
          <div className="absolute bottom-[-50%] right-[-20%] w-[100%] h-[100%] bg-white/10 blur-[150px] rounded-full"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.h2
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="text-4xl md:text-7xl font-black text-white mb-12 font-montserrat tracking-tighter"
          >
            Eğitimde <br className="sm:hidden" /> Dönüşümü <br /> Bugün Başlatın.
          </motion.h2>
          <button
            onClick={() => onNavigateToAuth('register')}
            className="px-16 py-6 bg-white text-indigo-700 rounded-3xl font-black text-2xl hover:bg-indigo-50 hover:scale-105 active:scale-95 transition-all shadow-2xl"
          >
            14 Gün Ücretsiz Deneyin
          </button>
          <p className="mt-8 text-white/60 font-medium">Kredi kartı gerekmez. Anında kurulum.</p>
        </div>
      </section>

      <PremiumFooter />

      <style>{`
        .perspective-2000 { perspective: 2000px; }
        .animate-gradient-x {
           background-size: 200% 200%;
           animation: gradient-x 8s ease infinite;
        }
        @keyframes gradient-x {
           0% { background-position: 0% 50% }
           50% { background-position: 100% 50% }
           100% { background-position: 0% 50% }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
