import React, { useState, useCallback, useEffect, Suspense, lazy } from 'react';
import { User, UserRole } from './types';
import LoginPage from './pages/LoginPage';
import LandingPage from './pages/LandingPage';
import NotificationTestPage from './pages/NotificationTestPage';
// Lazy load heavy dashboard components
const TutorDashboard = lazy(() => import('./pages/TutorDashboard'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
// const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const ParentDashboard = lazy(() => import('./pages/ParentDashboard'));
const ParentSignupPage = lazy(() => import('./pages/ParentSignupPage'));
const PublicSharePage = lazy(() => import('./pages/PublicSharePage'));
const ContentViewerPage = lazy(() => import('./pages/ContentViewerPage'));
import { supabase } from './services/dbAdapter';
import ErrorBoundary from './components/ErrorBoundary';
import { useRealtimeNotifications } from './hooks/useRealtimeNotifications';

type View = 'loading' | 'website' | 'auth' | 'dashboard' | 'public-share' | 'content-viewer' | 'notification-test' | 'parent-signup';


const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  useRealtimeNotifications(currentUser?.id);
  const [view, setView] = useState<View>('loading');
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [contentId, setContentId] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    const checkForPublicShare = () => {
      const path = window.location.pathname;
      const shareMatch = path.match(/^\/share\/([a-zA-Z0-9]+)$/);
      if (shareMatch) {
        console.log('[App] Public share detected, token:', shareMatch[1]);
        setShareToken(shareMatch[1]);
        setView('public-share');
        return true;
      }
      return false;
    };

    const checkForContentView = () => {
      const path = window.location.pathname;

      // Check for notification test page
      if (path === '/notification-test') {
        setView('notification-test');
        return 'test';
      }

      const contentMatch = path.match(/^\/content\/([a-zA-Z0-9]+)$/);
      if (contentMatch) {
        console.log('[App] Content view detected, id:', contentMatch[1]);
        setContentId(contentMatch[1]);
        return contentMatch[1];
      }
      return null;
    };

    const initializeAuth = async () => {
      try {
        if (checkForPublicShare()) {
          return;
        }

        const contentIdFromUrl = checkForContentView();
        if (contentIdFromUrl) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            try {
              const { data: userData, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle();

              if (error) {
                console.error('Error fetching user data:', error);
                await supabase.auth.signOut();
                setView('auth');
                return;
              }

              if (userData && (userData.role === 'student' || userData.role === 'tutor')) {
                setCurrentUser(userData as User);
                setView('content-viewer');
                return;
              }
            } catch (error) {
              console.error('Error loading user for content view:', error);
            }
          }
          setView('auth');
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          try {
            // 1. Önce profiles tablosunda kontrol et (Yeni sistem)
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();

            if (profileData) {
              setCurrentUser(profileData as User);
              setView('dashboard');
              return;
            }

            // 2. Eğer yoksa users tablosunda kontrol et (Tutor/Student)
            const { data: userData, error } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();

            if (error) {
              console.error('Error fetching user data:', error);
              await supabase.auth.signOut();
              setView('auth');
              return;
            }

            if (userData) {
              setCurrentUser(userData as User);
              setView('dashboard');
            } else {
              // 3. Eğer orada da yoksa parents tablosunda kontrol et (Veli)
              const { data: parentData, error: parentError } = await supabase
                .from('parents')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle();

              if (parentData) {
                setCurrentUser({
                  id: parentData.id,
                  name: parentData.name,
                  email: parentData.email || '',
                  password: '',
                  role: UserRole.Parent
                } as User);
                setView('dashboard');
              } else {
                console.error('User data not found in database!');
                await supabase.auth.signOut();
                setView('auth');
              }
            }
          } catch (error) {
            console.error('Error fetching user data:', error);
            await supabase.auth.signOut();
            setView('auth');
          }
        } else {
          setView('website');
        }
      } catch (error) {
        console.error('Error in initializeAuth:', error);
        setView('auth');
      }
    };

    initializeAuth();

    const handlePopState = () => {
      const path = window.location.pathname;
      if (path.match(/^\/share\/([a-zA-Z0-9]+)$/)) {
        const match = path.match(/^\/share\/([a-zA-Z0-9]+)$/);
        if (match) {
          setShareToken(match[1]);
          setView('public-share');
        }
      } else if (path.match(/^\/content\/([a-zA-Z0-9]+)$/)) {
        const match = path.match(/^\/content\/([a-zA-Z0-9]+)$/);
        if (match && currentUser) {
          setContentId(match[1]);
          setView('content-viewer');
        }
      } else if (path === '/') {
        if (currentUser) {
          setView('dashboard');
        } else {
          setView('website');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);

    // Auth state change listener with debounce to prevent race conditions
    let authChangeTimeout: NodeJS.Timeout | null = null;
    let isProcessingAuthChange = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Cancel previous timeout if exists (debounce)
      if (authChangeTimeout) {
        clearTimeout(authChangeTimeout);
      }

      // Debounce auth changes (100ms)
      authChangeTimeout = setTimeout(async () => {
        // Prevent concurrent processing
        if (isProcessingAuthChange) {
          console.log('[Auth] Skipping concurrent auth change');
          return;
        }

        isProcessingAuthChange = true;

        try {
          console.log('[Auth] Processing auth state change:', event);

          if (event === 'SIGNED_OUT') {
            setCurrentUser(null);
            setView('auth');
            return;
          }

          if (session?.user) {
            try {
              // 1. Önce profiles tablosunda kontrol et
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle();

              if (profileData) {
                setCurrentUser(profileData as User);
                setView('dashboard');
                return;
              }

              // 2. Eğer yoksa users tablosunda kontrol et (öğretmen/öğrenci)
              const { data: userData, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle();

              if (error) {
                console.error('[Auth] Error fetching user data:', error);
                setCurrentUser(null);
                setView('auth');
                return;
              }

              if (userData) {
                // Users tablosunda bulundu (öğretmen veya öğrenci)
                setCurrentUser(userData as User);
                setView('dashboard');
              } else {
                // 3. Eğer orada da yoksa parents tablosunda kontrol et
                const { data: parentData, error: parentError } = await supabase
                  .from('parents')
                  .select('*')
                  .eq('id', session.user.id)
                  .maybeSingle();

                if (parentData) {
                  // Veli bulundu
                  setCurrentUser({
                    id: parentData.id,
                    name: parentData.name,
                    email: parentData.email || '',
                    password: '',
                    role: UserRole.Parent
                  } as User);
                  setView('dashboard');
                } else {
                  console.error('[Auth] User data not found in database!');
                  setCurrentUser(null);
                  setView('auth');
                }
              }
            } catch (error) {
              console.error('[Auth] Error fetching user data:', error);
              setCurrentUser(null);
              setView('auth');
            }
          } else {
            setCurrentUser(null);
            setView('website');
          }
        } catch (error) {
          console.error('[Auth] Error in auth state change:', error);
          setCurrentUser(null);
          setView('auth');
        } finally {
          isProcessingAuthChange = false;
        }
      }, 100); // 100ms debounce
    });

    return () => {
      window.removeEventListener('popstate', handlePopState);

      // Clear timeout on cleanup
      if (authChangeTimeout) {
        clearTimeout(authChangeTimeout);
      }

      subscription.unsubscribe();
    };
  }, []); // Empty dependency - only run once on mount

  const handleLogin = useCallback((user: User) => {
    setCurrentUser(user);
    setView('dashboard');
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      console.log('[Security] Logging out user...');

      // 1. Supabase session'ını global olarak temizle
      await supabase.auth.signOut({ scope: 'global' });

      // 2. Tüm local storage ve session storage'ı temizle
      localStorage.clear();
      sessionStorage.clear();

      console.log('[Security] Storage cleared');
    } catch (error) {
      // Hata olsa bile devam et (Safari private mode vb.)
      console.warn('[Security] Supabase signOut error (continuing anyway):', error);

      // Yine de storage'ı temizle
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (storageError) {
        console.warn('[Security] Storage clear error:', storageError);
      }
    } finally {
      // Her durumda local state'i temizle
      setCurrentUser(null);
      setView('auth');

      console.log('[Security] Redirecting to home...');

      // Cache'i temizlemek için replace kullan (history'ye ekleme)
      // Bu sayede geri tuşu ile dashboard'a dönülemez
      window.location.replace('/');
    }
  }, []);

  const handleNavigateToAuth = useCallback((mode: 'login' | 'register' = 'login') => {
    setAuthMode(mode);
    setView('auth');
  }, []);

  const handleNavigateToWebsite = useCallback(() => {
    setView('website');
  }, []);

  const handleNavigateToContent = useCallback((id: string) => {
    setContentId(id);
    window.history.pushState({}, '', `/content/${id}`);
    setView('content-viewer');
  }, []);

  const handleBackFromContent = useCallback(() => {
    window.history.pushState({}, '', '/');
    setView('dashboard');
    setContentId(null);
  }, []);

  const renderContent = () => {
    if (view === 'loading') {
      return <div className="flex items-center justify-center min-h-screen">Yükleniyor...</div>;
    }

    switch (view) {
      case 'notification-test':
        return <NotificationTestPage />;
      case 'public-share':
        return shareToken ? <PublicSharePage shareToken={shareToken} /> : <div className="flex items-center justify-center min-h-screen">Geçersiz paylaşım linki</div>;
      case 'content-viewer':
        if (!contentId) {
          setView('dashboard');
          return null;
        }
        if (!currentUser) {
          return (
            <div className="flex items-center justify-center min-h-screen flex-col gap-4">
              <p className="text-gray-600">İçeriği görüntülemek için giriş yapmalısınız.</p>
              <button onClick={() => setView('auth')} className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark">
                Giriş Yap
              </button>
            </div>
          );
        }
        return <ContentViewerPage contentId={contentId} user={currentUser} onBack={handleBackFromContent} />;
      case 'website':
        return <LandingPage onNavigateToAuth={handleNavigateToAuth} />;
      case 'parent-signup':
        return <ParentSignupPage onSuccess={() => setView('auth')} onBack={() => setView('auth')} />;
      case 'auth':
        return <LoginPage
          onLogin={handleLogin}
          onNavigateToWebsite={handleNavigateToWebsite}
          initialMode={authMode}
          onParentSignup={() => setView('parent-signup')}
        />;
      case 'dashboard':
        if (!currentUser) {
          setView('auth'); // Should not happen due to auth listener, but as a fallback
          return null;
        }
        /* Admin dashboard removed for simplification */
        if (currentUser.is_admin) {
          return <TutorDashboard user={currentUser} onLogout={handleLogout} onNavigateToContent={handleNavigateToContent} />;
        }
        switch (currentUser.role) {
          case UserRole.Tutor:
            return <TutorDashboard user={currentUser} onLogout={handleLogout} onNavigateToContent={handleNavigateToContent} />;
          case UserRole.Student:
            return <StudentDashboard
              user={currentUser}
              onLogout={handleLogout}
              onNavigateToContent={handleNavigateToContent}
            />;
          case UserRole.Parent:
            return <ParentDashboard user={currentUser} onLogout={handleLogout} />;
          default:
            // This case might happen if role is not set, log them out.
            handleLogout();
            return null;
        }
      default:
        // Default to website view if something is wrong.
        return <LoginPage onLogin={handleLogin} onNavigateToWebsite={handleNavigateToWebsite} initialMode={authMode} />;
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen font-sans">
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Yükleniyor...</div>}>
          {renderContent()}
        </Suspense>
      </div>
    </ErrorBoundary>
  );
};

export default App;