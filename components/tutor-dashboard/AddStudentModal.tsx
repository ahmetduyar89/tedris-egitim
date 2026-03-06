import React, { useState } from 'react';
import { User, Student, UserRole, LearningLoopStatus, Subject } from '../../types';
import { supabase } from '../../services/dbAdapter';

interface AddStudentModalProps {
    tutor: User;
    onClose: () => void;
    onStudentAdded: (newStudent: Student) => void;
}

const AddStudentModal: React.FC<AddStudentModalProps> = ({ tutor, onClose, onStudentAdded }) => {
    const [name, setName] = useState('');
    const [grade, setGrade] = useState(5);
    const [phone, setPhone] = useState('');
    const [parentName, setParentName] = useState('');
    const [parentPhone, setParentPhone] = useState('');
    const [parentEmail, setParentEmail] = useState('');
    const [parentPassword, setParentPassword] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedSubjects, setSelectedSubjects] = useState<Subject[]>([Subject.Science]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        if (selectedSubjects.length === 0) {
            setError('Lütfen en az bir ders seçiniz.');
            setIsSubmitting(false);
            return;
        }

        if (password.length < 6) {
            setError('Şifre en az 6 karakter olmalıdır.');
            setIsSubmitting(false);
            return;
        }

        try {
            // 1. Create Student via Edge Function (Secure & Reliable)
            const { data: authData, error: signupError } = await supabase.functions.invoke('create-student', {
                body: {
                    email: email.trim(),
                    password: password.trim(),
                    name: name.trim(),
                    role: UserRole.Student,
                    grade: grade,
                    tutorId: tutor.id
                }
            });

            if (signupError || !authData?.success) {
                throw new Error(signupError?.message || authData?.error || 'Öğrenci hesabı oluşturulamadı');
            }

            const userId = authData.userId;
            let parentId: string | undefined;
            let actualParentEmail = parentEmail.trim();

            // 2. Create Parent via Edge Function (Optional)
            if (parentName.trim()) {
                const finalParentPassword = parentPassword.trim() || 'veli123456';
                actualParentEmail = parentEmail.trim() || `parent.${userId}.${Date.now()}@tedris.app`;

                const { data: pAuthData, error: pSignupError } = await supabase.functions.invoke('create-student', {
                    body: {
                        email: actualParentEmail,
                        password: finalParentPassword,
                        name: parentName.trim(),
                        role: UserRole.Parent,
                        phone: parentPhone.trim(),
                        studentId: userId
                    }
                });

                if (pSignupError || !pAuthData?.success) {
                    console.error('❌ Veli Edge Function hatası:', pSignupError || pAuthData?.error);
                    alert(`⚠️ Öğrenci eklendi ancak veli hesabı oluşturulamadı.\n\nHata: ${pSignupError?.message || pAuthData?.error}`);
                } else {
                    parentId = pAuthData.userId;
                    alert(`✅ Veli hesabı başarıyla oluşturuldu!\n\nE-posta: ${actualParentEmail}\nŞifre: ${finalParentPassword}`);
                }
            }

            const newStudent: Student = {
                id: userId,
                name: name.trim(),
                grade: grade,
                tutorId: tutor.id,
                contact: phone.trim(),
                parentName: parentName.trim(),
                parentPhone: parentPhone.trim(),
                parentEmail: actualParentEmail,
                parentId: parentId,
                level: 1,
                xp: 0,
                badges: [],
                learningLoopStatus: LearningLoopStatus.Initial,
                progressReports: [],
                isAiAssistantEnabled: true,
                subjects: selectedSubjects,
            };

            if (authData.linked) {
                alert('Bu öğrenci zaten sistemde kayıtlı. Başarıyla listenize eklendi! ✅');
            } else {
                alert('Öğrenci başarıyla oluşturuldu! ✅');
            }

            onStudentAdded(newStudent);
            onClose();
        } catch (error: any) {
            console.error("Error creating student:", error);
            if (error.message?.includes('already registered') || error.message?.includes('already exists')) {
                setError('Bu e-posta adresi zaten kullanılıyor.');
            } else if (error.message?.includes('Password')) {
                setError('Şifre en az 6 karakter olmalıdır.');
            } else {
                setError(error.message || 'Öğrenci oluşturulurken bir hata oluştu.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-md max-h-[95vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold font-poppins text-gray-800">Yeni Öğrenci Ekle</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Öğrenci Adı Soyadı</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                            className="w-full border border-gray-300 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary outline-none transition-all"
                            placeholder="Ad Soyad"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sınıf Seviyesi</label>
                        <select
                            value={grade}
                            onChange={e => setGrade(parseInt(e.target.value, 10))}
                            className="w-full border border-gray-300 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary outline-none transition-all bg-white"
                        >
                            <option value={4}>İlkokul</option>
                            {[5, 6, 7, 8, 9, 10, 11, 12].map(g => <option key={g} value={g}>{g}. Sınıf</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Verilecek Dersler</label>
                        <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-xl border border-gray-200">
                            {Object.values(Subject).map((subj) => (
                                <label key={subj} className="flex items-center space-x-2 cursor-pointer p-1">
                                    <input
                                        type="checkbox"
                                        checked={selectedSubjects.includes(subj)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedSubjects([...selectedSubjects, subj]);
                                            } else {
                                                setSelectedSubjects(selectedSubjects.filter(s => s !== subj));
                                            }
                                        }}
                                        className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4"
                                    />
                                    <span className="text-sm text-gray-700">{subj}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Öğrenci Telefon</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            className="w-full border border-gray-300 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary outline-none transition-all"
                            placeholder="5XX XXX XX XX"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Veli Adı Soyadı</label>
                            <input
                                type="text"
                                value={parentName}
                                onChange={e => setParentName(e.target.value)}
                                className="w-full border border-gray-300 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary outline-none transition-all"
                                placeholder="Anne/Baba Adı"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Veli Telefon</label>
                            <input
                                type="tel"
                                value={parentPhone}
                                onChange={e => setParentPhone(e.target.value)}
                                className="w-full border border-gray-300 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary outline-none transition-all"
                                placeholder="5XX XXX XX XX"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Veli E-posta</label>
                        <input
                            type="email"
                            value={parentEmail}
                            onChange={e => setParentEmail(e.target.value)}
                            className="w-full border border-gray-300 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary outline-none transition-all"
                            placeholder="veli@ornek.com"
                        />
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <label className="block text-sm font-medium text-blue-900 mb-1">Veli Şifresi</label>
                        <input
                            type="password"
                            value={parentPassword}
                            onChange={e => setParentPassword(e.target.value)}
                            className="w-full border border-blue-300 rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
                            placeholder={parentName.trim() ? "Veli için şifre belirleyin" : "Önce veli adı giriniz"}
                            disabled={!parentName.trim()}
                        />
                        {!parentName.trim() && (
                            <p className="text-xs text-blue-600 mt-1 italic">Veli hesabı oluşturmak için önce yukarıya veli adını giriniz.</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Öğrenci E-posta</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            className="w-full border border-gray-300 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary outline-none transition-all"
                            placeholder="ornek@ogrenci.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Öğrenci Şifresi</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            className="w-full border border-gray-300 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary outline-none transition-all"
                            placeholder="******"
                        />
                    </div>
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center">
                            <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            {error}
                        </div>
                    )}
                    <div className="pt-2 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-xl hover:bg-gray-200 font-medium transition-colors"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 bg-primary text-white px-4 py-3 rounded-xl hover:bg-primary-dark font-medium transition-colors disabled:opacity-50"
                        >
                            {isSubmitting ? 'Kaydediliyor...' : 'Öğrenciyi Kaydet'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddStudentModal;
