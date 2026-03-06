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
    const [selectedSubjects, setSelectedSubjects] = useState<Subject[]>([Subject.Science]); // Default to Science

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
            const authUrl = `${import.meta.env.VITE_SUPABASE_URL}/auth/v1/signup`;
            const response = await fetch(authUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                },
                body: JSON.stringify({
                    email: email.trim(),
                    password: password.trim(),
                })
            });

            const authData = await response.json();

            if (!response.ok) {
                throw new Error(authData.msg || authData.error_description || 'Kayıt oluşturulamadı');
            }

            if (authData.user || authData.id) {
                const userId = authData.user?.id || authData.id;


                // The tutor (authenticated user) can insert into 'users' table if policies allow, 
                // but usually 'users' table handles its own inserts via trigger or the user themselves.
                // In this app, it seems the tutor inserts the user record.
                const { error: userError } = await supabase
                    .from('users')
                    .insert([{
                        id: userId,
                        email: email.trim(),
                        name: name.trim(),
                        role: UserRole.Student,
                        status: 'approved'
                    }]);

                if (userError) {
                    console.error("User insert error:", userError);
                    throw userError;
                }

                // Create student record using the main client
                // Note: The tutor should have permission to insert into 'students' for their assigned students
                const { error: studentError } = await supabase
                    .from('students')
                    .insert([{
                        id: userId,
                        name: name.trim(),
                        grade: grade,
                        tutor_id: tutor.id,
                        contact: phone.trim(),
                        parent_name: parentName.trim(),
                        parent_phone: parentPhone.trim(),
                        parent_email: parentEmail.trim(),
                        level: 1,
                        xp: 0,
                        learning_loop_status: LearningLoopStatus.Initial,
                        is_ai_assistant_enabled: true,
                        subjects: selectedSubjects
                    }]);

                if (studentError) {
                    console.error("Student insert error:", studentError);
                    if (studentError.message?.includes("column \"subjects\" of relation \"students\" does not exist")) {
                        throw new Error("Veritabanında dersler (subjects) kolonu eksik. Lütfen veritabanı şemasını güncelleyin.");
                    }
                    throw studentError;
                }

                if (parentName.trim() && parentPassword.trim()) {
                    try {
                        const actualParentEmail = parentEmail.trim() || `parent.${userId}.${Date.now()}@tedris.app`;

                        const parentAuthResponse = await fetch(authUrl, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                            },
                            body: JSON.stringify({
                                email: actualParentEmail,
                                password: parentPassword.trim(),
                            })
                        });

                        const parentAuthData = await parentAuthResponse.json();

                        if (parentAuthResponse.ok && (parentAuthData.user || parentAuthData.id)) {
                            const parentId = parentAuthData.user?.id || parentAuthData.id;

                            await supabase
                                .from('parents')
                                .insert([{
                                    id: parentId,
                                    name: parentName.trim(),
                                    phone: parentPhone.trim(),
                                    email: actualParentEmail,
                                    password_hash: 'managed_by_auth'
                                }]);

                            // Ensure parent is also in the users table for consistent role management
                            try {
                                const { error: puError } = await supabase
                                    .from('users')
                                    .insert([{
                                        id: parentId,
                                        email: actualParentEmail,
                                        name: parentName.trim(),
                                        role: UserRole.Parent,
                                        status: 'approved'
                                    }]);
                                if (puError && puError.code !== '23505') { // Ignore if already exists
                                    console.error('❌ Parent user record sync error:', puError);
                                }
                            } catch (e) {
                                console.error('❌ Parent user record sync failed:', e);
                            }

                            // Update student with parent_id
                            await supabase
                                .from('students')
                                .update({ parent_id: parentId })
                                .eq('id', userId);

                            await supabase
                                .from('parent_student_relations')
                                .insert([{
                                    parent_id: parentId,
                                    student_id: userId,
                                    relationship_type: 'vasi'
                                }]);

                            alert(`✅ Veli hesabı başarıyla oluşturuldu!\n\nGiriş Bilgileri:\nAd-Soyad: ${parentName.trim()}\nŞifre: ${parentPassword.trim()}`);
                        }
                    } catch (parentError: any) {
                        console.error('❌ Parent account creation error:', parentError);
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
                    parentEmail: parentEmail.trim(),
                    level: 1,
                    xp: 0,
                    badges: [],
                    learningLoopStatus: LearningLoopStatus.Initial,
                    progressReports: [],
                    isAiAssistantEnabled: true,
                    subjects: selectedSubjects,
                };

                onStudentAdded(newStudent);
                onClose();
                alert('Öğrenci başarıyla oluşturuldu!');
            }
        } catch (error: any) {
            if (error.message?.includes('User already registered') || error.message?.includes('already exists')) {
                setError('Bu e-posta adresi zaten kullanılıyor.');
            } else if (error.message?.includes('Password')) {
                setError('Şifre en az 6 karakter olmalıdır.');
            } else if (error.code === '42501' || error.message?.includes('row-level security')) {
                setError('Yetki hatası: Veritabanı güvenlik politikaları (RLS) öğrenci oluşturmanızı engelliyor.');
            } else {
                setError(error.message || 'Öğrenci oluşturulurken bir hata oluştu.');
            }
            console.error("Error creating student:", error);
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
