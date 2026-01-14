import React, { useState } from 'react';
import { supabase } from '../services/dbAdapter';
import { UserRole } from '../types';

interface ParentSignupPageProps {
    onSuccess: () => void;
    onBack: () => void;
}

const ParentSignupPage: React.FC<ParentSignupPageProps> = ({ onSuccess, onBack }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState(''); // Added name for a better profile
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            // 1. Sign up with Supabase Auth
            // We pass metadata so the trigger can also pick it up, 
            // but we'll also insert manually as requested.
            const { data, error: signupError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name: name,
                        role: UserRole.Parent
                    }
                }
            });

            if (signupError) throw signupError;

            if (data.user) {
                // 2. Manually insert into profiles table as requested
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert([
                        {
                            id: data.user.id,
                            email: email,
                            name: name,
                            role: UserRole.Parent
                        }
                    ]);

                if (profileError) {
                    // If it already exists due to trigger, we can ignore or handle
                    if (profileError.code !== '23505') { // 23505 is unique violation
                        throw profileError;
                    }
                }

                alert('Kayıt başarılı! Giriş yapabilirsiniz.');
                onSuccess();
            }
        } catch (err: any) {
            console.error('Signup error:', err);
            setError(err.message || 'Kayıt sırasında bir hata oluştu.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl shadow-2xl border border-gray-100">
                <div className="text-center">
                    <div className="mx-auto h-16 w-16 bg-indigo-100 rounded-2xl flex items-center justify-center text-3xl shadow-inner">
                        👪
                    </div>
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900 tracking-tight">
                        Veli Kaydı
                    </h2>
                    <p className="mt-2 text-sm text-gray-500 font-medium">
                        Çocuğunuzun eğitim yolculuğuna katılın.
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSignup}>
                    <div className="rounded-md space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">
                                Ad Soyad
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="appearance-none relative block w-full px-4 py-3 border border-gray-200 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all sm:text-sm font-medium bg-gray-50"
                                placeholder="Adınız Soyadınız"
                            />
                        </div>
                        <div>
                            <label htmlFor="email-address" className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">
                                E-posta Adresi
                            </label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="appearance-none relative block w-full px-4 py-3 border border-gray-200 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all sm:text-sm font-medium bg-gray-50"
                                placeholder="veli@example.com"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">
                                Şifre
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="appearance-none relative block w-full px-4 py-3 border border-gray-200 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all sm:text-sm font-medium bg-gray-50"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold border border-red-100 flex items-center gap-3 animate-shake">
                            <span className="text-xl">⚠️</span>
                            {error}
                        </div>
                    )}

                    <div className="flex flex-col gap-4">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-black rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all shadow-lg hover:shadow-indigo-500/30 active:scale-95 disabled:opacity-50"
                        >
                            {isLoading ? 'Kaydediliyor...' : 'Kayıt Ol'}
                        </button>
                        <button
                            type="button"
                            onClick={onBack}
                            className="text-sm font-bold text-gray-400 hover:text-indigo-600 transition-colors py-2"
                        >
                            Geri Dön
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ParentSignupPage;
