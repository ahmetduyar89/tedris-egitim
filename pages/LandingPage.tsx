import React, { useState } from 'react';

interface LandingPageProps {
  onNavigateToAuth: () => void;
}

const TedrisLogo = () => (
  <svg width="160" height="40" viewBox="0 0 160 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g style={{ mixBlendMode: 'multiply' }}>
      <circle cx="15" cy="24" r="12" fill="#F05039" />
      <circle cx="33" cy="24" r="12" fill="#F5C542" />
      <circle cx="24" cy="12" r="12" fill="#2BB4A9" />
    </g>
    <text x="50" y="30" fontFamily="Poppins, sans-serif" fontSize="28" fontWeight="800" fill="#000000">TEDRİS</text>
  </svg>
);

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string; delay?: string }> = ({ icon, title, description, delay = '0s' }) => (
  <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 hover:-translate-y-1 group">
    <div className="flex justify-center items-center h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 mx-auto mb-6 text-3xl group-hover:scale-110 transition-transform duration-300">
      {icon}
    </div>
    <h3 className="text-xl font-bold font-poppins mb-3 text-gray-900 text-center">{title}</h3>
    <p className="text-gray-600 leading-relaxed text-center text-sm">{description}</p>
  </div>
);

const ScreenshotCard: React.FC<{ title: string; description: string; imageSrc: string }> = ({ title, description, imageSrc }) => (
  <div className="group relative bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl border border-gray-100 hover:-translate-y-1">
    <div className="aspect-video bg-gray-100 relative overflow-hidden">
      <img
        src={imageSrc}
        alt={title}
        className="w-full h-full object-cover object-top transform transition-transform duration-700 group-hover:scale-105"
        onError={(e) => {
          // Fallback if image fails to load
          e.currentTarget.src = '/hero-dashboard.png';
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6">
        <span className="text-white font-medium px-4 py-2 bg-white/20 backdrop-blur-md rounded-full border border-white/30">
          Önizle
        </span>
      </div>
    </div>
    <div className="p-6">
      <h3 className="text-xl font-bold font-poppins mb-2 text-gray-900">{title}</h3>
      <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
    </div>
  </div>
);

const StatCard: React.FC<{ value: string; label: string }> = ({ value, label }) => (
  <div className="text-center p-6 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/50 shadow-sm hover:shadow-md transition-all">
    <div className="text-4xl md:text-5xl font-bold font-poppins bg-gradient-to-r from-primary via-accent to-secondary text-transparent bg-clip-text mb-2">
      {value}
    </div>
    <div className="text-gray-600 font-medium">{label}</div>
  </div>
);

const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToAuth }) => {
  const [activeTab, setActiveTab] = useState<'teacher' | 'student'>('teacher');

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-gray-900 selection:bg-primary/20">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-gray-100 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex justify-between items-center">
          <TedrisLogo />
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={onNavigateToAuth}
              className="text-sm sm:text-base text-gray-600 hover:text-primary font-medium transition-colors"
            >
              Giriş Yap
            </button>
            <button
              onClick={onNavigateToAuth}
              className="bg-primary hover:bg-primary-dark text-white font-semibold px-4 py-2 sm:px-6 sm:py-2.5 rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-300 transform hover:-translate-y-0.5 text-sm sm:text-base"
            >
              <span className="sm:hidden">Başla</span>
              <span className="hidden sm:inline">Öğretmen Başvurusu</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="pt-32 pb-20 px-4 relative overflow-hidden">
        {/* Background Elements - Optimized for performance */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full min-h-[800px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-slate-50 to-slate-50 -z-10"></div>
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-3xl -z-10"></div>

        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-100 mb-8 animate-fade-in-up">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-gray-600 font-medium text-sm">Yapay Zeka Destekli Eğitim Platformu</span>
            </div>

            <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold font-poppins leading-tight mb-6 tracking-tight text-gray-900">
              Eğitimin Geleceği <br />
              <span className="bg-gradient-to-r from-primary via-accent to-secondary text-transparent bg-clip-text">
                Bugünden Hazır
              </span>
            </h1>

            <p className="text-xl text-gray-600 mb-10 leading-relaxed max-w-2xl mx-auto">
              Öğretmenler için zaman kazandıran araçlar, öğrenciler için kişiselleştirilmiş öğrenme deneyimi.
              Hepsi tek bir platformda.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={onNavigateToAuth}
                className="w-full sm:w-auto px-8 py-4 bg-primary text-white font-bold rounded-xl shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-1 transition-all duration-300"
              >
                Hemen Başlayın
              </button>
              <button className="w-full sm:w-auto px-8 py-4 bg-white text-gray-700 font-bold rounded-xl shadow-lg border border-gray-100 hover:bg-gray-50 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2">
                <span>▶</span> Demo İzle
              </button>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative max-w-6xl mx-auto mt-12">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white bg-white">
              <img
                src="/hero-dashboard.png"
                alt="TEDRİS Platform Dashboard"
                className="w-full h-auto"
              />
              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-50/20 to-transparent pointer-events-none"></div>
            </div>

            {/* Floating Stats - Static for better performance */}
            <div className="absolute -left-4 top-1/4 bg-white p-4 rounded-xl shadow-xl border border-gray-100 hidden lg:block transform -rotate-3 hover:rotate-0 transition-transform duration-300 z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">🚀</div>
                <div>
                  <div className="text-sm text-gray-500">Verimlilik Artışı</div>
                  <div className="text-lg font-bold text-gray-900">%85</div>
                </div>
              </div>
            </div>

            <div className="absolute -right-4 bottom-1/4 bg-white p-4 rounded-xl shadow-xl border border-gray-100 hidden lg:block transform rotate-3 hover:rotate-0 transition-transform duration-300">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">🤖</div>
                <div>
                  <div className="text-sm text-gray-500">AI Analiz</div>
                  <div className="text-lg font-bold text-gray-900">Aktif</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Stats Section */}
      <section className="py-12 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatCard value="10k+" label="Aktif Öğrenci" />
            <StatCard value="500+" label="Okul & Kurum" />
            <StatCard value="1M+" label="Çözülen Soru" />
            <StatCard value="%98" label="Memnuniyet" />
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-4 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold font-poppins text-gray-900 mb-4">
              Neden Tedris?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Modern eğitim ihtiyaçları için tasarlanmış kapsamlı özellikler
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon="🧠"
              title="Yapay Zeka Destekli"
              description="Google Gemini teknolojisi ile kişiselleştirilmiş içerik ve analizler."
            />
            <FeatureCard
              icon="📊"
              title="Detaylı Analitik"
              description="Öğrenci performansını derinlemesine analiz edin ve raporlayın."
            />
            <FeatureCard
              icon="📅"
              title="Akıllı Planlama"
              description="Otomatik ders ve çalışma programı oluşturun."
            />
            <FeatureCard
              icon="📚"
              title="Zengin Kütüphane"
              description="Binlerce hazır soru ve içerik elinizin altında."
            />
            <FeatureCard
              icon="💬"
              title="7/24 Asistan"
              description="Öğrenciler için her an ulaşılabilir yapay zeka asistanı."
            />
            <FeatureCard
              icon="🎮"
              title="Oyunlaştırma"
              description="Rozetler ve puanlarla öğrenmeyi eğlenceli hale getirin."
            />
          </div>
        </div>
      </section>

      {/* Screenshots Section */}
      <section className="py-24 px-4 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold font-poppins text-gray-900 mb-4">Platformu Keşfedin</h2>
            <p className="text-xl text-gray-600">Öğretmen ve öğrenciler için özel arayüzler</p>
          </div>

          <div className="flex justify-center mb-12">
            <div className="bg-slate-100 p-1.5 rounded-xl inline-flex">
              <button
                onClick={() => setActiveTab('teacher')}
                className={`px-8 py-3 rounded-lg font-semibold transition-all duration-200 ${activeTab === 'teacher'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                Öğretmen Paneli
              </button>
              <button
                onClick={() => setActiveTab('student')}
                className={`px-8 py-3 rounded-lg font-semibold transition-all duration-200 ${activeTab === 'student'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                Öğrenci Paneli
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {activeTab === 'teacher' ? (
              <>
                <ScreenshotCard
                  title="Test Oluşturucu"
                  description="Saniyeler içinde müfredata uygun testler hazırlayın."
                  imageSrc="/hero-dashboard.png"
                />
                <ScreenshotCard
                  title="Sınıf Yönetimi"
                  description="Tüm öğrencilerinizi tek ekrandan yönetin."
                  imageSrc="/hero-dashboard.png"
                />
                <ScreenshotCard
                  title="Raporlama"
                  description="Detaylı gelişim raporları alın."
                  imageSrc="/hero-dashboard.png"
                />
              </>
            ) : (
              <>
                <ScreenshotCard
                  title="Öğrenci Paneli"
                  description="Dersler ve ödevler tek bir yerde."
                  imageSrc="/hero-dashboard.png"
                />
                <ScreenshotCard
                  title="AI Asistan"
                  description="Anlamadığınız konuları anında sorun."
                  imageSrc="/hero-dashboard.png"
                />
                <ScreenshotCard
                  title="İlerleme Takibi"
                  description="Gelişiminizi grafiklerle izleyin."
                  imageSrc="/hero-dashboard.png"
                />
              </>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 bg-gradient-to-br from-primary to-accent text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold font-poppins mb-6">
            Eğitimde Dönüşümü Başlatın
          </h2>
          <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
            Hemen ücretsiz hesabınızı oluşturun ve Tedris'in ayrıcalıklı dünyasına katılın.
          </p>
          <button
            onClick={onNavigateToAuth}
            className="px-10 py-4 bg-white text-primary font-bold rounded-xl shadow-xl hover:shadow-2xl hover:bg-gray-50 transform hover:-translate-y-1 transition-all duration-300 text-lg"
          >
            Ücretsiz Kayıt Olun
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-4 border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-white">TEDRİS</span>
            <span className="text-sm bg-slate-800 px-2 py-1 rounded">v2.0</span>
          </div>
          <div className="flex gap-8 text-sm">
            <a href="#" className="hover:text-white transition-colors">Hakkımızda</a>
            <a href="#" className="hover:text-white transition-colors">Özellikler</a>
            <a href="#" className="hover:text-white transition-colors">Fiyatlandırma</a>
            <a href="#" className="hover:text-white transition-colors">İletişim</a>
          </div>
          <div className="text-sm">
            &copy; 2024 Tedris. Tüm hakları saklıdır.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
