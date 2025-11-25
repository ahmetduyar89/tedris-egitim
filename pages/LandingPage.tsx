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

const TedrisLogoWhite = () => (
  <svg width="160" height="40" viewBox="0 0 160 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g>
      <circle cx="15" cy="24" r="12" fill="white" opacity="0.9" />
      <circle cx="33" cy="24" r="12" fill="white" opacity="0.9" />
      <circle cx="24" cy="12" r="12" fill="white" opacity="0.9" />
    </g>
    <text x="50" y="30" fontFamily="Poppins, sans-serif" fontSize="28" fontWeight="800" fill="white">TEDRİS</text>
  </svg>
);

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string; delay?: string }> = ({ icon, title, description, delay = '0s' }) => (
  <div className="bg-white p-8 rounded-2xl shadow-lg text-center transform transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl animate-fade-in-up border border-gray-100" style={{ animationDelay: delay }}>
    <div className="flex justify-center items-center h-20 w-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 mx-auto mb-5 text-4xl">
      {icon}
    </div>
    <h3 className="text-xl font-bold font-poppins mb-3 text-text-primary">{title}</h3>
    <p className="text-text-secondary leading-relaxed">{description}</p>
  </div>
);

const ScreenshotCard: React.FC<{ title: string; description: string; screenshot: React.ReactNode }> = ({ title, description, screenshot }) => (
  <div className="group relative bg-white rounded-2xl shadow-lg overflow-hidden transform transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl border border-gray-100">
    <div className="h-64 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden">
      <div className="w-full h-full transition-transform duration-300 group-hover:scale-105">
        {screenshot}
      </div>
    </div>
    <div className="p-6">
      <h3 className="text-xl font-bold font-poppins mb-2 text-text-primary">{title}</h3>
      <p className="text-text-secondary">{description}</p>
    </div>
  </div>
);

const TeacherDashboardPreview = () => (
  <div className="w-full h-full bg-white p-4 flex flex-col">
    <div className="flex items-center gap-2 mb-3">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent"></div>
      <div className="flex-1">
        <div className="h-2 bg-gray-200 rounded w-24 mb-1"></div>
        <div className="h-1.5 bg-gray-100 rounded w-16"></div>
      </div>
    </div>
    <div className="grid grid-cols-3 gap-2 mb-3">
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-2">
        <div className="text-xs font-bold text-blue-600">12</div>
        <div className="h-1 bg-blue-200 rounded mt-1 w-3/4"></div>
      </div>
      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-2">
        <div className="text-xs font-bold text-green-600">8</div>
        <div className="h-1 bg-green-200 rounded mt-1 w-2/3"></div>
      </div>
      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-2">
        <div className="text-xs font-bold text-purple-600">95%</div>
        <div className="h-1 bg-purple-200 rounded mt-1 w-4/5"></div>
      </div>
    </div>
    <div className="space-y-2">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-gray-50 rounded-lg p-2 flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-accent to-secondary"></div>
          <div className="flex-1">
            <div className="h-1.5 bg-gray-200 rounded w-full mb-1"></div>
            <div className="h-1 bg-gray-100 rounded w-3/4"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const TestCreatorPreview = () => (
  <div className="w-full h-full bg-white p-4 flex flex-col">
    <div className="flex items-center justify-between mb-3">
      <div className="h-2 bg-primary rounded w-1/3"></div>
      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-accent to-green-500"></div>
    </div>
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-3 mb-3">
      <div className="flex items-center gap-2 mb-2">
        <div className="text-2xl">🤖</div>
        <div className="h-2 bg-purple-200 rounded w-2/3"></div>
      </div>
      <div className="space-y-1">
        <div className="h-1.5 bg-purple-100 rounded w-full"></div>
        <div className="h-1.5 bg-purple-100 rounded w-5/6"></div>
        <div className="h-1.5 bg-purple-100 rounded w-4/6"></div>
      </div>
    </div>
    <div className="space-y-2">
      {[1, 2].map(i => (
        <div key={i} className="bg-gray-50 rounded p-2">
          <div className="flex items-start gap-2">
            <div className="w-4 h-4 rounded border-2 border-gray-300 mt-0.5"></div>
            <div className="flex-1 space-y-1">
              <div className="h-1.5 bg-gray-200 rounded w-full"></div>
              <div className="h-1.5 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const AnalysisPreview = () => (
  <div className="w-full h-full bg-white p-4 flex flex-col">
    <div className="mb-3">
      <div className="h-2 bg-gradient-to-r from-primary to-accent rounded w-1/2 mb-2"></div>
      <div className="h-1.5 bg-gray-200 rounded w-1/3"></div>
    </div>
    <div className="flex-1 flex items-end justify-between gap-1 mb-3">
      {[60, 85, 45, 90, 70, 55].map((h, i) => (
        <div key={i} className="flex-1 flex flex-col items-center">
          <div
            className="w-full bg-gradient-to-t from-primary to-accent rounded-t"
            style={{ height: `${h}%` }}
          ></div>
          <div className="h-1 bg-gray-200 rounded w-full mt-1"></div>
        </div>
      ))}
    </div>
    <div className="grid grid-cols-2 gap-2">
      <div className="bg-green-50 rounded p-2">
        <div className="text-xs font-bold text-green-600 mb-1">Güçlü</div>
        <div className="h-1 bg-green-200 rounded w-4/5"></div>
      </div>
      <div className="bg-red-50 rounded p-2">
        <div className="text-xs font-bold text-red-600 mb-1">Zayıf</div>
        <div className="h-1 bg-red-200 rounded w-3/5"></div>
      </div>
    </div>
  </div>
);

const StudentListPreview = () => (
  <div className="w-full h-full bg-white p-4 flex flex-col">
    <div className="flex items-center justify-between mb-3">
      <div className="h-2 bg-gray-300 rounded w-1/3"></div>
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent"></div>
    </div>
    <div className="space-y-2">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-lg p-2 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-secondary flex items-center justify-center text-white text-xs font-bold">
            {i * 2}
          </div>
          <div className="flex-1">
            <div className="h-1.5 bg-gray-200 rounded w-2/3 mb-1"></div>
            <div className="h-1 bg-gray-100 rounded w-1/2"></div>
          </div>
          <div className="flex gap-1">
            <div className="w-4 h-4 rounded bg-green-100"></div>
            <div className="w-4 h-4 rounded bg-blue-100"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const ContentLibraryPreview = () => (
  <div className="w-full h-full bg-white p-4 flex flex-col">
    <div className="flex gap-2 mb-3">
      {['PDF', 'Video', 'Test'].map(type => (
        <div key={type} className="px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-600">
          {type}
        </div>
      ))}
    </div>
    <div className="grid grid-cols-2 gap-2">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3 border border-gray-200">
          <div className="w-full h-12 bg-white rounded mb-2 flex items-center justify-center">
            <div className="text-2xl">{i % 2 === 0 ? '📄' : '📹'}</div>
          </div>
          <div className="h-1.5 bg-gray-200 rounded w-full mb-1"></div>
          <div className="h-1 bg-gray-100 rounded w-2/3"></div>
        </div>
      ))}
    </div>
  </div>
);

const WeeklyPlanPreview = () => (
  <div className="w-full h-full bg-white p-4 flex flex-col">
    <div className="flex items-center gap-2 mb-3">
      <div className="text-xl">📅</div>
      <div className="h-2 bg-gradient-to-r from-primary to-accent rounded w-1/2"></div>
    </div>
    <div className="grid grid-cols-7 gap-1 mb-2">
      {['P', 'S', 'Ç', 'P', 'C', 'C', 'P'].map((day, i) => (
        <div key={i} className="text-center">
          <div className="text-xs font-bold text-gray-600 mb-1">{day}</div>
          <div className={`w-full h-16 rounded ${i < 5 ? 'bg-gradient-to-br from-blue-100 to-blue-200' : 'bg-gray-100'
            }`}>
            {i < 5 && (
              <div className="pt-1 px-0.5 space-y-0.5">
                <div className="h-1 bg-blue-300 rounded"></div>
                <div className="h-1 bg-blue-300 rounded"></div>
                <div className="h-1 bg-blue-300 rounded"></div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const QuestionBankPreview = () => (
  <div className="w-full h-full bg-white p-4 flex flex-col">
    <div className="flex items-center justify-between mb-3">
      <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded w-1/3"></div>
      <div className="px-2 py-1 bg-indigo-100 rounded-full text-xs font-bold text-indigo-600">45</div>
    </div>
    <div className="space-y-2">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-2">
          <div className="flex items-start gap-2 mb-2">
            <div className="w-5 h-5 rounded bg-indigo-200 flex items-center justify-center text-xs font-bold text-indigo-700">
              {i}
            </div>
            <div className="flex-1 space-y-1">
              <div className="h-1.5 bg-indigo-200 rounded w-full"></div>
              <div className="h-1.5 bg-indigo-200 rounded w-4/5"></div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1">
            {['A', 'B', 'C', 'D'].map(opt => (
              <div key={opt} className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full border-2 border-indigo-300"></div>
                <div className="h-1 bg-indigo-100 rounded flex-1"></div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const StudentDashboardPreview = () => (
  <div className="w-full h-full bg-white p-4 flex flex-col">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-secondary flex items-center justify-center text-white font-bold">5</div>
        <div>
          <div className="h-2 bg-gray-200 rounded w-16 mb-1"></div>
          <div className="h-1 bg-gray-100 rounded w-12"></div>
        </div>
      </div>
      <div className="text-2xl">🎯</div>
    </div>
    <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg p-3 mb-3 border border-teal-200">
      <div className="flex items-center gap-2 mb-2">
        <div className="text-xl">📊</div>
        <div className="h-2 bg-teal-300 rounded w-1/2"></div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {['%85', '12', '3'].map((stat, i) => (
          <div key={i} className="bg-white rounded p-1.5 text-center">
            <div className="text-xs font-bold text-teal-600">{stat}</div>
          </div>
        ))}
      </div>
    </div>
    <div className="space-y-2">
      {[1, 2].map(i => (
        <div key={i} className="bg-gray-50 rounded-lg p-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-400 to-purple-400"></div>
            <div className="h-1.5 bg-gray-200 rounded w-20"></div>
          </div>
          <div className="px-2 py-1 bg-green-100 rounded text-xs font-bold text-green-600">Yeni</div>
        </div>
      ))}
    </div>
  </div>
);

const AIAssistantPreview = () => (
  <div className="w-full h-full bg-white p-4 flex flex-col">
    <div className="flex-1 space-y-2 mb-3">
      <div className="flex justify-start">
        <div className="bg-blue-50 border border-blue-200 rounded-2xl rounded-tl-none p-2 max-w-[80%]">
          <div className="h-1.5 bg-blue-200 rounded w-32 mb-1"></div>
          <div className="h-1.5 bg-blue-200 rounded w-24"></div>
        </div>
      </div>
      <div className="flex justify-end">
        <div className="bg-gradient-to-br from-primary to-accent rounded-2xl rounded-tr-none p-2 max-w-[80%]">
          <div className="h-1.5 bg-white/70 rounded w-28 mb-1"></div>
          <div className="h-1.5 bg-white/70 rounded w-20"></div>
        </div>
      </div>
      <div className="flex justify-start">
        <div className="bg-blue-50 border border-blue-200 rounded-2xl rounded-tl-none p-2 max-w-[80%]">
          <div className="flex items-center gap-1 mb-1">
            <div className="text-lg">🤖</div>
            <div className="h-1.5 bg-blue-200 rounded w-20"></div>
          </div>
          <div className="h-1.5 bg-blue-200 rounded w-full mb-1"></div>
          <div className="h-1.5 bg-blue-200 rounded w-4/5"></div>
        </div>
      </div>
    </div>
    <div className="flex gap-2">
      <div className="flex-1 h-8 bg-gray-100 rounded-lg"></div>
      <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg"></div>
    </div>
  </div>
);

const LearningMapPreview = () => (
  <div className="w-full h-full bg-gradient-to-br from-cyan-50 to-blue-50 p-4 flex items-center justify-center">
    <div className="relative w-full h-full">
      <div className="absolute top-1/4 left-1/4 w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-xl font-bold text-green-600">95</div>
      </div>
      <div className="absolute top-1/2 right-1/4 w-14 h-14 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-lg font-bold text-yellow-600">72</div>
      </div>
      <div className="absolute bottom-1/4 left-1/3 w-12 h-12 rounded-full bg-gradient-to-br from-red-400 to-red-500 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-sm font-bold text-red-600">45</div>
      </div>
      <svg className="absolute inset-0 w-full h-full" style={{ zIndex: -1 }}>
        <line x1="35%" y1="30%" x2="70%" y2="55%" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="4 4" />
        <line x1="45%" y1="75%" x2="35%" y2="35%" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="4 4" />
      </svg>
    </div>
  </div>
);

const FlashcardPreview = () => (
  <div className="w-full h-full bg-gradient-to-br from-rose-50 to-pink-50 p-4 flex items-center justify-center">
    <div className="w-full max-w-[200px]">
      <div className="bg-white rounded-xl shadow-lg p-4 transform -rotate-6 absolute">
        <div className="h-2 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-1.5 bg-gray-100 rounded w-full mb-1"></div>
        <div className="h-1.5 bg-gray-100 rounded w-5/6"></div>
      </div>
      <div className="bg-white rounded-xl shadow-lg p-4 transform rotate-3 relative border-2 border-rose-200">
        <div className="text-center mb-3">
          <div className="h-2 bg-rose-300 rounded w-2/3 mx-auto mb-2"></div>
          <div className="h-1.5 bg-rose-200 rounded w-full mb-1"></div>
          <div className="h-1.5 bg-rose-200 rounded w-4/5 mx-auto"></div>
        </div>
        <div className="flex justify-center gap-2 mt-4">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">❌</div>
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">✓</div>
        </div>
      </div>
    </div>
  </div>
);

const StudentWeeklyPlanPreview = () => (
  <div className="w-full h-full bg-white p-4 flex flex-col">
    <div className="flex items-center gap-2 mb-3">
      <div className="text-xl">📋</div>
      <div className="h-2 bg-gradient-to-r from-lime-500 to-green-500 rounded w-1/2"></div>
    </div>
    <div className="space-y-2">
      {[1, 2, 3, 4].map((i, idx) => (
        <div key={i} className="flex items-center gap-2">
          <div className={`w-5 h-5 rounded-full ${idx < 2 ? 'bg-green-500' : 'border-2 border-gray-300'
            } flex items-center justify-center text-white text-xs font-bold`}>
            {idx < 2 && '✓'}
          </div>
          <div className="flex-1 bg-gradient-to-r from-lime-50 to-green-50 rounded-lg p-2 border border-lime-200">
            <div className="h-1.5 bg-lime-300 rounded w-3/4 mb-1"></div>
            <div className="flex gap-1 items-center">
              <div className="text-xs">⏰</div>
              <div className="h-1 bg-lime-200 rounded w-12"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const GamificationPreview = () => (
  <div className="w-full h-full bg-gradient-to-br from-amber-50 to-yellow-50 p-4 flex flex-col items-center justify-center">
    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center mb-3 shadow-lg relative">
      <div className="text-3xl">⭐</div>
      <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white">5</div>
    </div>
    <div className="w-full bg-white rounded-lg p-3 border-2 border-amber-200">
      <div className="flex justify-between items-center mb-2">
        <div className="h-2 bg-amber-300 rounded w-1/3"></div>
        <div className="text-sm font-bold text-amber-600">Level 5</div>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 w-3/4"></div>
      </div>
      <div className="flex justify-between mt-3">
        {['🏆', '🎯', '⚡'].map((badge, i) => (
          <div key={i} className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-100 to-yellow-100 flex items-center justify-center text-xl">
            {badge}
          </div>
        ))}
      </div>
    </div>
  </div>
);

const TestimonialCard: React.FC<{ quote: string; name: string; role: string; avatar: string; delay: string }> = ({ quote, name, role, avatar, delay }) => (
  <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 animate-fade-in-up hover:shadow-xl transition-shadow duration-300" style={{ animationDelay: delay }}>
    <div className="flex items-center mb-4">
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-2xl font-bold mr-4">
        {avatar}
      </div>
      <div>
        <p className="font-bold font-poppins text-text-primary text-lg">{name}</p>
        <p className="text-text-secondary text-sm">{role}</p>
      </div>
    </div>
    <div className="flex mb-3">
      {[...Array(5)].map((_, i) => (
        <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
        </svg>
      ))}
    </div>
    <p className="text-text-primary leading-relaxed">"{quote}"</p>
  </div>
);

const StatCard: React.FC<{ value: string; label: string }> = ({ value, label }) => (
  <div className="text-center">
    <div className="text-5xl font-bold font-poppins bg-gradient-to-r from-primary via-accent to-secondary text-transparent bg-clip-text mb-2">
      {value}
    </div>
    <div className="text-text-secondary font-medium">{label}</div>
  </div>
);

const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToAuth }) => {
  const [activeTab, setActiveTab] = useState<'teacher' | 'student'>('teacher');

  return (
    <div className="bg-gradient-to-b from-gray-50 to-white text-text-primary font-sans">
      {/* Header */}
      <header className="p-4 fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md z-50 border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <TedrisLogo />
          <button
            onClick={onNavigateToAuth}
            className="bg-gradient-to-r from-primary to-accent text-white font-semibold px-6 py-2.5 rounded-xl hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
          >
            Giriş Yap / Kayıt Ol
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="pt-32 pb-20 px-4 bg-gradient-to-br from-cyan-50 via-violet-50 to-fuchsia-50 relative overflow-hidden">
        {/* Animated Background Blobs */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-40 right-10 w-96 h-96 bg-gradient-to-br from-violet-400 to-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-20 left-1/2 w-96 h-96 bg-gradient-to-br from-fuchsia-400 to-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg mb-6 animate-fade-in-down border border-violet-200">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-violet-700 font-semibold text-sm">🚀 AI Destekli Eğitim Platformu</span>
              </div>

              <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold font-poppins leading-tight animate-fade-in-down [animation-delay:0.1s] mb-6">
                <span className="block text-gray-900 mb-3">Öğretmenlerin</span>
                <span className="block bg-gradient-to-r from-cyan-600 via-violet-600 to-fuchsia-600 text-transparent bg-clip-text">
                  Zeki Asistanı
                </span>
              </h1>

              <p className="mt-6 text-lg sm:text-xl text-gray-700 animate-fade-in-up [animation-delay:0.2s] leading-relaxed">
                Test hazırlama, analiz ve öğrenci takibi için harcadığınız zamanı <span className="font-bold bg-gradient-to-r from-cyan-600 to-violet-600 text-transparent bg-clip-text">%80 azaltın</span>.
                Yapay zeka ile her öğrencinize kişiselleştirilmiş eğitim deneyimi sunun.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row gap-4 animate-fade-in-up [animation-delay:0.4s]">
                <button
                  onClick={onNavigateToAuth}
                  className="group bg-gradient-to-r from-cyan-600 to-violet-600 text-white font-bold py-4 px-10 rounded-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 text-lg relative overflow-hidden"
                >
                  <span className="relative z-10">Ücretsiz Deneyin</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-fuchsia-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
                <button
                  className="bg-white text-violet-700 border-2 border-violet-300 font-bold py-4 px-10 rounded-xl hover:bg-violet-50 transition-all duration-300 text-lg shadow-md"
                >
                  Demo İzleyin
                </button>
              </div>

              <div className="mt-12 grid grid-cols-3 gap-6 animate-fade-in-up [animation-delay:0.6s]">
                <div className="text-center">
                  <div className="text-4xl font-bold font-poppins bg-gradient-to-r from-cyan-600 to-violet-600 text-transparent bg-clip-text mb-1">
                    10x
                  </div>
                  <div className="text-gray-600 text-sm font-medium">Daha Hızlı</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold font-poppins bg-gradient-to-r from-violet-600 to-fuchsia-600 text-transparent bg-clip-text mb-1">
                    %85
                  </div>
                  <div className="text-gray-600 text-sm font-medium">Zaman Tasarrufu</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold font-poppins bg-gradient-to-r from-fuchsia-600 to-pink-600 text-transparent bg-clip-text mb-1">
                    AI
                  </div>
                  <div className="text-gray-600 text-sm font-medium">Destekli</div>
                </div>
              </div>
            </div>

            {/* Right Visual */}
            <div className="relative animate-fade-in-up [animation-delay:0.3s]">
              <div className="relative">
                {/* Decorative Elements */}
                <div className="absolute -top-6 -left-6 w-24 h-24 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl opacity-20 blur-xl"></div>
                <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-gradient-to-br from-fuchsia-400 to-pink-500 rounded-2xl opacity-20 blur-xl"></div>

                {/* Main Image */}
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white/50 backdrop-blur-sm">
                  <img
                    src="/hero-dashboard.png"
                    alt="TEDRİS Platform Dashboard"
                    className="w-full h-auto"
                  />
                </div>

                {/* Floating Cards */}
                <div className="absolute -left-8 top-1/4 bg-white rounded-xl shadow-xl p-4 animate-float border border-violet-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center text-white text-xl font-bold">
                      ✓
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Test Başarısı</div>
                      <div className="text-lg font-bold text-gray-900">%95</div>
                    </div>
                  </div>
                </div>

                <div className="absolute -right-8 bottom-1/4 bg-white rounded-xl shadow-xl p-4 animate-float animation-delay-2000 border border-cyan-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center text-white text-xl">
                      🤖
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">AI Analiz</div>
                      <div className="text-lg font-bold text-gray-900">Aktif</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* How It Works Section */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold font-poppins text-gray-900 mb-4">Nasıl Çalışır?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Sadece 4 adımda öğrenci başarısını maksimize edin</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            <div className="hidden lg:block absolute top-1/2 -translate-y-1/2 left-0 w-full h-px">
              <svg width="100%" height="2"><line x1="0" y1="1" x2="100%" y2="1" stroke="#E5E7EB" strokeWidth="2" strokeDasharray="8 8" /></svg>
            </div>

            <div className="flex flex-col items-center text-center z-10 animate-fade-in-up">
              <div className="flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white text-4xl font-bold font-poppins mb-4 border-4 border-white shadow-xl">1</div>
              <h3 className="text-xl font-bold font-poppins mb-2 text-gray-900">AI Test Oluştur</h3>
              <p className="text-gray-600">Saniyeler içinde müfredata uygun testler</p>
            </div>
            <div className="flex flex-col items-center text-center z-10 animate-fade-in-up [animation-delay:0.2s]">
              <div className="flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white text-4xl font-bold font-poppins mb-4 border-4 border-white shadow-xl">2</div>
              <h3 className="text-xl font-bold font-poppins mb-2 text-gray-900">Derin Analiz Al</h3>
              <p className="text-gray-600">Konu bazlı güçlü/zayıf yön tespiti</p>
            </div>
            <div className="flex flex-col items-center text-center z-10 animate-fade-in-up [animation-delay:0.4s]">
              <div className="flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-fuchsia-500 to-pink-600 text-white text-4xl font-bold font-poppins mb-4 border-4 border-white shadow-xl">3</div>
              <h3 className="text-xl font-bold font-poppins mb-2 text-gray-900">Kişisel Plan</h3>
              <p className="text-gray-600">Her öğrenciye özel haftalık program</p>
            </div>
            <div className="flex flex-col items-center text-center z-10 animate-fade-in-up [animation-delay:0.6s]">
              <div className="flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-4xl font-bold font-poppins mb-4 border-4 border-white shadow-xl">4</div>
              <h3 className="text-xl font-bold font-poppins mb-2 text-gray-900">Gelişimi İzle</h3>
              <p className="text-gray-600">Görsel raporlar ve öğrenme haritası</p>
            </div>
          </div>
        </div>
      </section>

      {/* Screenshots Section */}
      <section className="py-24 px-4 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold font-poppins text-text-primary mb-4">Platform İçinden Görünümler</h2>
            <p className="text-xl text-text-secondary">Gerçek ekran görüntüleri ile sistemi keşfedin</p>
          </div>

          {/* Tab Selection */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex bg-white rounded-xl p-1 shadow-lg border border-gray-200">
              <button
                onClick={() => setActiveTab('teacher')}
                className={`px-8 py-3 rounded-lg font-semibold transition-all duration-300 ${activeTab === 'teacher'
                  ? 'bg-gradient-to-r from-primary to-accent text-white shadow-md'
                  : 'text-gray-600 hover:text-primary'
                  }`}
              >
                Öğretmen Paneli
              </button>
              <button
                onClick={() => setActiveTab('student')}
                className={`px-8 py-3 rounded-lg font-semibold transition-all duration-300 ${activeTab === 'student'
                  ? 'bg-gradient-to-r from-primary to-accent text-white shadow-md'
                  : 'text-gray-600 hover:text-primary'
                  }`}
              >
                Öğrenci Paneli
              </button>
            </div>
          </div>

          {activeTab === 'teacher' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <ScreenshotCard
                title="AI Test Oluşturucu"
                description="Konuya özel, zorluk seviyesi ayarlanabilir testler saniyeler içinde oluşturun"
                screenshot={<TestCreatorPreview />}
              />
              <ScreenshotCard
                title="Detaylı Analiz Raporları"
                description="Her öğrencinin performansını konu bazında görsel grafiklerle inceleyin"
                screenshot={<AnalysisPreview />}
              />
              <ScreenshotCard
                title="Öğrenci Yönetimi"
                description="Tüm öğrencilerinizi tek yerden yönetin, başarılarını takip edin"
                screenshot={<StudentListPreview />}
              />
              <ScreenshotCard
                title="İçerik Kütüphanesi"
                description="PDF, video ve etkileşimli içerikler yükleyin ve paylaşın"
                screenshot={<ContentLibraryPreview />}
              />
              <ScreenshotCard
                title="Haftalık Program Oluşturucu"
                description="Her öğrenciye özel, günlük çalışma programları hazırlayın"
                screenshot={<WeeklyPlanPreview />}
              />
              <ScreenshotCard
                title="Soru Bankası"
                description="Kendi soru bankanızı oluşturun, öğrencilere test olarak atayın"
                screenshot={<QuestionBankPreview />}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <ScreenshotCard
                title="Kişiselleştirilmiş Dashboard"
                description="Tüm ödevler, testler ve içerikler tek bir yerde organize"
                screenshot={<StudentDashboardPreview />}
              />
              <ScreenshotCard
                title="AI Asistan"
                description="Anlamadığınız konuları yapay zekaya sorun, anında cevap alın"
                screenshot={<AIAssistantPreview />}
              />
              <ScreenshotCard
                title="Öğrenme Haritası"
                description="Hangi konularda güçlü olduğunuzu görsel harita ile keşfedin"
                screenshot={<LearningMapPreview />}
              />
              <ScreenshotCard
                title="Flashcard Sistemi"
                description="Aralıklı tekrar algoritması ile bilgileri kalıcı öğrenin"
                screenshot={<FlashcardPreview />}
              />
              <ScreenshotCard
                title="Haftalık Program"
                description="Size özel hazırlanmış günlük çalışma planını takip edin"
                screenshot={<StudentWeeklyPlanPreview />}
              />
              <ScreenshotCard
                title="Motivasyon Sistemi"
                description="XP, seviye ve rozetler kazanarak öğrenmeyi eğlenceli hale getirin"
                screenshot={<GamificationPreview />}
              />
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold font-poppins text-text-primary mb-4">Güçlü Özellikler</h2>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto">Modern eğitim için ihtiyacınız olan her şey</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon="🤖"
              title="Tedris Zihin"
              description="Google Gemini teknolojisi ile müfredata uygun, zengin içerikli testler saniyeler içinde oluşturun"
              delay="0s"
            />
            <FeatureCard
              icon="📈"
              title="Tedris Analiz"
              description="Her test sonrası öğrencinin güçlü ve zayıf yönlerini, konu bazlı analizlerle detaylı inceleyin"
              delay="0.1s"
            />
            <FeatureCard
              icon="📅"
              title="Tedris Plan"
              description="AI destekli analizlere göre, her öğrenciye özel haftalık çalışma programları oluşturun"
              delay="0.2s"
            />
            <FeatureCard
              icon="📚"
              title="İçerik Kütüphanesi"
              description="PDF, video ve etkileşimli içerik yükleyin. Öğrencilerinize kolayca atayın"
              delay="0s"
            />
            <FeatureCard
              icon="💬"
              title="AI Asistan"
              description="Öğrenciler anlamadıkları konuları 7/24 AI asistana sorarak anında yardım alır"
              delay="0.1s"
            />
            <FeatureCard
              icon="🗺️"
              title="Öğrenme Haritası"
              description="Her öğrencinin konu bazlı yetkinliğini görsel harita üzerinde takip edin"
              delay="0.2s"
            />
            <FeatureCard
              icon="🎴"
              title="Flashcard Sistemi"
              description="Aralıklı tekrar algoritması ile bilgilerin kalıcı öğrenilmesini sağlayın"
              delay="0s"
            />
            <FeatureCard
              icon="💡"
              title="Soru Bankası"
              description="Kendi soru bankanızı oluşturun, öğrencilerinize test olarak atayın"
              delay="0.1s"
            />
            <FeatureCard
              icon="🎮"
              title="Motivasyon Sistemi"
              description="XP, seviye, rozetler ile öğrenme sürecini oyunlaştırın"
              delay="0.2s"
            />
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 px-4 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold font-poppins text-text-primary mb-4">Kullanıcılarımız Ne Diyor?</h2>
            <p className="text-xl text-text-secondary">Gerçek öğretmenlerden gerçek yorumlar</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <TestimonialCard
              quote="Test hazırlama ve analiz için harcadığım zamanı %80 azalttı. Artık her öğrencimle daha verimli ilgilenebiliyorum."
              name="Ayşe Yılmaz"
              role="Matematik Öğretmeni, 8 yıl"
              avatar="AY"
              delay="0s"
            />
            <TestimonialCard
              quote="Öğrencilerimin zayıf olduğu konuları bu kadar net görmek inanılmaz. AI'ın oluşturduğu haftalık planlar sayesinde eksiklerini hızla kapatıyorlar."
              name="Mehmet Öztürk"
              role="Fen Bilimleri Öğretmeni, 12 yıl"
              avatar="MÖ"
              delay="0.2s"
            />
            <TestimonialCard
              quote="Platform sayesinde her öğrencime özel içerik ve test hazırlayabiliyorum. Öğrenci başarım %40 arttı!"
              name="Zeynep Demir"
              role="İngilizce Öğretmeni, 6 yıl"
              avatar="ZD"
              delay="0.4s"
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-to-r from-cyan-600 via-violet-600 to-fuchsia-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-4xl mx-auto py-24 px-4 text-center relative z-10">
          <h2 className="text-5xl font-bold font-poppins text-white mb-6">
            Eğitimde Yeni Döneme Hazır mısınız?
          </h2>
          <p className="text-xl text-white/90 mb-10 leading-relaxed">
            TEDRİS ile öğrencilerinizin gerçek potansiyelini ortaya çıkarın. <br />
            Ücretsiz deneyin, kredi kartı gerektirmez.
          </p>
          <button
            onClick={onNavigateToAuth}
            className="bg-white text-primary font-bold py-5 px-12 rounded-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 text-lg"
          >
            Hemen Ücretsiz Başlayın →
          </button>
          <p className="mt-6 text-white/80 text-sm">
            ⚡ Kurulum gerektirmez · 💳 Kredi kartı istemez · ⏱️ 2 dakikada hazır
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <TedrisLogoWhite />
              <p className="mt-4 text-gray-400">
                Yapay zeka destekli, modern eğitim platformu
              </p>
            </div>
            <div>
              <h4 className="font-bold font-poppins mb-4">Hızlı Linkler</h4>
              <ul className="space-y-2 text-gray-400">
                <li><button onClick={onNavigateToAuth} className="hover:text-white transition-colors">Giriş Yap</button></li>
                <li><button className="hover:text-white transition-colors">Özellikler</button></li>
                <li><button className="hover:text-white transition-colors">Fiyatlandırma</button></li>
                <li><button className="hover:text-white transition-colors">İletişim</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold font-poppins mb-4">Destek</h4>
              <ul className="space-y-2 text-gray-400">
                <li><button className="hover:text-white transition-colors">Yardım Merkezi</button></li>
                <li><button className="hover:text-white transition-colors">SSS</button></li>
                <li><button className="hover:text-white transition-colors">Gizlilik Politikası</button></li>
                <li><button className="hover:text-white transition-colors">Kullanım Koşulları</button></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} TEDRİS. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
