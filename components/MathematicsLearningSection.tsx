import React from 'react';

const MathematicsLearningSection: React.FC = () => {
    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-lg border-2 border-blue-200 p-8 md:p-12 text-center">
                {/* Icon */}
                <div className="mb-6">
                    <span className="text-8xl">🔢</span>
                </div>

                {/* Title */}
                <h2 className="text-3xl md:text-4xl font-bold text-blue-900 mb-4">
                    Matematik Öğrenimi
                </h2>

                {/* Description */}
                <p className="text-lg text-blue-700 mb-6 max-w-2xl mx-auto">
                    Bu bölüm şu anda geliştirilme aşamasındadır. Yakında formül kütüphanesi,
                    problem çözüm adımları ve matematik kavramları ile burada olacak!
                </p>

                {/* Features List */}
                <div className="bg-white rounded-xl p-6 shadow-md max-w-md mx-auto">
                    <h3 className="font-semibold text-blue-900 mb-4">Planlanan Özellikler:</h3>
                    <ul className="text-left space-y-2 text-gray-700">
                        <li className="flex items-center gap-2">
                            <span className="text-blue-500">📐</span>
                            <span>Formül Kütüphanesi</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="text-blue-500">📊</span>
                            <span>Problem Çözüm Adımları</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="text-blue-500">🎯</span>
                            <span>Matematik Kavramları</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="text-blue-500">✏️</span>
                            <span>Örnek Sorular</span>
                        </li>
                    </ul>
                </div>

                {/* Coming Soon Badge */}
                <div className="mt-8">
                    <span className="inline-block bg-blue-600 text-white px-6 py-2 rounded-full font-semibold text-sm">
                        🚀 Yakında Gelecek
                    </span>
                </div>
            </div>
        </div>
    );
};

export default MathematicsLearningSection;
