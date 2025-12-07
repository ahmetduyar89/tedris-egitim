import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { supabase } from '../services/dbAdapter';

interface LoginPageProps {
  onLogin: (user: User) => void;
  onNavigateToWebsite: () => void;
}


const TedrisLogo = () => (
  <svg width="200" height="50" viewBox="0 0 200 50" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g style={{ mixBlendMode: 'multiply' }}>
      <circle cx="20" cy="30" r="15" fill="#F05039" />
      <circle cx="42" cy="30" r="15" fill="#F5C542" />
      <circle cx="31" cy="15" r="15" fill="#2BB4A9" />
    </g>
    <text x="60" y="38" fontFamily="Poppins, sans-serif" fontSize="36" fontWeight="800" fill="#000000">TEDRİS</text>
  </svg>
);

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onNavigateToWebsite }) => {
  const [isRegisterView, setIsRegisterView] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.Tutor);
  const [authError, setAuthError] = useState('');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsLoading(true);

    if (isRegisterView && password.length < 6) {
      setAuthError('Şifre en az 6 karakter olmalıdır.');
      setIsLoading(false);
      return;
    }

    try {
      if (isRegisterView) {
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
        });

        if (signUpError) throw signUpError;

        if (authData.user) {
          const newUser = {
            id: authData.user.id,
            name: name.trim(),
            email: email.trim(),
            role,
          };

          const { error: insertError } = await supabase
            .from('users')
            .insert([newUser]);

          if (insertError) throw insertError;

          if (role === UserRole.Tutor) {
            await supabase.auth.signOut();
            setShowApprovalModal(true);
            setEmail('');
            setPassword('');
            setName('');
            setIsRegisterView(false);
            return;
          }

          if (role === UserRole.Student) {
            const { error: studentError } = await supabase
              .from('students')
              .insert([{
                id: authData.user.id,
                name: name.trim(),
                grade: 1,
                tutor_id: null,
              }]);

            if (studentError) throw studentError;
          }

          onLogin({ ...newUser, password: '' });
        }
      } else {
        const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });

        if (signInError) throw signInError;

        if (authData.user) {
          // Verify user exists in our users table
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', authData.user.id)
            .maybeSingle();

          if (userError) throw userError;

          if (!userData) {
            // User record missing – probably deleted. Sign out and show error.
            await supabase.auth.signOut();
            setAuthError('Kullanıcı hesabı bulunamadı. Lütfen yöneticinizle iletişime geçin.');
            return;
          }

          if (userData.role === 'tutor' && userData.status !== 'approved') {
            if (userData.status === 'pending') {
              setAuthError('Hesabınız henüz onaylanmadı. Lütfen yönetici onayını bekleyin.');
            } else if (userData.status === 'rejected') {
              setAuthError('Hesap kaydınız reddedildi. Lütfen yönetici ile iletişime geçin.');
            }
            await supabase.auth.signOut();
            return;
          }

          // For students, also ensure a student record exists
          if (userData.role === 'student') {
            const { data: studentData, error: studentError } = await supabase
              .from('students')
              .select('*')
              .eq('id', authData.user.id)
              .maybeSingle();
            if (studentError) throw studentError;
            if (!studentData) {
              await supabase.auth.signOut();
              setAuthError('Öğrenci kaydı bulunamadı. Lütfen yöneticinizle iletişime geçin.');
              return;
            }
          }

          onLogin(userData as User);
        }
      }
    } catch (error: any) {
      if (error.message?.includes('User already registered')) {
        setAuthError('Bu e-posta adresi zaten kullanılıyor.');
      } else if (error.message?.includes('Invalid login credentials')) {
        setAuthError('Geçersiz e-posta veya şifre.');
      } else if (error.message?.includes('Password should be at least 6 characters')) {
        setAuthError('Şifre en az 6 karakter olmalıdır.');
      } else {
        setAuthError('Bir hata oluştu. Lütfen tekrar deneyin.');
      }
      console.error('Auth Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 relative">
      <div className="p-8 bg-white rounded-xl shadow-lg max-w-md w-full border border-gray-200 mx-4">
        <button
          onClick={onNavigateToWebsite}
          className="absolute top-6 left-6 text-gray-400 hover:text-gray-600 transition-colors"
          title="Ana Sayfaya Dön"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
        </button>

        <div className="flex justify-center mb-6">
          <TedrisLogo />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-1 text-center">
          {isRegisterView ? 'Aramıza Katılın' : 'Tekrar Hoş Geldiniz'}
        </h1>
        <p className="text-gray-600 mb-6 text-center text-sm">
          {isRegisterView ? 'Eğitimde yeni bir deneyim başlıyor' : 'Hesabınıza giriş yapın'}
        </p>

        <form onSubmit={handleAuth} className="space-y-5">
          {isRegisterView && (
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Ad Soyad</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="mt-1 block w-full border-2 border-gray-200 rounded-xl shadow-sm py-3 px-4 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 outline-none"
                placeholder="Adınız ve soyadınız"
              />
            </div>
          )}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">E-posta</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="mt-1 block w-full border-2 border-gray-200 rounded-xl shadow-sm py-3 px-4 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 outline-none"
              placeholder="ornek@email.com"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Şifre</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="mt-1 block w-full border-2 border-gray-200 rounded-xl shadow-sm py-3 px-4 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 outline-none"
              placeholder="••••••••"
            />
          </div>
          {isRegisterView && (
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Rol</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as UserRole)}
                className="mt-1 block w-full border-2 border-gray-200 rounded-xl shadow-sm py-3 px-4 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 outline-none bg-white"
              >
                <option value={UserRole.Tutor}>Öğretmen</option>
                {/* Öğrenci kaydı öğretmen tarafından yapıldığı için bu seçenek kaldırılabilir. */}
                {/* <option value={UserRole.Student}>Öğrenci</option> */}
              </select>
            </div>
          )}
          {authError && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium flex items-start gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 flex-shrink-0 mt-0.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <span>{authError}</span>
            </div>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-primary to-accent text-white font-bold py-3.5 px-4 rounded-xl hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 ease-in-out transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center mt-6"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isRegisterView ? 'Kayıt Yapılıyor...' : 'Giriş Yapılıyor...'}
              </>
            ) : (
              isRegisterView ? 'Kayıt Ol' : 'Giriş Yap'
            )}
          </button>
        </form>

        <p className="text-sm text-center text-gray-600 mt-6">
          {isRegisterView ? 'Zaten bir hesabınız var mı?' : 'Hesabınız yok mu?'}
          <button onClick={() => { setIsRegisterView(!isRegisterView); setAuthError(''); }} className="font-semibold text-primary hover:text-accent transition-colors ml-1">
            {isRegisterView ? 'Giriş Yapın' : 'Kayıt Olun'}
          </button>
        </p>
      </div>

      {showApprovalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-fade-in">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-12 h-12 text-green-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>

              <h2 className="text-2xl font-bold text-text-primary mb-3">
                Kayıt Talebiniz Alındı!
              </h2>

              <p className="text-text-secondary mb-6 leading-relaxed">
                Hesabınız başarıyla oluşturuldu ve yönetici onayı bekliyor.
                Hesabınız onaylandıktan sonra e-posta adresiniz ile giriş yapabileceksiniz.
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 w-full">
                <div className="flex items-start gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                  </svg>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-blue-900 mb-1">
                      Onay Süreci
                    </p>
                    <p className="text-sm text-blue-800">
                      Yönetici hesabınızı gözden geçirip onayladıktan sonra sisteme giriş yapabileceksiniz.
                      Bu işlem genellikle 24 saat içinde tamamlanır.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowApprovalModal(false)}
                className="w-full bg-primary text-white font-bold py-3 px-6 rounded-xl hover:bg-primary-dark transition duration-300 ease-in-out transform hover:-translate-y-1"
              >
                Tamam
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
