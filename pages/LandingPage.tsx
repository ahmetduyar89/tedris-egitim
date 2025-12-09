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
    <text x="50" y="30" fontFamily="Poppins, sans-serif" fontSize="28" fontWeight="800" fill="#000000">TedrisEDU</text>
  </svg>
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
        {/* Animated Background Elements */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-primary/5 via-slate-50 to-slate-50"></div>
          <div className="absolute top-20 -right-20 w-96 h-96 bg-gradient-to-br from-accent/20 to-primary/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 -left-20 w-96 h-96 bg-gradient-to-tr from-secondary/20 to-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary/5 via-accent/5 to-secondary/5 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto">
          {/* Hero Content - Split Layout */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Content */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg border border-white/50 animate-fade-in-up">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-gray-700 font-semibold text-sm">Profesyonel Eğitim Yönetim Sistemi</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-poppins leading-tight tracking-tight">
                <span className="text-gray-900">Özel Derslerinizi</span>{' '}
                <span className="bg-gradient-to-r from-primary via-accent to-secondary text-transparent bg-clip-text inline-block animate-fade-in-up">
                  Profesyonelce
                </span>
                <br />
                <span className="text-gray-900">Yönetin</span>
              </h1>

              <p className="text-lg sm:text-xl text-gray-600 leading-relaxed max-w-xl">
                Öğrenci takibi, yapay zeka destekli analizler, otomatik ders programlama ve profesyonel raporlama. Özel ders veren öğretmenler ve eğitim koçları için hepsi bir arada çözüm.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={onNavigateToAuth}
                  className="group px-8 py-4 bg-gradient-to-r from-primary to-accent text-white font-bold rounded-xl shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <span>Hemen Başla</span>
                  <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
                </button>
                <button className="px-8 py-4 bg-white/80 backdrop-blur-sm text-gray-700 font-bold rounded-xl shadow-lg border border-gray-200 hover:bg-white hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2">
                  <span className="text-primary">▶</span>
                  <span>Demo İzle</span>
                </button>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4 pt-4">
                <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-md hover:shadow-lg transition-shadow">
                  <div className="text-2xl font-bold bg-gradient-to-r from-primary to-accent text-transparent bg-clip-text">5K+</div>
                  <div className="text-sm text-gray-600 font-medium">Kullanıcı</div>
                </div>
                <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-md hover:shadow-lg transition-shadow">
                  <div className="text-2xl font-bold bg-gradient-to-r from-accent to-secondary text-transparent bg-clip-text">50K+</div>
                  <div className="text-sm text-gray-600 font-medium">Test</div>
                </div>
                <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-md hover:shadow-lg transition-shadow">
                  <div className="text-2xl font-bold bg-gradient-to-r from-secondary to-primary text-transparent bg-clip-text">%92</div>
                  <div className="text-sm text-gray-600 font-medium">Başarı</div>
                </div>
              </div>
            </div>

            {/* Right: Visual */}
            <div className="relative lg:block hidden">
              {/* Main Dashboard Preview */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary via-accent to-secondary rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
                <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-white/50">
                  <img
                    src="/teacher-dashboard.png"
                    alt="TedrisEDU Platform"
                    className="w-full h-auto transform group-hover:scale-105 transition-transform duration-700"
                    onError={(e) => {
                      e.currentTarget.src = '/hero-dashboard.png';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent pointer-events-none"></div>
                </div>
              </div>

              {/* Floating Feature Badges */}
              <div className="absolute -left-8 top-16 bg-white rounded-xl shadow-xl p-3 border border-gray-100 animate-float" style={{ animationDelay: '0s' }}>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center text-white text-lg shadow-lg">
                    🚀
                  </div>
                  <div className="pr-2">
                    <div className="text-xs text-gray-500 font-medium">Hız</div>
                    <div className="text-sm font-bold text-gray-900">%300</div>
                  </div>
                </div>
              </div>

              <div className="absolute -right-8 top-1/3 bg-white rounded-xl shadow-xl p-3 border border-gray-100 animate-float" style={{ animationDelay: '0.5s' }}>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center text-white text-lg shadow-lg">
                    🤖
                  </div>
                  <div className="pr-2">
                    <div className="text-xs text-gray-500 font-medium">AI Analiz</div>
                    <div className="text-sm font-bold text-gray-900">Aktif</div>
                  </div>
                </div>
              </div>

              <div className="absolute -left-6 bottom-16 bg-white rounded-xl shadow-xl p-3 border border-gray-100 animate-float" style={{ animationDelay: '1s' }}>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center text-white text-lg shadow-lg">
                    📊
                  </div>
                  <div className="pr-2">
                    <div className="text-xs text-gray-500 font-medium">Raporlama</div>
                    <div className="text-sm font-bold text-gray-900">Detaylı</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Preview */}
          <div className="lg:hidden mt-12">
            <div className="relative group max-w-md mx-auto">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary via-accent to-secondary rounded-2xl blur-xl opacity-30"></div>
              <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-white/50">
                <img
                  src="/teacher-dashboard.png"
                  alt="TedrisEDU Platform"
                  className="w-full h-auto"
                  onError={(e) => {
                    e.currentTarget.src = '/hero-dashboard.png';
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Add custom animations */}
        <style>{`
          @keyframes fade-in-up {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes float {
            0%, 100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-10px);
            }
          }
          
          .animate-fade-in-up {
            animation: fade-in-up 0.6s ease-out;
          }
          
          .animate-float {
            animation: float 3s ease-in-out infinite;
          }
        `}</style>
      </main>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-primary via-accent to-secondary relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }}></div>

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            <div className="text-center p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/30 shadow-xl hover:bg-white/20 hover:scale-105 transition-all duration-300">
              <div className="text-4xl md:text-5xl font-bold font-poppins text-white mb-2">
                5K+
              </div>
              <div className="text-white/90 font-semibold text-sm md:text-base">Aktif Kullanıcı</div>
            </div>

            <div className="text-center p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/30 shadow-xl hover:bg-white/20 hover:scale-105 transition-all duration-300">
              <div className="text-4xl md:text-5xl font-bold font-poppins text-white mb-2">
                250+
              </div>
              <div className="text-white/90 font-semibold text-sm md:text-base">Öğretmen</div>
            </div>

            <div className="text-center p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/30 shadow-xl hover:bg-white/20 hover:scale-105 transition-all duration-300">
              <div className="text-4xl md:text-5xl font-bold font-poppins text-white mb-2">
                50K+
              </div>
              <div className="text-white/90 font-semibold text-sm md:text-base">Oluşturulan Test</div>
            </div>

            <div className="text-center p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/30 shadow-xl hover:bg-white/20 hover:scale-105 transition-all duration-300">
              <div className="text-4xl md:text-5xl font-bold font-poppins text-white mb-2">
                %92
              </div>
              <div className="text-white/90 font-semibold text-sm md:text-base">Başarı Artışı</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-4 bg-gradient-to-b from-white via-slate-50 to-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-primary/5 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-accent/5 to-transparent rounded-full blur-3xl"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 bg-gradient-to-r from-primary/10 to-accent/10 rounded-full mb-4">
              <span className="text-primary font-bold text-sm">✨ Profesyonel Özellikler</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold font-poppins text-gray-900 mb-4">
              Neden <span className="bg-gradient-to-r from-primary via-accent to-secondary text-transparent bg-clip-text">TedrisEDU</span>?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Özel ders yönetiminde ihtiyacınız olan her şey, tek bir profesyonel panelde.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="group bg-gradient-to-br from-white to-primary/5 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-primary/10 hover:border-primary/30 hover:-translate-y-2">
              <div className="flex justify-center items-center h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-accent mx-auto mb-6 text-3xl shadow-lg shadow-primary/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                🧠
              </div>
              <h3 className="text-xl font-bold font-poppins mb-3 text-gray-900 text-center">Yapay Zeka Destekli</h3>
              <p className="text-gray-600 leading-relaxed text-center text-sm">
                Google Gemini teknolojisi ile kişiselleştirilmiş içerik ve analizler.
              </p>
            </div>

            <div className="group bg-gradient-to-br from-white to-accent/5 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-accent/10 hover:border-accent/30 hover:-translate-y-2">
              <div className="flex justify-center items-center h-16 w-16 rounded-2xl bg-gradient-to-br from-accent to-secondary mx-auto mb-6 text-3xl shadow-lg shadow-accent/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                📊
              </div>
              <h3 className="text-xl font-bold font-poppins mb-3 text-gray-900 text-center">Detaylı Analitik</h3>
              <p className="text-gray-600 leading-relaxed text-center text-sm">
                Öğrenci performansını derinlemesine analiz edin ve raporlayın.
              </p>
            </div>

            <div className="group bg-gradient-to-br from-white to-secondary/5 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-secondary/10 hover:border-secondary/30 hover:-translate-y-2">
              <div className="flex justify-center items-center h-16 w-16 rounded-2xl bg-gradient-to-br from-secondary to-primary mx-auto mb-6 text-3xl shadow-lg shadow-secondary/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                📅
              </div>
              <h3 className="text-xl font-bold font-poppins mb-3 text-gray-900 text-center">Akıllı Planlama</h3>
              <p className="text-gray-600 leading-relaxed text-center text-sm">
                Otomatik ders ve çalışma programı oluşturun.
              </p>
            </div>

            <div className="group bg-gradient-to-br from-white to-primary/5 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-primary/10 hover:border-primary/30 hover:-translate-y-2">
              <div className="flex justify-center items-center h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 mx-auto mb-6 text-3xl shadow-lg shadow-blue-400/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                📚
              </div>
              <h3 className="text-xl font-bold font-poppins mb-3 text-gray-900 text-center">Zengin Kütüphane</h3>
              <p className="text-gray-600 leading-relaxed text-center text-sm">
                Binlerce hazır soru ve içerik elinizin altında.
              </p>
            </div>

            <div className="group bg-gradient-to-br from-white to-accent/5 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-accent/10 hover:border-accent/30 hover:-translate-y-2">
              <div className="flex justify-center items-center h-16 w-16 rounded-2xl bg-gradient-to-br from-green-400 to-green-600 mx-auto mb-6 text-3xl shadow-lg shadow-green-400/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                💬
              </div>
              <h3 className="text-xl font-bold font-poppins mb-3 text-gray-900 text-center">7/24 Asistan</h3>
              <p className="text-gray-600 leading-relaxed text-center text-sm">
                Öğrenciler için her an ulaşılabilir yapay zeka asistanı.
              </p>
            </div>

            <div className="group bg-gradient-to-br from-white to-secondary/5 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-secondary/10 hover:border-secondary/30 hover:-translate-y-2">
              <div className="flex justify-center items-center h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-400 to-purple-600 mx-auto mb-6 text-3xl shadow-lg shadow-purple-400/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                🎮
              </div>
              <h3 className="text-xl font-bold font-poppins mb-3 text-gray-900 text-center">Oyunlaştırma</h3>
              <p className="text-gray-600 leading-relaxed text-center text-sm">
                Rozetler ve puanlarla öğrenmeyi eğlenceli hale getirin.
              </p>
            </div>
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
                  title="Öğrenci Yönetimi"
                  description="Tüm öğrencilerinizi tek ekrandan takip edin, performanslarını analiz edin."
                  imageSrc="/teacher-dashboard.png"
                />
                <ScreenshotCard
                  title="AI Destekli Test Oluşturma"
                  description="Yapay zeka ile saniyeler içinde müfredata uygun testler hazırlayın."
                  imageSrc="/test-creation.png"
                />
                <ScreenshotCard
                  title="Detaylı Raporlama"
                  description="Öğrenci gelişimini grafikler ve analizlerle takip edin."
                  imageSrc="/learning-map.png"
                />
              </>
            ) : (
              <>
                <ScreenshotCard
                  title="Kişisel Öğrenme Paneli"
                  description="Dersleriniz, ödevleriniz ve ilerlemeniz tek bir yerde."
                  imageSrc="/student-dashboard.png"
                />
                <ScreenshotCard
                  title="7/24 AI Asistan"
                  description="Anlamadığınız konuları yapay zeka asistanınıza sorun."
                  imageSrc="/ai-assistant.png"
                />
                <ScreenshotCard
                  title="Öğrenme Haritası"
                  description="Hangi konularda güçlü olduğunuzu görsel olarak takip edin."
                  imageSrc="/learning-map.png"
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
            Hemen ücretsiz hesabınızı oluşturun ve TedrisEDU'nun ayrıcalıklı dünyasına katılın.
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
            <span className="text-2xl font-bold text-white">TedrisEDU</span>
            <span className="text-sm bg-slate-800 px-2 py-1 rounded">v2.0</span>
          </div>
          <div className="flex gap-8 text-sm">
            <a href="#" className="hover:text-white transition-colors">Hakkımızda</a>
            <a href="#" className="hover:text-white transition-colors">Özellikler</a>
            <a href="#" className="hover:text-white transition-colors">Fiyatlandırma</a>
            <a href="#" className="hover:text-white transition-colors">İletişim</a>
          </div>
          <div className="text-sm">
            &copy; 2024 TedrisEDU. Tüm hakları saklıdır.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
