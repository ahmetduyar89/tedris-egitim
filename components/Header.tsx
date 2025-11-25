import React, { useState, useEffect } from 'react';
import { User, Notification, UserRole } from '../types';
import { getNotificationsForUser, markNotificationsAsRead } from '../services/notificationService';

interface HeaderProps {
  user?: User;
  userName?: string;
  role?: 'admin' | 'tutor' | 'student';
  onLogout: () => void;
  onMenuButtonClick?: () => void;
}

const TedrisLogo = () => (
    <svg width="140" height="35" viewBox="0 0 160 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g style={{ mixBlendMode: 'multiply' }}>
            <circle cx="15" cy="24" r="12" fill="#F05039" />
            <circle cx="33" cy="24" r="12" fill="#F5C542" />
            <circle cx="24" cy="12" r="12" fill="#2BB4A9" />
        </g>
        <text x="50" y="30" fontFamily="Poppins, sans-serif" fontSize="28" fontWeight="800" fill="#000000">TEDRİS</text>
    </svg>
);

const Header: React.FC<HeaderProps> = ({ user, userName, role, onLogout, onMenuButtonClick }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const displayName = userName || user?.name || 'Kullanıcı';
  const userRole = role || (user?.role === UserRole.Tutor ? 'tutor' : user?.role === UserRole.Student ? 'student' : undefined);
  const userId = user?.id;

  useEffect(() => {
    if (userRole === 'tutor' && userId) {
      const loadNotifications = async () => {
        const userNotifications = await getNotificationsForUser(userId);
        setNotifications(userNotifications);
      };

      loadNotifications();
      const interval = setInterval(loadNotifications, 10000);

      return () => {
        clearInterval(interval);
      };
    }
  }, [userId, userRole]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = async (id: string) => {
    await markNotificationsAsRead([id]);
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    setNotifications(updated);
  };

  return (
    <header className="bg-card-background shadow-md p-4 flex justify-between items-center border-b border-border flex-shrink-0 z-20">
      <div className="flex items-center space-x-3">
         {onMenuButtonClick && (
            <button onClick={onMenuButtonClick} className="text-gray-600 hover:text-primary md:hidden">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
        )}
        <TedrisLogo />
      </div>
      <div className="flex items-center space-x-4">
        <span className="text-text-secondary hidden sm:inline">Hoş Geldin, <span className="font-semibold text-text-primary">{displayName}</span></span>

        {userRole === 'tutor' && (
          <div className="relative">
            <button onClick={() => setShowNotifications(!showNotifications)} className="relative text-gray-600 hover:text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-error text-white text-xs font-bold">{unreadCount}</span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg z-20 border" onClick={(e) => e.stopPropagation()}>
                <div className="p-3 font-bold border-b">Bildirimler</div>
                <ul className="max-h-96 overflow-y-auto">
                  {notifications.length > 0 ? [...notifications].map(n => (
                    <li key={n.id} className={`p-3 border-b hover:bg-gray-50 ${!n.read ? 'bg-indigo-50' : ''}`}>
                      <p className="text-sm text-gray-800">{n.message}</p>
                      <div className="text-xs text-gray-500 mt-1 flex justify-between items-center">
                        <span>{new Date(n.timestamp).toLocaleString('tr-TR')}</span>
                        {!n.read && <button onClick={() => handleMarkAsRead(n.id)} className="text-primary hover:underline font-semibold">Okundu</button>}
                      </div>
                    </li>
                  )) : <li className="p-4 text-sm text-gray-500 text-center">Yeni bildirim yok.</li>}
                </ul>
              </div>
            )}
          </div>
        )}

        <button
          onClick={onLogout}
          className="bg-secondary text-white px-4 py-2 rounded-xl hover:bg-red-600 transition duration-200 flex items-center space-x-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
          </svg>
          <span className='hidden sm:inline'>Çıkış Yap</span>
        </button>
      </div>
    </header>
  );
};

export default Header;