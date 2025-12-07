import React, { useState, useEffect } from 'react';
import {
    isPushNotificationSupported,
    requestNotificationPermission,
    subscribeToPushNotifications,
    isPushSubscribed,
    sendLocalNotification
} from '../services/pushNotificationService';

const NotificationTestPage: React.FC = () => {
    const [isSupported, setIsSupported] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        checkSupport();
    }, []);

    const checkSupport = async () => {
        const supported = isPushNotificationSupported();
        setIsSupported(supported);

        if (supported) {
            const subscribed = await isPushSubscribed();
            setIsSubscribed(subscribed);
            setPermission(Notification.permission);
        }
    };

    const handleRequestPermission = async () => {
        setLoading(true);
        setMessage('');
        try {
            const perm = await requestNotificationPermission();
            setPermission(perm);

            if (perm === 'granted') {
                setMessage('✅ İzin verildi! Şimdi abone olabilirsiniz.');
            } else {
                setMessage('❌ İzin reddedildi. Tarayıcı ayarlarından izin vermelisiniz.');
            }
        } catch (error) {
            setMessage('❌ Hata: ' + (error as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubscribe = async () => {
        setLoading(true);
        setMessage('');
        try {
            const subscription = await subscribeToPushNotifications();
            if (subscription) {
                setIsSubscribed(true);
                setMessage('✅ Push bildirimlere abone oldunuz!');
            }
        } catch (error) {
            setMessage('❌ Hata: ' + (error as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const handleSendTest = async () => {
        setLoading(true);
        setMessage('');
        try {
            await sendLocalNotification('🎉 Test Bildirimi', {
                body: 'Push notification sistemi çalışıyor!',
                icon: '/vite.svg',
                tag: 'test-notification',
                requireInteraction: false
            });
            setMessage('✅ Test bildirimi gönderildi!');
        } catch (error) {
            setMessage('❌ Hata: ' + (error as Error).message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-2xl shadow-lg p-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        📱 Push Notification Test
                    </h1>
                    <p className="text-gray-600 mb-8">
                        Bildirim sistemini test edin
                    </p>

                    {/* Status */}
                    <div className="space-y-4 mb-8">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <span className="font-medium text-gray-700">Tarayıcı Desteği:</span>
                            <span className={`font-bold ${isSupported ? 'text-green-600' : 'text-red-600'}`}>
                                {isSupported ? '✅ Destekleniyor' : '❌ Desteklenmiyor'}
                            </span>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <span className="font-medium text-gray-700">İzin Durumu:</span>
                            <span className={`font-bold ${permission === 'granted' ? 'text-green-600' :
                                    permission === 'denied' ? 'text-red-600' :
                                        'text-yellow-600'
                                }`}>
                                {permission === 'granted' ? '✅ Verildi' :
                                    permission === 'denied' ? '❌ Reddedildi' :
                                        '⚠️ Bekleniyor'}
                            </span>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <span className="font-medium text-gray-700">Abonelik Durumu:</span>
                            <span className={`font-bold ${isSubscribed ? 'text-green-600' : 'text-gray-600'}`}>
                                {isSubscribed ? '✅ Abone' : '⚪ Abone Değil'}
                            </span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-4">
                        {!isSupported && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-red-800 text-sm">
                                    ❌ Tarayıcınız push notifications desteklemiyor.
                                    Chrome, Firefox veya Edge kullanmayı deneyin.
                                </p>
                            </div>
                        )}

                        {isSupported && permission === 'default' && (
                            <button
                                onClick={handleRequestPermission}
                                disabled={loading}
                                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
                            >
                                {loading ? '⏳ Bekleniyor...' : '1️⃣ İzin İste'}
                            </button>
                        )}

                        {isSupported && permission === 'granted' && !isSubscribed && (
                            <button
                                onClick={handleSubscribe}
                                disabled={loading}
                                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 font-medium"
                            >
                                {loading ? '⏳ Abone Oluyor...' : '2️⃣ Push Notifications\'a Abone Ol'}
                            </button>
                        )}

                        {isSupported && permission === 'granted' && isSubscribed && (
                            <button
                                onClick={handleSendTest}
                                disabled={loading}
                                className="w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 font-medium"
                            >
                                {loading ? '⏳ Gönderiliyor...' : '3️⃣ Test Bildirimi Gönder'}
                            </button>
                        )}

                        {permission === 'denied' && (
                            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <p className="text-yellow-800 text-sm mb-2">
                                    ⚠️ Bildirim izni reddedildi. İzin vermek için:
                                </p>
                                <ol className="list-decimal list-inside text-yellow-800 text-sm space-y-1">
                                    <li>Tarayıcı adres çubuğundaki kilit ikonuna tıklayın</li>
                                    <li>Bildirimler için "İzin Ver" seçin</li>
                                    <li>Sayfayı yenileyin</li>
                                </ol>
                            </div>
                        )}
                    </div>

                    {/* Message */}
                    {message && (
                        <div className={`mt-6 p-4 rounded-lg ${message.startsWith('✅') ? 'bg-green-50 border border-green-200' :
                                message.startsWith('❌') ? 'bg-red-50 border border-red-200' :
                                    'bg-blue-50 border border-blue-200'
                            }`}>
                            <p className={`text-sm ${message.startsWith('✅') ? 'text-green-800' :
                                    message.startsWith('❌') ? 'text-red-800' :
                                        'text-blue-800'
                                }`}>
                                {message}
                            </p>
                        </div>
                    )}

                    {/* Info */}
                    <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Bilgi</h3>
                        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                            <li>Service Worker otomatik olarak kaydedildi</li>
                            <li>VAPID keys .env dosyasında tanımlı</li>
                            <li>Test bildirimi local olarak gönderilir</li>
                            <li>Gerçek bildirimler Supabase Edge Function üzerinden gider</li>
                        </ul>
                    </div>

                    {/* Debug Info */}
                    <details className="mt-4">
                        <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900">
                            🔧 Debug Bilgileri
                        </summary>
                        <div className="mt-2 p-4 bg-gray-100 rounded-lg text-xs font-mono">
                            <div>Navigator: {navigator.userAgent}</div>
                            <div>Service Worker: {('serviceWorker' in navigator).toString()}</div>
                            <div>Push Manager: {('PushManager' in window).toString()}</div>
                            <div>Notification API: {('Notification' in window).toString()}</div>
                        </div>
                    </details>
                </div>
            </div>
        </div>
    );
};

export default NotificationTestPage;
