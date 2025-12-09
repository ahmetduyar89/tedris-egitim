import React from 'react';

const ScienceLearningSection: React.FC = () => {
    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-lg border-2 border-green-200 p-8 md:p-12 text-center">
                {/* Icon */}
                <div className="mb-6">
                    <span className="text-8xl">🔬</span>
                </div>

                {/* Title */}
                <h2 className="text-3xl md:text-4xl font-bold text-green-900 mb-4">
                    Fen Bilimleri Öğrenimi
                </h2>

                {/* Description */}
                <p className="text-lg text-green-700 mb-6 max-w-2xl mx-auto">
                    Bu bölüm şu anda geliştirilme aşamasındadır. Yakında deney kütüphanesi,
                    kavram haritaları ve bilimsel terimler ile burada olacak!
                </p>

                {/* Features List */}
                <div className="bg-white rounded-xl p-6 shadow-md max-w-md mx-auto">
                    <h3 className="font-semibold text-green-900 mb-4">Planlanan Özellikler:</h3>
                    <ul className="text-left space-y-2 text-gray-700">
                        <li className="flex items-center gap-2">
                            <span className="text-green-500">🧪</span>
                            <span>Deney Kütüphanesi</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="text-green-500">🗺️</span>
                            <span>Kavram Haritaları</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="text-green-500">📚</span>
                            <span>Bilimsel Terimler</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="text-green-500">🌍</span>
                            <span>Görsel İçerikler</span>
                        </li>
                    </ul>
                </div>

                {/* Coming Soon Badge */}
                <div className="mt-8">
                    <span className="inline-block bg-green-600 text-white px-6 py-2 rounded-full font-semibold text-sm">
                        🚀 Yakında Gelecek
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ScienceLearningSection;
