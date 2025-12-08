import React from 'react';
import { User } from '../types';

interface TurkishLearningPageProps {
    user: User;
}

const TurkishLearningPage: React.FC<TurkishLearningPageProps> = ({ user }) => {
    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Türkçe Öğrenimi</h1>
                <p className="text-gray-600 mt-2">
                    Kelime, deyim, atasözü ve kitap okuma yönetimi
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Kelime/Deyim/Atasözü Yönetimi */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-900">
                            📚 İçerik Kütüphanesi
                        </h2>
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                            + Yeni Ekle
                        </button>
                    </div>
                    <div className="space-y-3">
                        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-sm font-medium text-purple-700">Kelimeler</span>
                                    <p className="text-2xl font-bold text-purple-900 mt-1">0</p>
                                </div>
                                <span className="text-3xl">📖</span>
                            </div>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-sm font-medium text-blue-700">Deyimler</span>
                                    <p className="text-2xl font-bold text-blue-900 mt-1">0</p>
                                </div>
                                <span className="text-3xl">💬</span>
                            </div>
                        </div>
                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-sm font-medium text-green-700">Atasözleri</span>
                                    <p className="text-2xl font-bold text-green-900 mt-1">0</p>
                                </div>
                                <span className="text-3xl">🎯</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Kitap Kütüphanesi */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-900">
                            📕 Kitap Kütüphanesi
                        </h2>
                        <button className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
                            + Kitap Ekle
                        </button>
                    </div>
                    <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                        <div className="text-5xl mb-3">📚</div>
                        <p className="text-gray-600 font-medium mb-2">Henüz kitap eklenmemiş</p>
                        <p className="text-sm text-gray-500">
                            Kitap ekleyerek öğrencilerinize atayabilirsiniz
                        </p>
                    </div>
                </div>
            </div>

            {/* Haftalık İçerik Atama */}
            <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    📅 Haftalık İçerik Atama
                </h2>
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                    <div className="text-5xl mb-3">🎓</div>
                    <p className="text-gray-600 font-medium mb-2">Öğrenci seçin</p>
                    <p className="text-sm text-gray-500">
                        Bir öğrenci seçerek haftalık kelime, deyim ve atasözü atayabilirsiniz
                    </p>
                </div>
            </div>

            {/* Öğrenci İlerlemesi */}
            <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    📊 Öğrenci İlerlemesi
                </h2>
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                    <div className="text-5xl mb-3">📈</div>
                    <p className="text-gray-600 font-medium mb-2">İlerleme takibi</p>
                    <p className="text-sm text-gray-500">
                        Öğrencilerinizin Türkçe öğrenme ilerlemesini buradan takip edebilirsiniz
                    </p>
                </div>
            </div>

            {/* Geliştirme Notu */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <span className="text-2xl">🚧</span>
                    <div>
                        <h3 className="font-semibold text-blue-900 mb-1">Geliştirme Aşamasında</h3>
                        <p className="text-sm text-blue-700">
                            Türkçe Öğrenimi modülü aktif olarak geliştirilmektedir.
                            Yakında kelime/deyim/atasözü ekleme, kitap yönetimi ve öğrenci atama özellikleri eklenecektir.
                        </p>
                        <div className="mt-3 space-y-1 text-sm text-blue-600">
                            <p>✅ Database yapısı hazır</p>
                            <p>✅ Backend servisleri hazır</p>
                            <p>🔄 UI geliştiriliyor...</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TurkishLearningPage;
