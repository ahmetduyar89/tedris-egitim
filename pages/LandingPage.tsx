import React, { useState, useEffect } from 'react';

interface LandingPageProps {
  onNavigateToAuth: (mode?: 'login' | 'register') => void;
}

// --- Components ---

const TedrisLogo = ({ light = false }) => (
  <div className="flex items-center gap-2">
    <img src="/logo-full.png" alt="TedrisEDU" className="h-8 md:h-10 w-auto" style={{ filter: light ? 'brightness(0) invert(1)' : 'none' }} />
  </div>
);

const BentoCard = ({
  title,
  description,
  icon,
  className = "",
  visual
}: {
  title: string,
  description: string,
  icon?: string,
  className?: string,
  visual?: React.ReactNode
}) => (
  <div className={`group relative overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 ${className}`}>
    <div className="relative z-10 p-6 md:p-8 flex flex-col h-full">
      {icon && (
        <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
      )}
      <h3 className="text-xl font-bold text-slate-900 mb-2 font-poppins">{title}</h3>
      <p className="text-slate-500 text-sm leading-relaxed mb-6">
        {description}
      </p>
      {visual && (
        <div className="mt-auto pt-4 flex justify-center items-center">
          {visual}
        </div>
      )}
    </div>
    {/* Hover Gradient */}
    <div className="absolute inset-0 bg-gradient-to-tr from-indigo-50/0 via-indigo-50/0 to-indigo-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
  </div>
);

const PersonaCard = ({ icon, title, features, color }: { icon: string, title: string, features: string[], color: string }) => (
  <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
    <div className={`w-14 h-14 rounded-2xl bg-${color}-50 flex items-center justify-center text-3xl mb-4`}>
      {icon}
    </div>
    <h3 className="text-lg font-bold text-slate-900 mb-4">{title}</h3>
    <ul className="space-y-3">
      {features.map((feature, idx) => (
        <li key={idx} className="flex items-start gap-3 text-sm text-slate-600">
          <svg className={`w-5 h-5 text-${color}-500 shrink-0`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {feature}
        </li>
      ))}
    </ul>
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
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-3 border-b border-slate-200/50' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <TedrisLogo light={false} />

          <div className="hidden md:flex gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-indigo-600 transition-colors">Özellikler</a>
            <a href="#solutions" className="hover:text-indigo-600 transition-colors">Çözümler</a>
            <a href="#pricing" className="hover:text-indigo-600 transition-colors">Fiyatlandırma</a>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => onNavigateToAuth('login')}
              className="px-5 py-2.5 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-full hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm active:scale-95"
            >
              Giriş
            </button>
            <button
              onClick={() => onNavigateToAuth('register')}
              className="hidden sm:inline-flex bg-slate-900 text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-slate-800 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
            >
              Ücretsiz Deneyin
            </button>
          </div>
        </div>
      </nav>

      {/* --- Hero Section --- */}
      <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Modern Abstract Mesh Gradient */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 bg-slate-50">
          <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full bg-indigo-200/20 blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-200/20 blur-[100px]" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wide mb-8 animate-fade-in-up">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
            Eğitimin Yeni İşletim Sistemi
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-8 font-poppins max-w-5xl mx-auto">
            Öğrenci Başarısını <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600 animate-gradient-x">Veri ve Yapay Zeka ile Artırın</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-500 mb-10 max-w-3xl mx-auto leading-relaxed">
            Öğrenme haritaları, yapay zeka destekli eksik giderme ve aralıklı tekrar sistemi ile öğrencilerinizi potansiyellerinin zirvesine taşıyın.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16 px-4 sm:px-0">
            <button
              onClick={() => onNavigateToAuth('register')}
              className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-500/20 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2"
            >
              Hemen Başlayın
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              onClick={() => onNavigateToAuth('login')}
              className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-2xl font-bold text-lg hover:bg-slate-50 hover:border-slate-300 transition-all duration-300"
            >
              Canlı Demo
            </button>
          </div>

          {/* New Hero Visual - Dashboard Abstract */}
          <div className="relative max-w-6xl mx-auto mt-12 perspective-2000">
            <div className="relative bg-white rounded-2xl p-2 shadow-2xl border border-slate-200 overflow-hidden transform rotate-x-6 hover:rotate-x-0 transition-transform duration-1000 group">
              {/* Click overlay */}
              <div className="absolute top-0 left-0 w-full h-full bg-slate-900/10 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              </div>

              <img src="/showcase-hero.png" alt="Knowledge Graph Dashboard" className="w-full rounded-xl shadow-inner border border-slate-100" />
            </div>

            {/* Floating Elements for Context */}
            <div className="absolute -right-8 top-20 bg-white/90 backdrop-blur shadow-xl p-4 rounded-xl border border-slate-200 hidden lg:block animate-bounce" style={{ animationDuration: '4s' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-xl">🚀</div>
                <div>
                  <div className="text-xs text-slate-500 font-bold uppercase">Gelişim Hızı</div>
                  <div className="text-sm font-bold text-slate-900">%47 Artış <span className="text-green-500 text-xs">bu hafta</span></div>
                </div>
              </div>
            </div>

            <div className="absolute -left-8 bottom-40 bg-white/90 backdrop-blur shadow-xl p-4 rounded-xl border border-slate-200 hidden lg:block animate-bounce" style={{ animationDuration: '5s' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-xl">🧠</div>
                <div>
                  <div className="text-xs text-slate-500 font-bold uppercase">AI Analizi</div>
                  <div className="text-sm font-bold text-slate-900">3 Eksik Konu Belirlendi</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- Features Bento Grid --- */}
      <div id="features" className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4 font-poppins">Eğitimde Teknoloji Devrimi</h2>
            <p className="text-lg text-slate-600">Sadece bir yönetim paneli değil, öğrencinizin en yakın çalışma arkadaşı.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Col 1 */}
            <div className="lg:col-span-2 space-y-8">
              {/* Feature 1: Spaced Repetition */}
              <div className="group relative overflow-hidden rounded-3xl bg-indigo-600 text-white shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
                <div className="absolute top-0 right-0 p-12 opacity-10">
                  <svg className="w-64 h-64" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z" /></svg>
                </div>
                <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row items-center gap-8">
                  <div className="flex-1">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl mb-6">🧠</div>
                    <h3 className="text-2xl font-bold mb-3">Aralıklı Tekrar Sistemi (SRS)</h3>
                    <p className="text-indigo-100 leading-relaxed mb-6">
                      Bilimsel olarak kanıtlanmış algoritma ile öğrencilerin unutmaya başladığı anı tespit eder ve konuları tam zamanında tekrar ettirir.
                    </p>
                    <ul className="space-y-2 mb-6">
                      <li className="flex items-center gap-2 text-sm text-indigo-100"><span className="bg-white/20 p-1 rounded-full text-xs">✓</span> Günlük mini quizler</li>
                      <li className="flex items-center gap-2 text-sm text-indigo-100"><span className="bg-white/20 p-1 rounded-full text-xs">✓</span> Ustalık seviyesi takibi</li>
                    </ul>
                  </div>
                  <div className="w-full md:w-1/2">
                    <img src="/showcase-srs.png" alt="Aralıklı Tekrar Sistemi" className="rounded-xl shadow-lg border border-white/10 transform group-hover:scale-105 transition-transform duration-500" />
                  </div>
                </div>
              </div>

              {/* Feature 2: Performance Analysis */}
              <div className="group relative overflow-hidden rounded-3xl bg-slate-50 border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
                <div className="p-8 md:p-10">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-2xl mb-4">📊</div>
                      <h3 className="text-xl font-bold text-slate-900">360° Performans Takibi</h3>
                    </div>
                    <button className="text-indigo-600 font-semibold text-sm hover:underline">Raporu İncele →</button>
                  </div>
                  <p className="text-slate-600 mb-8 max-w-lg">
                    Test sonuçları, ödev tamamlama oranları ve konu bazlı eksiklik analizi ile öğrencinin durumununtam fotoğrafını çekin.
                  </p>
                  <img src="/showcase-performance.png" alt="Performans Analizi" className="w-full rounded-xl shadow-md border border-slate-200" />
                </div>
              </div>
            </div>

            {/* Col 2 */}
            <div className="space-y-8">
              {/* Feature 3: Planning */}
              <div className="group relative overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 h-full flex flex-col">
                <div className="p-8 flex-1">
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center text-2xl mb-4">📅</div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Akıllı Planlama</h3>
                  <p className="text-slate-600 text-sm mb-6">
                    Yapay zeka, öğrencinin zayıf olduğu konuları tespit eder ve haftalık programa otomatik olarak ekler.
                  </p>
                  <div className="rounded-xl overflow-hidden shadow-inner border border-slate-100 bg-slate-50 p-2">
                    <img src="/showcase-planning.png" alt="Akıllı Planlama" className="w-full rounded-lg shadow-sm" />
                  </div>
                </div>
              </div>

              {/* Feature 4: Online Classes/General */}
              <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-50 to-white border border-blue-100 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
                <div className="p-8">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center text-2xl mb-4">🎥</div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Canlı Ders Yönetimi</h3>
                  <p className="text-slate-600 text-sm mb-4">
                    Online derslerinizi planlayın, linkleri paylaşın ve yoklama alın.
                  </p>
                  <img src="/showcase-classes.png" alt="Online Dersler" className="w-full rounded-lg shadow-md mt-2" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- Audience Segmentation (Who is it for?) --- */}
      <div id="solutions" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4 font-poppins">Kimler İçin Uygundur?</h2>
            <p className="text-slate-600">Farklı ihtiyaçlara özelleştirilmiş modüller.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <PersonaCard
              icon="🎓"
              title="Bağımsız Eğitmenler"
              color="indigo"
              features={[
                "Excel tablolarından kurtulun",
                "Veli iletişimini otomatize edin",
                "Ders programını cebinizden yönetin",
                "Markanızı kurumsallaştırın"
              ]}
            />
            <PersonaCard
              icon="🏛️"
              title="Butik Kurs & Etüt Merkezleri"
              color="purple"
              features={[
                "Tüm öğretmenleri tek panelden yönetin",
                "Sınıf ve şube bazlı analizler",
                "Kurumsal gelir/gider takibi",
                "Öğretmen maaş hesaplamaları"
              ]}
            />
            <PersonaCard
              icon="🚀"
              title="Eğitim Koçları"
              color="blue"
              features={[
                "Öğrenci hedeflerini yakından izleyin",
                "Haftalık çalışma planları oluşturun",
                "Gelişim raporlarını görselleştirin",
                "Motivasyon araçları (Gamification)"
              ]}
            />
          </div>
        </div>
      </div>


      {/* --- CTA Section --- */}
      <div className="py-32 bg-white text-center px-4 relative overflow-hidden">
        <div className="max-w-5xl mx-auto relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold text-slate-900 mb-8 font-poppins tracking-tight">
            Eğitim İşinizi Büyütmeye <br />Hazır mısınız?
          </h2>
          <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto">
            14 gün boyunca tüm özellikleri ücretsiz deneyin. <br />Kredi kartı gerekmez. İptal etmesi kolay.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => onNavigateToAuth('register')}
              className="px-10 py-5 bg-indigo-600 text-white rounded-full font-bold text-lg shadow-xl shadow-indigo-500/30 hover:bg-indigo-700 hover:scale-105 transition-all duration-300"
            >
              Ücretsiz Hesabınızı Oluşturun
            </button>
            <button
              className="px-10 py-5 bg-white text-slate-700 border border-slate-200 rounded-full font-bold text-lg hover:bg-slate-50 transition-all duration-300"
            >
              Satış Ekibiyle Görüşün
            </button>
          </div>
        </div>
      </div>

      {/* --- Footer --- */}
      <footer className="bg-slate-900 text-slate-300 py-16 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-1">
            <TedrisLogo light={true} />
            <p className="mt-6 text-sm text-slate-500">
              Eğitimciler için geliştirilmiş, yapay zeka destekli yönetim platformu.
            </p>
            <div className="mt-6 flex gap-4">
              {/* Social Icons Placeholder */}
              <div className="w-8 h-8 rounded-full bg-slate-800 hover:bg-indigo-600 transition-colors cursor-pointer"></div>
              <div className="w-8 h-8 rounded-full bg-slate-800 hover:bg-indigo-600 transition-colors cursor-pointer"></div>
              <div className="w-8 h-8 rounded-full bg-slate-800 hover:bg-indigo-600 transition-colors cursor-pointer"></div>
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Ürün</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Özellikler</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Fiyatlandırma</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Güncellemeler</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Yol Haritası</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Kurumsal</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Hakkımızda</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Kariyer</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-white transition-colors">İletişim</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Yasal</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Gizlilik Politikası</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Kullanım Şartları</a></li>
              <li><a href="#" className="hover:text-white transition-colors">KVKK</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 mt-16 pt-8 border-t border-slate-800 text-center text-xs text-slate-600">
          © 2024 TedrisEDU Teknoloji A.Ş. Tüm hakları saklıdır.
        </div>
      </footer>

      <style>{`
        .perspective-2000 {
          perspective: 2000px;
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }
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
