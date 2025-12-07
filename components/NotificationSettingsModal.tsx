import React, { useState, useEffect } from 'react';
import {
    getNotificationPreferences,
    updateNotificationPreferences,
    isPushNotificationSupported,
    subscribeToPushNotifications,
    unsubscribeFromPushNotifications,
    isPushSubscribed
} from '../services/pushNotificationService';

interface NotificationSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    studentId: string;
}

const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
    isOpen,
    onClose,
    studentId
}) => {
    const [preferences, setPreferences] = useState({
        push_enabled: true,
        whatsapp_enabled: true,
        email_enabled: true,
        notify_on_assignment: true,
        notify_on_test: true,
        notify_on_homework: true,
        notify_on_lesson: true,
        notify_on_achievement: true,
        whatsapp_number: '',
        email: ''
    });

    const [isPushSupported, setIsPushSupported] = useState(false);
    const [isPushActive, setIsPushActive] = useState(false);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadPreferences();
            checkPushSupport();
        }
    }, [isOpen, studentId]);

    const loadPreferences = async () => {
        setLoading(true);
        try {
            const prefs = await getNotificationPreferences(studentId);
            if (prefs) {
                setPreferences(prefs);
            }
        } catch (error) {
            console.error('Error loading preferences:', error);
        } finally {
            setLoading(false);
        }
    };

    const checkPushSupport = async () => {
        const supported = isPushNotificationSupported();
        setIsPushSupported(supported);

        if (supported) {
            const subscribed = await isPushSubscribed();
            setIsPushActive(subscribed);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateNotificationPreferences(studentId, preferences);
            alert('Bildirim ayarları kaydedildi!');
            onClose();
        } catch (error) {
            console.error('Error saving preferences:', error);
            alert('Ayarlar kaydedilirken bir hata oluştu.');
        } finally {
            setSaving(false);
        }
    };

    const handlePushToggle = async () => {
        if (!isPushSupported) {
            alert('Tarayıcınız push bildirimleri desteklemiyor.');
            return;
        }

        try {
            if (isPushActive) {
                await unsubscribeFromPushNotifications();
                setIsPushActive(false);
                setPreferences(prev => ({ ...prev, push_enabled: false }));
            } else {
                const subscription = await subscribeToPushNotifications();
                if (subscription) {
                    setIsPushActive(true);
                    setPreferences(prev => ({ ...prev, push_enabled: true }));
                }
            }
        } catch (error) {
            console.error('Error toggling push notifications:', error);
            alert('Push bildirim ayarı değiştirilemedi.');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                    <h2 className="text-2xl font-bold text-gray-900">📱 Bildirim Ayarları</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {loading ? (
                    <div className="p-8 text-center">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
                        <p className="mt-4 text-gray-600">Yükleniyor...</p>
                    </div>
                ) : (
                    <div className="p-6 space-y-6">
                        {/* Notification Channels */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Bildirim Kanalları</h3>
                            <div className="space-y-4">
                                {/* Push Notifications */}
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                    <div className="flex items-center space-x-3">
                                        <div className="text-2xl">🔔</div>
                                        <div>
                                            <p className="font-medium text-gray-900">Push Bildirimleri</p>
                                            <p className="text-sm text-gray-600">
                                                {isPushSupported
                                                    ? 'Tarayıcınıza anında bildirim gelir'
                                                    : 'Tarayıcınız desteklemiyor'
                                                }
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handlePushToggle}
                                        disabled={!isPushSupported}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isPushActive ? 'bg-primary' : 'bg-gray-300'
                                            } ${!isPushSupported ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isPushActive ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                        />
                                    </button>
                                </div>

                                {/* WhatsApp */}
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                    <div className="flex items-center space-x-3">
                                        <div className="text-2xl">💬</div>
                                        <div>
                                            <p className="font-medium text-gray-900">WhatsApp Bildirimleri</p>
                                            <p className="text-sm text-gray-600">WhatsApp üzerinden bildirim</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setPreferences(prev => ({ ...prev, whatsapp_enabled: !prev.whatsapp_enabled }))}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences.whatsapp_enabled ? 'bg-primary' : 'bg-gray-300'
                                            }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences.whatsapp_enabled ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                        />
                                    </button>
                                </div>

                                {/* Email */}
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                    <div className="flex items-center space-x-3">
                                        <div className="text-2xl">📧</div>
                                        <div>
                                            <p className="font-medium text-gray-900">Email Bildirimleri</p>
                                            <p className="text-sm text-gray-600">Email adresinize bildirim</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setPreferences(prev => ({ ...prev, email_enabled: !prev.email_enabled }))}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences.email_enabled ? 'bg-primary' : 'bg-gray-300'
                                            }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences.email_enabled ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                        />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Notification Types */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Bildirim Türleri</h3>
                            <div className="space-y-3">
                                {[
                                    { key: 'notify_on_assignment', icon: '📚', label: 'Ödev Atamaları' },
                                    { key: 'notify_on_test', icon: '📝', label: 'Test Atamaları' },
                                    { key: 'notify_on_homework', icon: '✏️', label: 'Ödev Hatırlatmaları' },
                                    { key: 'notify_on_lesson', icon: '👨‍🏫', label: 'Ders Hatırlatmaları' },
                                    { key: 'notify_on_achievement', icon: '🏆', label: 'Başarı Bildirimleri' }
                                ].map(({ key, icon, label }) => (
                                    <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center space-x-3">
                                            <span className="text-xl">{icon}</span>
                                            <span className="font-medium text-gray-900">{label}</span>
                                        </div>
                                        <button
                                            onClick={() => setPreferences(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences[key as keyof typeof preferences] ? 'bg-primary' : 'bg-gray-300'
                                                }`}
                                        >
                                            <span
                                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences[key as keyof typeof preferences] ? 'translate-x-6' : 'translate-x-1'
                                                    }`}
                                            />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Contact Information */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">İletişim Bilgileri</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        WhatsApp Numarası
                                    </label>
                                    <input
                                        type="tel"
                                        value={preferences.whatsapp_number}
                                        onChange={(e) => setPreferences(prev => ({ ...prev, whatsapp_number: e.target.value }))}
                                        placeholder="+90 555 123 4567"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email Adresi
                                    </label>
                                    <input
                                        type="email"
                                        value={preferences.email}
                                        onChange={(e) => setPreferences(prev => ({ ...prev, email: e.target.value }))}
                                        placeholder="ornek@email.com"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Info Box */}
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <div className="flex items-start space-x-3">
                                <div className="text-2xl">ℹ️</div>
                                <div className="text-sm text-blue-900">
                                    <p className="font-medium mb-1">Bildirimler Hakkında</p>
                                    <ul className="list-disc list-inside space-y-1 text-blue-800">
                                        <li>Push bildirimleri için tarayıcınızın izin vermesi gerekir</li>
                                        <li>WhatsApp bildirimleri için geçerli bir numara girmelisiniz</li>
                                        <li>Email bildirimleri otomatik gönderilir</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-end space-x-3 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        İptal
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? 'Kaydediliyor...' : 'Kaydet'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotificationSettingsModal;
