import React, { useState } from 'react';
import { Student, Subject, UserRole } from '../../types';
import { supabase } from '../../services/dbAdapter';

interface EditStudentModalProps {
    student: Student;
    onClose: () => void;
    onStudentUpdated: (updatedStudent: Student) => void;
}

const EditStudentModal: React.FC<EditStudentModalProps> = ({ student, onClose, onStudentUpdated }) => {
    const [name, setName] = useState(student.name);
    const [grade, setGrade] = useState(student.grade);
    const [phone, setPhone] = useState(student.contact || '');
    const [parentName, setParentName] = useState(student.parentName || '');
    const [parentPhone, setParentPhone] = useState(student.parentPhone || '');
    const [parentEmail, setParentEmail] = useState(student.parentEmail || '');
    const [parentPassword, setParentPassword] = useState('');
    const [isAiAssistantEnabled, setIsAiAssistantEnabled] = useState(student.isAiAssistantEnabled ?? true);
    const [selectedSubjects, setSelectedSubjects] = useState<Subject[]>(student.subjects || [Subject.Science]);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            const { error: updateError } = await supabase
                .from('students')
                .update({
                    name,
                    grade,
                    is_ai_assistant_enabled: isAiAssistantEnabled,
                    contact: phone,
                    parent_name: parentName,
                    parent_phone: parentPhone,
                    parent_email: parentEmail,
                    subjects: selectedSubjects
                })
                .eq('id', student.id);

            if (updateError) {
                console.error('Error updating student:', updateError);
                if (updateError.message?.includes("column \"subjects\" of relation \"students\" does not exist")) {
                    throw new Error("Veritabanında dersler (subjects) kolonu eksik. Lütfen veritabanı şemasını güncelleyin.");
                }
                throw updateError;
            }

            if (parentName.trim()) {
                const targetId = student.parentId;
                if (targetId) {
                    try {
                        const { error: pUpdateError } = await supabase.functions.invoke('create-student', {
                            body: {
                                action: 'update',
                                userId: targetId,
                                name: parentName.trim(),
                                email: parentEmail.trim(),
                                password: parentPassword.trim() || undefined,
                                role: UserRole.Parent,
                                phone: parentPhone.trim()
                            }
                        });

                        if (pUpdateError) {
                            console.error('❌ Veli güncelleme hatası:', pUpdateError);
                            alert(`⚠️ Veli bilgileri güncellenemedi: ${pUpdateError.message}`);
                        }
                    } catch (err) {
                        console.error('❌ Parent update exception:', err);
                    }
                }
            }

            const updatedStudent = {
                ...student,
                name,
                grade,
                isAiAssistantEnabled,
                contact: phone,
                parentName,
                parentPhone,
                parentEmail,
                subjects: selectedSubjects
            };
            onStudentUpdated(updatedStudent);
            onClose();
        } catch (error: any) {
            setError('Öğrenci güncellenirken bir hata oluştu.');
            console.error('Error updating student:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-md">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold font-poppins text-gray-800">Öğrenci Düzenle</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Öğrenci Adı Soyadı</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full border border-gray-300 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary outline-none transition-all" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sınıf Seviyesi</label>
                        <select value={grade} onChange={e => setGrade(parseInt(e.target.value, 10))} className="w-full border border-gray-300 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary outline-none transition-all bg-white">
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
                        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full border border-gray-300 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary outline-none transition-all" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Veli Adı Soyadı</label>
                            <input type="text" value={parentName} onChange={e => setParentName(e.target.value)} className="w-full border border-gray-300 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary outline-none transition-all" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Veli Telefon</label>
                            <input type="tel" value={parentPhone} onChange={e => setParentPhone(e.target.value)} className="w-full border border-gray-300 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary outline-none transition-all" />
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

                    {parentName.trim() && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <label className="block text-sm font-medium text-blue-900 mb-1">Veli Şifresi (Güncellemek için doldurun)</label>
                            <input
                                type="password"
                                value={parentPassword}
                                onChange={e => setParentPassword(e.target.value)}
                                className="w-full border border-blue-300 rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
                                placeholder="Yeni şifre belirleyin"
                            />
                        </div>
                    )}

                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <label className="flex items-center space-x-3 cursor-pointer">
                            <input type="checkbox" checked={isAiAssistantEnabled} onChange={(e) => setIsAiAssistantEnabled(e.target.checked)} className="w-5 h-5 text-primary rounded border-gray-300" />
                            <div>
                                <span className="text-sm font-semibold text-gray-800">AI Asistan Aktif</span>
                            </div>
                        </label>
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div className="pt-2 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-xl hover:bg-gray-200 font-medium transition-colors">İptal</button>
                        <button type="submit" disabled={isSubmitting} className="flex-1 bg-primary text-white px-4 py-3 rounded-xl hover:bg-primary-dark font-medium transition-colors">Güncelle</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditStudentModal;
