import React, { useState, useCallback, useEffect, Suspense, lazy } from 'react';
import { User, UserRole } from './types';
import LoginPage from './pages/LoginPage';
import LandingPage from './pages/LandingPage';
// Lazy load heavy dashboard components
const TutorDashboard = lazy(() => import('./pages/TutorDashboard'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const PublicSharePage = lazy(() => import('./pages/PublicSharePage'));
const ContentViewerPage = lazy(() => import('./pages/ContentViewerPage'));
import { supabase } from './services/dbAdapter';
import ErrorBoundary from './components/ErrorBoundary';
import { useRealtimeNotifications } from './hooks/useRealtimeNotifications';

type View = 'loading' | 'website' | 'auth' | 'dashboard' | 'public-share' | 'content-viewer';


const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  useRealtimeNotifications(currentUser?.id);
  const [view, setView] = useState<View>('loading');
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [contentId, setContentId] = useState<string | null>(null);

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
      const contentMatch = path.match(/^\/content\/([a-zA-Z0-9]+)$/);
      if (contentMatch) {
        console.log('[App] Content view detected, id:', contentMatch[1]);
        setContentId(contentMatch[1]);
        return contentMatch[1];
      }
      return null;
    };

    const initializeAuth = async () => {
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
              if (userData.role === 'tutor' && userData.status !== 'approved') {
                await supabase.auth.signOut();
                setView('auth');
                return;
              }
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
          const { data: userData, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          if (error) {
            console.error('Error fetching user data:', error);
            await supabase.auth.signOut();
            setView('website');
            return;
          }

          if (userData) {
            if (userData.role === 'tutor' && userData.status !== 'approved') {
              await supabase.auth.signOut();
              setView('website');
              return;
            }
            setCurrentUser(userData as User);
            setView('dashboard');
          } else {
            console.error('User data not found in database!');
            await supabase.auth.signOut();
            setView('website');
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          await supabase.auth.signOut();
          setView('website');
        }
      } else {
        setView('website');
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
          setView('website');
          return;
        }

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
              return;
            }

            if (userData) {
              if (userData.role === 'tutor' && userData.status !== 'approved') {
                await supabase.auth.signOut();
                return;
              }
              setCurrentUser(userData as User);
              setView('dashboard');
            } else {
              console.error('User data not found in database!');
              await supabase.auth.signOut();
            }
          } catch (error) {
            console.error('Error fetching user data:', error);
            await supabase.auth.signOut();
          }
        } else {
          setCurrentUser(null);
          setView('website');
        }
      })();
    });

    return () => {
      window.removeEventListener('popstate', handlePopState);
      subscription.unsubscribe();
    };
  }, []);

  const handleLogin = useCallback((user: User) => {
    setCurrentUser(user);
    setView('dashboard');
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout Error:', error);
    }
    setCurrentUser(null);
    setView('website');
  }, []);

  const handleNavigateToAuth = useCallback(() => {
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
      case 'auth':
        return <LoginPage onLogin={handleLogin} onNavigateToWebsite={handleNavigateToWebsite} />;
      case 'dashboard':
        if (!currentUser) {
          setView('auth'); // Should not happen due to auth listener, but as a fallback
          return null;
        }
        if (currentUser.is_admin) {
          return <AdminDashboard onLogout={handleLogout} adminName={currentUser.name} />;
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
          default:
            // This case might happen if role is not set, log them out.
            handleLogout();
            return null;
        }
      default:
        // Default to website view if something is wrong.
        return <LandingPage onNavigateToAuth={handleNavigateToAuth} />;
    }
  };

  return (
    <ErrorBoundary>
      <div className="bg-background min-h-screen font-sans text-text-primary">
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Yükleniyor...</div>}>
          {renderContent()}
        </Suspense>
      </div>
    </ErrorBoundary>
  );
};

export default App;