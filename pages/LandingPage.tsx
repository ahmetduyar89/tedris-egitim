import React, { useState, useEffect } from 'react';

interface LandingPageProps {
  onNavigateToAuth: (mode?: 'login' | 'register') => void;
}

// --- Components ---

const TedrisLogo = ({ light = false }) => (
  <img src="/logo-full.png" alt="TedrisEDU" className="h-10 w-auto" style={{ filter: light ? 'brightness(0) invert(1)' : 'none' }} />
);

const FeatureCard = ({ icon, title, description, color }: { icon: string, title: string, description: string, color: string }) => (
  <div className="group p-8 rounded-3xl bg-white border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 hover:-translate-y-1 overflow-hidden relative">
    <div className={`absolute top-0 right-0 w-32 h-32 bg-${color}-50 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700`}></div>
    <div className="relative z-10">
      <div className={`w-14 h-14 rounded-2xl bg-${color}-50 flex items-center justify-center text-3xl mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-800 mb-3 font-poppins">{title}</h3>
      <p className="text-slate-600 leading-relaxed text-sm">
        {description}
      </p>
    </div>
  </div>
);

const StatCard = ({ value, label }: { value: string, label: string }) => (
  <div className="text-center">
    <div className="text-4xl md:text-5xl font-extrabold text-white mb-2 tracking-tight">{value}</div>
    <div className="text-indigo-100 font-medium text-sm uppercase tracking-wider opacity-80">{label}</div>
  </div>
);

const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToAuth }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-900 selection:bg-indigo-500/30 overflow-x-hidden">

      {/* --- Navigation --- */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-lg shadow-sm py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <TedrisLogo light={false} />

          <div className="flex items-center gap-3 sm:gap-6">
            <button
              onClick={() => onNavigateToAuth('login')}
              className="px-5 py-2.5 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-full hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm active:scale-95"
            >
              Giriş Yap
            </button>
            <button
              onClick={() => onNavigateToAuth('register')}
              className="hidden sm:block bg-slate-900 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-slate-800 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
            >
              Öğretmen Başvurusu
            </button>
          </div>
        </div>
      </nav>

      {/* --- Hero Section --- */}
      <div className="relative pt-24 pb-16 lg:pt-36 lg:pb-24 overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1000px] overflow-hidden -z-10 bg-white">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-200/30 blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-[10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-200/30 blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] rounded-full bg-pink-200/30 blur-[100px] animate-pulse" style={{ animationDelay: '4s' }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-50 text-teal-700 text-xs font-bold uppercase tracking-wider mb-6 border border-teal-100 shadow-sm animate-fade-in-up">
            <span className="w-2 h-2 rounded-full bg-[#2BB4A9] animate-ping"></span>
            Yeni Nesil Eğitim Platformu
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6 font-poppins max-w-4xl mx-auto">
            Özel Derslerinizi <br />
            <span className="bg-gradient-to-r from-[#2BB4A9] via-[#F5C542] to-[#F05039] text-transparent bg-clip-text">Yapay Zeka ile Yönetin</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-500 mb-8 max-w-2xl mx-auto leading-relaxed">
            Öğrenci takibi, otomatik ders programlama ve kişiselleştirilmiş analizler.
            Eğitimciler için tasarlanmış profesyonel asistanınız.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-12 px-4 sm:px-0">
            <button
              onClick={() => onNavigateToAuth('register')}
              className="w-full sm:w-auto px-6 py-3.5 bg-[#2BB4A9] text-white rounded-xl font-bold text-base shadow-lg shadow-teal-500/20 hover:shadow-xl hover:shadow-teal-500/40 hover:-translate-y-1 transition-all duration-300 flex items-center gap-2 min-w-[180px] justify-center"
            >
              Hemen Başla
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
            <button
              onClick={() => onNavigateToAuth('login')}
              className="w-full sm:w-auto px-6 py-3.5 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold text-base hover:bg-slate-50 hover:border-slate-300 transition-all duration-300 min-w-[180px]"
            >
              Giriş Yap
            </button>
          </div>

          {/* Hero Image / Dashboard Mockup */}
          <div className="relative max-w-4xl mx-auto mt-8 perspective-2000 group">
            {/* Glow Effect - Smaller & Subtler */}
            <div className="absolute -inset-4 bg-gradient-to-r from-[#2BB4A9] via-[#F5C542] to-[#F05039] rounded-[2rem] blur-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>

            <div className="relative bg-white rounded-xl shadow-2xl border border-slate-200/60 overflow-hidden transform rotate-x-6 transition-transform duration-700 hover:rotate-x-0 group-hover:scale-[1.02]">
              {/* Browser Status Bar */}
              <div className="h-8 bg-slate-100 border-b border-slate-200 flex items-center px-4 gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                <div className="ml-4 bg-white px-3 py-0.5 rounded text-[10px] text-slate-400 font-mono flex-1 text-center">texdrisedu.com/dashboard</div>
              </div>

              {/* Image Content */}
              <div className="relative aspect-[16/9] bg-slate-50">
                <img
                  src="/teacher-dashboard.png"
                  alt="Platform Önizleme"
                  className="w-full h-full object-cover object-top"
                  onError={(e) => {
                    // Fallback content if image missing
                    const target = e.currentTarget as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement!.innerHTML = `
                      <div class="flex items-center justify-center p-20 h-full w-full bg-slate-50 text-slate-300">
                        <div class="text-center">
                           <div class="text-5xl mb-4">📊</div>
                           <div class="text-xl font-bold text-slate-400">Dashboard Önizlemesi</div>
                        </div>
                      </div>
                     `;
                  }}
                />

                {/* Floating Badges - Repositioned */}
                <div className="absolute top-6 left-6 bg-white/90 backdrop-blur shadow-lg p-2.5 rounded-lg border border-white/50 animate-bounce cursor-default hidden md:block" style={{ animationDuration: '3s' }}>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-lg">🚀</div>
                    <div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase">Başarı</div>
                      <div className="text-xs font-bold text-slate-800">%35 Artış</div>
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-12 right-6 bg-white/90 backdrop-blur shadow-lg p-2.5 rounded-lg border border-white/50 animate-bounce cursor-default hidden md:block" style={{ animationDuration: '4s' }}>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-lg">🤖</div>
                    <div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase">AI Analiz</div>
                      <div className="text-xs font-bold text-slate-800">Aktif</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- Features Grid (Bento Style) --- */}
      <div className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6 font-poppins">Eğitimin Geleceği Burada</h2>
            <p className="text-lg text-slate-600">Her detayı öğretmenler ve öğrenciler için düşünülmüş, kapsamlı teknoloji.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon="🧠"
              title="AI Destekli Analiz"
              description="Google Gemini altyapısı ile öğrencilerin eksiklerini tespit edin ve kişiye özel çalışma programları oluşturun."
              color="indigo"
            />
            <FeatureCard
              icon="📅"
              title="Akıllı Takvim"
              description="Ders saatlerini, tekrarları ve sınav tarihlerini otomatik optimize eden akıllı ajanda."
              color="purple"
            />
            <FeatureCard
              icon="📚"
              title="Zengin İçerik Kütüphanesi"
              description="Binlerce soru, konu anlatımı ve interaktif materyale anında erişim sağlayın."
              color="blue"
            />
            <FeatureCard
              icon="📊"
              title="Detaylı Raporlama"
              description="Veli ve öğrencilerle paylaşabileceğiniz profesyonel gelişim raporları."
              color="green"
            />
            <FeatureCard
              icon="💬"
              title="7/24 AI Asistan"
              description="Öğrencileriniz takıldıkları sorularda anında yapay zeka asistanından ipucu alabilir."
              color="pink"
            />
            <FeatureCard
              icon="🏆"
              title="Oyunlaştırma"
              description="Rozetler, puanlar ve liderlik tabloları ile öğrenci motivasyonunu zirveye taşıyın."
              color="orange"
            />
          </div>
        </div>
      </div>

      {/* --- Visual Showcase Section --- */}
      <div className="py-24 bg-slate-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6 font-poppins leading-tight">
                Tüm Süreçleriniz İçin <br />
                <span className="text-[#2BB4A9]">Tek Bir Kontrol Paneli</span>
              </h2>
              <div className="space-y-6">
                {[
                  { title: "Öğrenci Yönetimi", text: "Ödevler, notlar ve iletişim tek ekranda." },
                  { title: "Soru Bankası", text: "Kendi sorularınızı ekleyin veya havuzu kullanın." },
                  { title: "Online Sınavlar", text: "Güvenli ve analizli sınav altyapısı." }
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center text-indigo-500 font-bold text-xl shrink-0">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-slate-900 mb-1">{item.title}</h4>
                      <p className="text-slate-600">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10">
                <button
                  onClick={() => onNavigateToAuth('register')}
                  className="bg-slate-900 text-white px-8 py-4 rounded-xl font-bold hover:bg-slate-800 transition-all hover:gap-4 flex items-center gap-2"
                >
                  Özellikleri Keşfet <span className="text-indigo-400">→</span>
                </button>
              </div>
            </div>

            <div className="relative">
              {/* Decorative background blob */}
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-200 to-purple-200 rounded-full blur-3xl opacity-60 transform rotate-12 scale-110"></div>

              <div className="relative grid grid-cols-2 gap-4">
                <img
                  src="/student-dashboard.png"
                  alt="Student View"
                  className="rounded-2xl shadow-2xl transform hover:-translate-y-2 transition-transform duration-500 border-4 border-white"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    const div = document.createElement('div');
                    div.className = 'bg-white h-64 rounded-2xl shadow-xl flex items-center justify-center border-4 border-white';
                    div.innerHTML = '<span class="text-4xl">👨‍🎓</span>';
                    target.parentNode?.appendChild(div);
                  }}
                />
                <img
                  src="/test-creation.png"
                  alt="Test Creation"
                  className="rounded-2xl shadow-2xl transform translate-y-12 hover:translate-y-10 transition-transform duration-500 border-4 border-white"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    const div = document.createElement('div');
                    div.className = 'bg-white h-64 rounded-2xl shadow-xl flex items-center justify-center border-4 border-white transform translate-y-12';
                    div.innerHTML = '<span class="text-4xl">📝</span>';
                    target.parentNode?.appendChild(div);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- Stats Section --- */}
      <div className="py-20 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#2BB4A9]/30 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#F05039]/30 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            <StatCard value="5,000+" label="Aktif Kullanıcı" />
            <StatCard value="500+" label="Eğitim Kurumu" />
            <StatCard value="1M+" label="Çözülen Soru" />
            <StatCard value="%94" label="Memnuniyet" />
          </div>
        </div>
      </div>

      {/* --- CTA Section --- */}
      <div className="py-32 bg-white text-center px-4 relative">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-[#2BB4A9] to-[#2563EB] rounded-[3rem] p-12 md:p-24 shadow-2xl relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>

          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 font-poppins">
              Eğitim Hayatınızı Değiştirmeye Hazır mısınız?
            </h2>
            <p className="text-indigo-100 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
              TedrisEDU ile tanışın, zaman kazanın ve başarınızı artırın.
              İlk 14 gün tamamen ücretsiz.
            </p>

            <button
              onClick={() => onNavigateToAuth('register')}
              className="bg-white text-[#2BB4A9] cursor-pointer px-10 py-5 rounded-full font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 transform"
            >
              Ücretsiz Başlayın
            </button>

            <p className="mt-6 text-indigo-200 text-sm">Kredi kartı gerekmez • İptal edilebilir</p>
          </div>
        </div>
      </div>

      {/* --- Footer --- */}
      <footer className="bg-slate-50 py-12 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3 opacity-50 grayscale hover:grayscale-0 transition-all">
            <TedrisLogo />
          </div>
          <div className="flex gap-8 text-slate-500 text-sm font-medium">
            <a href="#" className="hover:text-indigo-600 transition-colors">Hakkımızda</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Gizlilik</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Şartlar</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">İletişim</a>
          </div>
          <div className="text-slate-400 text-sm">
            © 2024 TedrisEDU. Tüm hakları saklıdır.
          </div>
        </div>
      </footer>

      <style>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
